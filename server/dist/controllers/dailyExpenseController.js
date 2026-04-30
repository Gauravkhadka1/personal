"use strict";
// server/src/controllers/dailyExpenseController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenseCategorySummary = exports.deleteDailyExpense = exports.updateDailyExpense = exports.getDailyExpenseById = exports.getDailyExpenses = exports.createDailyExpense = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create Daily Expense
const createDailyExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { description, amount, date, expenseCategoryId } = req.body;
        if (!description || amount === undefined || !date || !expenseCategoryId) {
            res.status(400).json({ message: "Description, amount, date, and expense category ID are required" });
            return;
        }
        if (typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        // Verify the expense category exists and belongs to the user
        const expenseCategory = yield prisma.expenseCategory.findFirst({
            where: {
                id: expenseCategoryId,
                userId: Number(userId),
            },
        });
        if (!expenseCategory) {
            res.status(404).json({ message: "Expense category not found" });
            return;
        }
        // Check if expense would exceed category budget
        const totalDailyExpenses = yield prisma.dailyExpense.aggregate({
            where: {
                expenseCategoryId,
                userId: Number(userId),
            },
            _sum: {
                amount: true,
            },
        });
        const currentSpent = totalDailyExpenses._sum.amount || 0;
        const newTotal = currentSpent + amount;
        const remaining = expenseCategory.amount - newTotal;
        const dailyExpense = yield prisma.dailyExpense.create({
            data: {
                description,
                amount,
                date: new Date(date),
                expenseCategoryId,
                userId: Number(userId),
            },
            include: {
                expenseCategory: true,
            },
        });
        res.status(201).json({
            message: remaining < 0
                ? `Warning: This expense exceeds the category budget by $${Math.abs(remaining).toFixed(2)}`
                : "Daily expense created successfully",
            data: dailyExpense,
            budgetInfo: {
                categoryBudget: expenseCategory.amount,
                spent: newTotal,
                remaining: remaining,
            },
        });
    }
    catch (error) {
        console.error("Error creating daily expense:", error);
        res.status(500).json({ message: `Error creating daily expense: ${error.message}` });
    }
});
exports.createDailyExpense = createDailyExpense;
// Replace the existing getDailyExpenses function with this:
const getDailyExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10, expenseCategoryId } = req.query;
        // Get date filter from middleware
        const nepaliFilter = req.nepaliFilter;
        const dateWhereClause = {};
        if ((nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) && (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate)) {
            dateWhereClause.date = {
                gte: nepaliFilter.startDate,
                lte: nepaliFilter.endDate,
            };
        }
        else if (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) {
            dateWhereClause.date = { gte: nepaliFilter.startDate };
        }
        else if (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate) {
            dateWhereClause.date = { lte: nepaliFilter.endDate };
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = Object.assign({ userId: Number(userId) }, dateWhereClause);
        if (expenseCategoryId) {
            whereClause.expenseCategoryId = expenseCategoryId;
        }
        const [dailyExpenses, total] = yield Promise.all([
            prisma.dailyExpense.findMany({
                where: whereClause,
                skip,
                take: limitNum,
                orderBy: { date: 'desc' },
                include: {
                    expenseCategory: {
                        select: {
                            id: true,
                            name: true,
                            amount: true,
                        },
                    },
                },
            }),
            prisma.dailyExpense.count({ where: whereClause }),
        ]);
        // Calculate totals per category
        const expensesByCategory = yield prisma.dailyExpense.groupBy({
            by: ['expenseCategoryId'],
            where: whereClause,
            _sum: {
                amount: true,
            },
        });
        res.json({
            data: dailyExpenses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
            categoryTotals: expensesByCategory,
            filter: {
                nepaliYear: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliYear,
                nepaliMonth: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliMonth,
                nepaliMonthName: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliMonthName,
                dateRange: (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) && (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate) ? {
                    start: nepaliFilter.startDate,
                    end: nepaliFilter.endDate,
                } : null,
            },
        });
    }
    catch (error) {
        console.error("Error fetching daily expenses:", error);
        res.status(500).json({ message: `Error fetching daily expenses: ${error.message}` });
    }
});
exports.getDailyExpenses = getDailyExpenses;
// Get Daily Expense by ID
const getDailyExpenseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const dailyExpense = yield prisma.dailyExpense.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
            include: {
                expenseCategory: {
                    select: {
                        id: true,
                        name: true,
                        amount: true,
                    },
                },
            },
        });
        if (!dailyExpense) {
            res.status(404).json({ message: "Daily expense not found" });
            return;
        }
        res.json({ data: dailyExpense });
    }
    catch (error) {
        console.error("Error fetching daily expense:", error);
        res.status(500).json({ message: `Error fetching daily expense: ${error.message}` });
    }
});
exports.getDailyExpenseById = getDailyExpenseById;
// Update Daily Expense
const updateDailyExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { description, amount, date, expenseCategoryId } = req.body;
        const existingDailyExpense = yield prisma.dailyExpense.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
            include: {
                expenseCategory: true,
            },
        });
        if (!existingDailyExpense) {
            res.status(404).json({ message: "Daily expense not found" });
            return;
        }
        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        if (expenseCategoryId) {
            const expenseCategory = yield prisma.expenseCategory.findFirst({
                where: {
                    id: expenseCategoryId,
                    userId: Number(userId),
                },
            });
            if (!expenseCategory) {
                res.status(404).json({ message: "Expense category not found" });
                return;
            }
        }
        const updatedDailyExpense = yield prisma.dailyExpense.update({
            where: { id },
            data: {
                description: description || existingDailyExpense.description,
                amount: amount !== undefined ? amount : existingDailyExpense.amount,
                date: date ? new Date(date) : existingDailyExpense.date,
                expenseCategoryId: expenseCategoryId || existingDailyExpense.expenseCategoryId,
            },
            include: {
                expenseCategory: true,
            },
        });
        res.json({
            message: "Daily expense updated successfully",
            data: updatedDailyExpense,
        });
    }
    catch (error) {
        console.error("Error updating daily expense:", error);
        res.status(500).json({ message: `Error updating daily expense: ${error.message}` });
    }
});
exports.updateDailyExpense = updateDailyExpense;
// Delete Daily Expense
const deleteDailyExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const existingDailyExpense = yield prisma.dailyExpense.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingDailyExpense) {
            res.status(404).json({ message: "Daily expense not found" });
            return;
        }
        yield prisma.dailyExpense.delete({
            where: { id },
        });
        res.json({ message: "Daily expense deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting daily expense:", error);
        res.status(500).json({ message: `Error deleting daily expense: ${error.message}` });
    }
});
exports.deleteDailyExpense = deleteDailyExpense;
// Get Expense Categories with Remaining Amounts
const getExpenseCategorySummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const nepaliFilter = req.nepaliFilter;
        // Build date filter
        const dateFilter = {};
        if ((nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) && (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate)) {
            dateFilter.date = {
                gte: nepaliFilter.startDate,
                lte: nepaliFilter.endDate,
            };
        }
        else if (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) {
            dateFilter.date = { gte: nepaliFilter.startDate };
        }
        else if (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate) {
            dateFilter.date = { lte: nepaliFilter.endDate };
        }
        const expenseCategories = yield prisma.expenseCategory.findMany({
            where: { userId: Number(userId) },
        });
        const categorySummaries = yield Promise.all(expenseCategories.map((category) => __awaiter(void 0, void 0, void 0, function* () {
            const spent = yield prisma.dailyExpense.aggregate({
                where: Object.assign({ expenseCategoryId: category.id, userId: Number(userId) }, dateFilter),
                _sum: {
                    amount: true,
                },
            });
            const spentAmount = spent._sum.amount || 0;
            const remainingAmount = category.amount - spentAmount;
            const percentageUsed = category.amount > 0 ? (spentAmount / category.amount) * 100 : 0;
            let status = 'good';
            if (remainingAmount < 0) {
                status = 'overspent';
            }
            else if (percentageUsed >= 80) {
                status = 'warning';
            }
            else {
                status = 'good';
            }
            return {
                id: category.id,
                name: category.name,
                budget: category.amount,
                spent: spentAmount,
                remaining: remainingAmount,
                percentageUsed: percentageUsed.toFixed(2),
                status: status,
            };
        })));
        const totalBudget = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
        const totalSpent = categorySummaries.reduce((sum, cat) => sum + cat.spent, 0);
        // FIX: Wrap everything in a 'data' property to match frontend expectations
        res.json({
            data: {
                data: categorySummaries,
                summary: {
                    totalBudget,
                    totalSpent,
                }
            },
            filter: {
                nepaliYear: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliYear,
                nepaliMonth: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliMonth,
                nepaliMonthName: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliMonthName,
                dateRange: (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) && (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate) ? {
                    start: nepaliFilter.startDate,
                    end: nepaliFilter.endDate,
                } : null,
            },
        });
    }
    catch (error) {
        console.error("Error fetching expense category summary:", error);
        res.status(500).json({ message: `Error fetching expense category summary: ${error.message}` });
    }
});
exports.getExpenseCategorySummary = getExpenseCategorySummary;
