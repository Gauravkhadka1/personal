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
const nepaliCalendar_1 = require("../utils/nepaliCalendar");
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
            res.status(400).json({ message: "Amount must be positive number" });
            return;
        }
        const expenseCategory = yield prisma.expenseCategory.findFirst({
            where: { id: expenseCategoryId, userId: Number(userId) },
        });
        if (!expenseCategory) {
            res.status(404).json({ message: "Expense category not found" });
            return;
        }
        const totalDailyExpenses = yield prisma.dailyExpense.aggregate({
            where: { expenseCategoryId, userId: Number(userId) },
            _sum: { amount: true },
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
            include: { expenseCategory: true },
        });
        // Add Nepali date to response
        const nepaliDate = (0, nepaliCalendar_1.getNepaliDateDetails)(new Date(date));
        res.status(201).json({
            message: remaining < 0
                ? `Warning: This expense exceeds the category budget by $${Math.abs(remaining).toFixed(2)}`
                : "Daily expense created successfully",
            data: Object.assign(Object.assign({}, dailyExpense), { nepaliDate: nepaliDate ? (0, nepaliCalendar_1.formatNepaliDate)(new Date(date)) : null }),
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
// Enhanced getDailyExpenses with grouping by Nepali date and category filtering
const getDailyExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 1000, expenseCategoryId } = req.query;
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
                        select: { id: true, name: true, amount: true },
                    },
                },
            }),
            prisma.dailyExpense.count({ where: whereClause }),
        ]);
        // Group expenses by Nepali date
        const groupedByNepaliDate = {};
        for (const expense of dailyExpenses) {
            const nepaliDateInfo = (0, nepaliCalendar_1.getNepaliDateDetails)(expense.date);
            const nepaliDateKey = nepaliDateInfo
                ? `${nepaliDateInfo.year}-${nepaliDateInfo.month}-${nepaliDateInfo.day}`
                : expense.date.toISOString().split('T')[0];
            const nepaliDateDisplay = nepaliDateInfo
                ? (0, nepaliCalendar_1.formatNepaliDate)(expense.date)
                : expense.date.toLocaleDateString();
            if (!groupedByNepaliDate[nepaliDateKey]) {
                groupedByNepaliDate[nepaliDateKey] = {
                    nepaliDate: nepaliDateDisplay,
                    englishDate: expense.date.toISOString().split('T')[0],
                    expenses: [],
                    totalAmount: 0,
                };
            }
            groupedByNepaliDate[nepaliDateKey].expenses.push(expense);
            groupedByNepaliDate[nepaliDateKey].totalAmount += expense.amount;
        }
        // Convert to array and sort by date (most recent first)
        const groupedExpenses = Object.values(groupedByNepaliDate).sort((a, b) => new Date(b.englishDate).getTime() - new Date(a.englishDate).getTime());
        // Calculate totals per category
        const expensesByCategory = yield prisma.dailyExpense.groupBy({
            by: ['expenseCategoryId'],
            where: whereClause,
            _sum: { amount: true },
        });
        res.json({
            data: dailyExpenses,
            groupedByNepaliDate: groupedExpenses,
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
            where: { id, userId: Number(userId) },
            include: {
                expenseCategory: { select: { id: true, name: true, amount: true } },
            },
        });
        if (!dailyExpense) {
            res.status(404).json({ message: "Daily expense not found" });
            return;
        }
        const nepaliDate = (0, nepaliCalendar_1.getNepaliDateDetails)(dailyExpense.date);
        res.json({
            data: Object.assign(Object.assign({}, dailyExpense), { nepaliDate: nepaliDate ? (0, nepaliCalendar_1.formatNepaliDate)(dailyExpense.date) : null })
        });
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
            where: { id, userId: Number(userId) },
            include: { expenseCategory: true },
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
                where: { id: expenseCategoryId, userId: Number(userId) },
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
            include: { expenseCategory: true },
        });
        const nepaliDate = (0, nepaliCalendar_1.getNepaliDateDetails)(updatedDailyExpense.date);
        res.json({
            message: "Daily expense updated successfully",
            data: Object.assign(Object.assign({}, updatedDailyExpense), { nepaliDate: nepaliDate ? (0, nepaliCalendar_1.formatNepaliDate)(updatedDailyExpense.date) : null }),
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
            where: { id, userId: Number(userId) },
        });
        if (!existingDailyExpense) {
            res.status(404).json({ message: "Daily expense not found" });
            return;
        }
        yield prisma.dailyExpense.delete({ where: { id } });
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
                _sum: { amount: true },
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
        res.json({
            data: {
                data: categorySummaries,
                summary: { totalBudget, totalSpent },
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
