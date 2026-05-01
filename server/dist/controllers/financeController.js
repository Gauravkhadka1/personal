"use strict";
// server/src/controllers/financeController.ts
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
exports.getFinancialSummary = exports.deleteLiability = exports.updateLiability = exports.getLiabilityById = exports.getLiabilities = exports.createLiability = exports.deleteAsset = exports.updateAsset = exports.getAssetById = exports.getAssets = exports.createAsset = exports.deleteExpenseCategory = exports.updateExpenseCategory = exports.getExpenseCategoryById = exports.getExpenseCategories = exports.createExpenseCategory = exports.deletePassiveIncome = exports.updatePassiveIncome = exports.getPassiveIncomeById = exports.getPassiveIncomes = exports.createPassiveIncome = exports.deleteEarnedIncome = exports.updateEarnedIncome = exports.getEarnedIncomeById = exports.getEarnedIncomes = exports.createEarnedIncome = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ==================== EARNED INCOME CONTROLLERS ====================
const createEarnedIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, amount, date } = req.body;
        if (!name || amount === undefined) {
            res.status(400).json({ message: "Name and amount are required" });
            return;
        }
        if (typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const earnedIncome = yield prisma.earnedIncome.create({
            data: {
                name,
                amount,
                userId: Number(userId),
                date: date ? new Date(date) : new Date(),
            },
        });
        res.status(201).json({
            message: "Earned income created successfully",
            data: earnedIncome,
        });
    }
    catch (error) {
        console.error("Error creating earned income:", error);
        res.status(500).json({ message: `Error creating earned income: ${error.message}` });
    }
});
exports.createEarnedIncome = createEarnedIncome;
const getEarnedIncomes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [earnedIncomes, total] = yield Promise.all([
            prisma.earnedIncome.findMany({
                where: { userId: Number(userId) },
                skip,
                take: limitNum,
                orderBy: { date: 'desc' },
            }),
            prisma.earnedIncome.count({
                where: { userId: Number(userId) },
            }),
        ]);
        res.json({
            data: earnedIncomes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching earned incomes:", error);
        res.status(500).json({ message: `Error fetching earned incomes: ${error.message}` });
    }
});
exports.getEarnedIncomes = getEarnedIncomes;
const getEarnedIncomeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const earnedIncome = yield prisma.earnedIncome.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!earnedIncome) {
            res.status(404).json({ message: "Earned income not found" });
            return;
        }
        res.json({ data: earnedIncome });
    }
    catch (error) {
        console.error("Error fetching earned income:", error);
        res.status(500).json({ message: `Error fetching earned income: ${error.message}` });
    }
});
exports.getEarnedIncomeById = getEarnedIncomeById;
const updateEarnedIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, amount, date } = req.body;
        const existingIncome = yield prisma.earnedIncome.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingIncome) {
            res.status(404).json({ message: "Earned income not found" });
            return;
        }
        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const updatedIncome = yield prisma.earnedIncome.update({
            where: { id },
            data: {
                name: name || existingIncome.name,
                amount: amount !== undefined ? amount : existingIncome.amount,
                date: date ? new Date(date) : existingIncome.date,
            },
        });
        res.json({
            message: "Earned income updated successfully",
            data: updatedIncome,
        });
    }
    catch (error) {
        console.error("Error updating earned income:", error);
        res.status(500).json({ message: `Error updating earned income: ${error.message}` });
    }
});
exports.updateEarnedIncome = updateEarnedIncome;
const deleteEarnedIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const existingIncome = yield prisma.earnedIncome.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingIncome) {
            res.status(404).json({ message: "Earned income not found" });
            return;
        }
        yield prisma.earnedIncome.delete({
            where: { id },
        });
        res.json({ message: "Earned income deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting earned income:", error);
        res.status(500).json({ message: `Error deleting earned income: ${error.message}` });
    }
});
exports.deleteEarnedIncome = deleteEarnedIncome;
// ==================== PASSIVE INCOME CONTROLLERS ====================
const createPassiveIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, amount, date } = req.body;
        if (!name || amount === undefined) {
            res.status(400).json({ message: "Name and amount are required" });
            return;
        }
        if (typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const passiveIncome = yield prisma.passiveIncome.create({
            data: {
                name,
                amount,
                userId: Number(userId),
                date: date ? new Date(date) : new Date(),
            },
        });
        res.status(201).json({
            message: "Passive income created successfully",
            data: passiveIncome,
        });
    }
    catch (error) {
        console.error("Error creating passive income:", error);
        res.status(500).json({ message: `Error creating passive income: ${error.message}` });
    }
});
exports.createPassiveIncome = createPassiveIncome;
const getPassiveIncomes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [passiveIncomes, total] = yield Promise.all([
            prisma.passiveIncome.findMany({
                where: { userId: Number(userId) },
                skip,
                take: limitNum,
                orderBy: { date: 'desc' },
            }),
            prisma.passiveIncome.count({
                where: { userId: Number(userId) },
            }),
        ]);
        res.json({
            data: passiveIncomes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching passive incomes:", error);
        res.status(500).json({ message: `Error fetching passive incomes: ${error.message}` });
    }
});
exports.getPassiveIncomes = getPassiveIncomes;
const getPassiveIncomeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const passiveIncome = yield prisma.passiveIncome.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!passiveIncome) {
            res.status(404).json({ message: "Passive income not found" });
            return;
        }
        res.json({ data: passiveIncome });
    }
    catch (error) {
        console.error("Error fetching passive income:", error);
        res.status(500).json({ message: `Error fetching passive income: ${error.message}` });
    }
});
exports.getPassiveIncomeById = getPassiveIncomeById;
const updatePassiveIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, amount, date } = req.body;
        const existingIncome = yield prisma.passiveIncome.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingIncome) {
            res.status(404).json({ message: "Passive income not found" });
            return;
        }
        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const updatedIncome = yield prisma.passiveIncome.update({
            where: { id },
            data: {
                name: name || existingIncome.name,
                amount: amount !== undefined ? amount : existingIncome.amount,
                date: date ? new Date(date) : existingIncome.date,
            },
        });
        res.json({
            message: "Passive income updated successfully",
            data: updatedIncome,
        });
    }
    catch (error) {
        console.error("Error updating passive income:", error);
        res.status(500).json({ message: `Error updating passive income: ${error.message}` });
    }
});
exports.updatePassiveIncome = updatePassiveIncome;
const deletePassiveIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const existingIncome = yield prisma.passiveIncome.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingIncome) {
            res.status(404).json({ message: "Passive income not found" });
            return;
        }
        yield prisma.passiveIncome.delete({
            where: { id },
        });
        res.json({ message: "Passive income deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting passive income:", error);
        res.status(500).json({ message: `Error deleting passive income: ${error.message}` });
    }
});
exports.deletePassiveIncome = deletePassiveIncome;
// ==================== EXPENSE CATEGORY CONTROLLERS ====================
const createExpenseCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, amount, date } = req.body;
        if (!name || amount === undefined) {
            res.status(400).json({ message: "Name and amount are required" });
            return;
        }
        if (typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const expenseCategory = yield prisma.expenseCategory.create({
            data: {
                name,
                amount,
                userId: Number(userId),
                date: date ? new Date(date) : new Date(),
            },
        });
        res.status(201).json({
            message: "Expense category created successfully",
            data: expenseCategory,
        });
    }
    catch (error) {
        console.error("Error creating expense category:", error);
        res.status(500).json({ message: `Error creating expense category: ${error.message}` });
    }
});
exports.createExpenseCategory = createExpenseCategory;
// Replace your existing getExpenseCategories with this enhanced version
const getExpenseCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
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
        // Get expense categories with their daily expenses
        const expenseCategories = yield prisma.expenseCategory.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { date: 'desc' },
            include: {
                dailyExpenses: {
                    where: Object.assign({ userId: Number(userId) }, dateWhereClause),
                    select: {
                        amount: true,
                    },
                },
            },
        });
        const total = yield prisma.expenseCategory.count({ where: whereClause });
        // Calculate spent and remaining for each category
        const categoriesWithBudget = expenseCategories.map(category => {
            const spent = category.dailyExpenses.reduce((sum, de) => sum + de.amount, 0);
            const remaining = category.amount - spent;
            const percentageUsed = category.amount > 0 ? (spent / category.amount) * 100 : 0;
            let status = 'good';
            if (remaining < 0) {
                status = 'overspent';
            }
            else if (percentageUsed >= 80) {
                status = 'warning';
            }
            return {
                id: category.id,
                name: category.name,
                budget: category.amount,
                spent,
                remaining,
                percentageUsed: parseFloat(percentageUsed.toFixed(2)),
                status,
                date: category.date,
            };
        });
        res.json({
            data: categoriesWithBudget,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
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
        console.error("Error fetching expense categories:", error);
        res.status(500).json({ message: `Error fetching expense categories: ${error.message}` });
    }
});
exports.getExpenseCategories = getExpenseCategories;
const getExpenseCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const expenseCategory = yield prisma.expenseCategory.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!expenseCategory) {
            res.status(404).json({ message: "Expense category not found" });
            return;
        }
        res.json({ data: expenseCategory });
    }
    catch (error) {
        console.error("Error fetching expense category:", error);
        res.status(500).json({ message: `Error fetching expense category: ${error.message}` });
    }
});
exports.getExpenseCategoryById = getExpenseCategoryById;
const updateExpenseCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, amount, date } = req.body;
        const existingExpenseCategory = yield prisma.expenseCategory.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingExpenseCategory) {
            res.status(404).json({ message: "Expense category not found" });
            return;
        }
        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const updatedExpenseCategory = yield prisma.expenseCategory.update({
            where: { id },
            data: {
                name: name || existingExpenseCategory.name,
                amount: amount !== undefined ? amount : existingExpenseCategory.amount,
                date: date ? new Date(date) : existingExpenseCategory.date,
            },
        });
        res.json({
            message: "Expense category updated successfully",
            data: updatedExpenseCategory,
        });
    }
    catch (error) {
        console.error("Error updating expense category:", error);
        res.status(500).json({ message: `Error updating expense category: ${error.message}` });
    }
});
exports.updateExpenseCategory = updateExpenseCategory;
const deleteExpenseCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const existingExpenseCategory = yield prisma.expenseCategory.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingExpenseCategory) {
            res.status(404).json({ message: "Expense category not found" });
            return;
        }
        yield prisma.expenseCategory.delete({
            where: { id },
        });
        res.json({ message: "Expense category deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting expense category:", error);
        res.status(500).json({ message: `Error deleting expense category: ${error.message}` });
    }
});
exports.deleteExpenseCategory = deleteExpenseCategory;
// ==================== ASSET CONTROLLERS ====================
const createAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, value, date } = req.body;
        if (!name || value === undefined) {
            res.status(400).json({ message: "Name and value are required" });
            return;
        }
        if (typeof value !== 'number' || value <= 0) {
            res.status(400).json({ message: "Value must be a positive number" });
            return;
        }
        const asset = yield prisma.asset.create({
            data: {
                name,
                value,
                userId: Number(userId),
                date: date ? new Date(date) : new Date(),
            },
        });
        res.status(201).json({
            message: "Asset created successfully",
            data: asset,
        });
    }
    catch (error) {
        console.error("Error creating asset:", error);
        res.status(500).json({ message: `Error creating asset: ${error.message}` });
    }
});
exports.createAsset = createAsset;
const getAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [assets, total] = yield Promise.all([
            prisma.asset.findMany({
                where: { userId: Number(userId) },
                skip,
                take: limitNum,
                orderBy: { date: 'desc' },
            }),
            prisma.asset.count({
                where: { userId: Number(userId) },
            }),
        ]);
        res.json({
            data: assets,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching assets:", error);
        res.status(500).json({ message: `Error fetching assets: ${error.message}` });
    }
});
exports.getAssets = getAssets;
const getAssetById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const asset = yield prisma.asset.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!asset) {
            res.status(404).json({ message: "Asset not found" });
            return;
        }
        res.json({ data: asset });
    }
    catch (error) {
        console.error("Error fetching asset:", error);
        res.status(500).json({ message: `Error fetching asset: ${error.message}` });
    }
});
exports.getAssetById = getAssetById;
const updateAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, value, date } = req.body;
        const existingAsset = yield prisma.asset.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingAsset) {
            res.status(404).json({ message: "Asset not found" });
            return;
        }
        if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
            res.status(400).json({ message: "Value must be a positive number" });
            return;
        }
        const updatedAsset = yield prisma.asset.update({
            where: { id },
            data: {
                name: name || existingAsset.name,
                value: value !== undefined ? value : existingAsset.value,
                date: date ? new Date(date) : existingAsset.date,
            },
        });
        res.json({
            message: "Asset updated successfully",
            data: updatedAsset,
        });
    }
    catch (error) {
        console.error("Error updating asset:", error);
        res.status(500).json({ message: `Error updating asset: ${error.message}` });
    }
});
exports.updateAsset = updateAsset;
const deleteAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const existingAsset = yield prisma.asset.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingAsset) {
            res.status(404).json({ message: "Asset not found" });
            return;
        }
        yield prisma.asset.delete({
            where: { id },
        });
        res.json({ message: "Asset deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting asset:", error);
        res.status(500).json({ message: `Error deleting asset: ${error.message}` });
    }
});
exports.deleteAsset = deleteAsset;
// ==================== LIABILITY CONTROLLERS ====================
const createLiability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, value, date } = req.body;
        if (!name || value === undefined) {
            res.status(400).json({ message: "Name and value are required" });
            return;
        }
        if (typeof value !== 'number' || value <= 0) {
            res.status(400).json({ message: "Value must be a positive number" });
            return;
        }
        const liability = yield prisma.liability.create({
            data: {
                name,
                value,
                userId: Number(userId),
                date: date ? new Date(date) : new Date(),
            },
        });
        res.status(201).json({
            message: "Liability created successfully",
            data: liability,
        });
    }
    catch (error) {
        console.error("Error creating liability:", error);
        res.status(500).json({ message: `Error creating liability: ${error.message}` });
    }
});
exports.createLiability = createLiability;
const getLiabilities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [liabilities, total] = yield Promise.all([
            prisma.liability.findMany({
                where: { userId: Number(userId) },
                skip,
                take: limitNum,
                orderBy: { date: 'desc' },
            }),
            prisma.liability.count({
                where: { userId: Number(userId) },
            }),
        ]);
        res.json({
            data: liabilities,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching liabilities:", error);
        res.status(500).json({ message: `Error fetching liabilities: ${error.message}` });
    }
});
exports.getLiabilities = getLiabilities;
const getLiabilityById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const liability = yield prisma.liability.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!liability) {
            res.status(404).json({ message: "Liability not found" });
            return;
        }
        res.json({ data: liability });
    }
    catch (error) {
        console.error("Error fetching liability:", error);
        res.status(500).json({ message: `Error fetching liability: ${error.message}` });
    }
});
exports.getLiabilityById = getLiabilityById;
const updateLiability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, value, date } = req.body;
        const existingLiability = yield prisma.liability.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingLiability) {
            res.status(404).json({ message: "Liability not found" });
            return;
        }
        if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
            res.status(400).json({ message: "Value must be a positive number" });
            return;
        }
        const updatedLiability = yield prisma.liability.update({
            where: { id },
            data: {
                name: name || existingLiability.name,
                value: value !== undefined ? value : existingLiability.value,
                date: date ? new Date(date) : existingLiability.date,
            },
        });
        res.json({
            message: "Liability updated successfully",
            data: updatedLiability,
        });
    }
    catch (error) {
        console.error("Error updating liability:", error);
        res.status(500).json({ message: `Error updating liability: ${error.message}` });
    }
});
exports.updateLiability = updateLiability;
const deleteLiability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const existingLiability = yield prisma.liability.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingLiability) {
            res.status(404).json({ message: "Liability not found" });
            return;
        }
        yield prisma.liability.delete({
            where: { id },
        });
        res.json({ message: "Liability deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting liability:", error);
        res.status(500).json({ message: `Error deleting liability: ${error.message}` });
    }
});
exports.deleteLiability = deleteLiability;
// ==================== SUMMARY CONTROLLER ====================
const getFinancialSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const nepaliFilter = req.nepaliFilter;
        // Build date filter using the 'date' field
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
        // Get all financial data
        const [earnedIncomes, passiveIncomes, expenseCategories, assets, liabilities, dailyExpenses] = yield Promise.all([
            prisma.earnedIncome.findMany({
                where: Object.assign({ userId: Number(userId) }, dateWhereClause)
            }),
            prisma.passiveIncome.findMany({
                where: Object.assign({ userId: Number(userId) }, dateWhereClause)
            }),
            prisma.expenseCategory.findMany({
                where: Object.assign({ userId: Number(userId) }, dateWhereClause)
            }),
            prisma.asset.findMany({
                where: Object.assign({ userId: Number(userId) }, dateWhereClause)
            }),
            prisma.liability.findMany({
                where: Object.assign({ userId: Number(userId) }, dateWhereClause)
            }),
            // Add daily expenses to calculate actual spent amount
            prisma.dailyExpense.findMany({
                where: Object.assign({ userId: Number(userId) }, dateWhereClause),
                select: {
                    amount: true,
                }
            }),
        ]);
        const totalEarnedIncome = earnedIncomes.reduce((sum, item) => sum + item.amount, 0);
        const totalPassiveIncome = passiveIncomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenseCategories.reduce((sum, item) => sum + item.amount, 0);
        const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
        const totalIncome = totalEarnedIncome + totalPassiveIncome;
        const netCashFlow = totalIncome - totalExpenses;
        const netWorth = totalAssets - totalLiabilities;
        // Calculate total daily expenses (actual spent money)
        const totalDailyExpenses = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        // Calculate current cash (Total Income - Actual Daily Expenses)
        const currentCash = totalIncome - totalDailyExpenses;
        res.json({
            data: {
                filter: {
                    nepaliYear: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliYear,
                    nepaliMonth: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliMonth,
                    nepaliMonthName: nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.nepaliMonthName,
                    dateRange: (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) && (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate) ? {
                        start: nepaliFilter.startDate,
                        end: nepaliFilter.endDate,
                    } : null,
                },
                summary: {
                    totalEarnedIncome,
                    totalPassiveIncome,
                    totalIncome,
                    totalExpenses, // This is category budgets
                    totalAssets,
                    totalLiabilities,
                    netCashFlow,
                    netWorth,
                    currentCash, // This is income - actual daily expenses
                    totalDailyExpenses, // Add this to show actual spent amount
                },
                details: {
                    earnedIncomes,
                    passiveIncomes,
                    expenseCategories,
                    assets,
                    liabilities,
                },
            }
        });
    }
    catch (error) {
        console.error("Error fetching financial summary:", error);
        res.status(500).json({ message: `Error fetching financial summary: ${error.message}` });
    }
});
exports.getFinancialSummary = getFinancialSummary;
