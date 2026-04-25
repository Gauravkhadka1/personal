"use strict";
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
exports.getFinancialSummary = exports.deleteLiability = exports.updateLiability = exports.getLiabilityById = exports.getLiabilities = exports.createLiability = exports.deleteAsset = exports.updateAsset = exports.getAssetById = exports.getAssets = exports.createAsset = exports.deleteExpense = exports.updateExpense = exports.getExpenseById = exports.getExpenses = exports.createExpense = exports.deletePassiveIncome = exports.updatePassiveIncome = exports.getPassiveIncomeById = exports.getPassiveIncomes = exports.createPassiveIncome = exports.deleteEarnedIncome = exports.updateEarnedIncome = exports.getEarnedIncomeById = exports.getEarnedIncomes = exports.createEarnedIncome = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ==================== EARNED INCOME CONTROLLERS ====================
const createEarnedIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, amount } = req.body;
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
                orderBy: { createdAt: 'desc' },
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
        const { name, amount } = req.body;
        // Check if earned income exists and belongs to user
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
        // Check if earned income exists and belongs to user
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
        const { name, amount } = req.body;
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
                orderBy: { createdAt: 'desc' },
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
        const { name, amount } = req.body;
        // Check if passive income exists and belongs to user
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
        // Check if passive income exists and belongs to user
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
// ==================== EXPENSE CONTROLLERS ====================
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, amount } = req.body;
        if (!name || amount === undefined) {
            res.status(400).json({ message: "Name and amount are required" });
            return;
        }
        if (typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const expense = yield prisma.expense.create({
            data: {
                name,
                amount,
                userId: Number(userId),
            },
        });
        res.status(201).json({
            message: "Expense created successfully",
            data: expense,
        });
    }
    catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ message: `Error creating expense: ${error.message}` });
    }
});
exports.createExpense = createExpense;
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [expenses, total] = yield Promise.all([
            prisma.expense.findMany({
                where: { userId: Number(userId) },
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.expense.count({
                where: { userId: Number(userId) },
            }),
        ]);
        res.json({
            data: expenses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: `Error fetching expenses: ${error.message}` });
    }
});
exports.getExpenses = getExpenses;
const getExpenseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const expense = yield prisma.expense.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        res.json({ data: expense });
    }
    catch (error) {
        console.error("Error fetching expense:", error);
        res.status(500).json({ message: `Error fetching expense: ${error.message}` });
    }
});
exports.getExpenseById = getExpenseById;
const updateExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, amount } = req.body;
        // Check if expense exists and belongs to user
        const existingExpense = yield prisma.expense.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            res.status(400).json({ message: "Amount must be a positive number" });
            return;
        }
        const updatedExpense = yield prisma.expense.update({
            where: { id },
            data: {
                name: name || existingExpense.name,
                amount: amount !== undefined ? amount : existingExpense.amount,
            },
        });
        res.json({
            message: "Expense updated successfully",
            data: updatedExpense,
        });
    }
    catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ message: `Error updating expense: ${error.message}` });
    }
});
exports.updateExpense = updateExpense;
const deleteExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { id } = req.params;
        // Check if expense exists and belongs to user
        const existingExpense = yield prisma.expense.findFirst({
            where: {
                id,
                userId: Number(userId),
            },
        });
        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        yield prisma.expense.delete({
            where: { id },
        });
        res.json({ message: "Expense deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ message: `Error deleting expense: ${error.message}` });
    }
});
exports.deleteExpense = deleteExpense;
// Add these after the Liability controllers
// ==================== ASSET CONTROLLERS ====================
const createAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, value } = req.body;
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
                orderBy: { createdAt: 'desc' },
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
        const { name, value } = req.body;
        // Check if asset exists and belongs to user
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
        // Check if asset exists and belongs to user
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
        const { name, value } = req.body;
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
                orderBy: { createdAt: 'desc' },
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
        const { name, value } = req.body;
        // Check if liability exists and belongs to user
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
        // Check if liability exists and belongs to user
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
        const [earnedIncomes, passiveIncomes, expenses, assets, liabilities] = yield Promise.all([
            prisma.earnedIncome.findMany({ where: { userId: Number(userId) } }),
            prisma.passiveIncome.findMany({ where: { userId: Number(userId) } }),
            prisma.expense.findMany({ where: { userId: Number(userId) } }),
            prisma.asset.findMany({ where: { userId: Number(userId) } }),
            prisma.liability.findMany({ where: { userId: Number(userId) } }),
        ]);
        const totalEarnedIncome = earnedIncomes.reduce((sum, item) => sum + item.amount, 0);
        const totalPassiveIncome = passiveIncomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
        const totalIncome = totalEarnedIncome + totalPassiveIncome;
        const netCashFlow = totalIncome - totalExpenses;
        const netWorth = totalAssets - totalLiabilities;
        res.json({
            summary: {
                totalEarnedIncome,
                totalPassiveIncome,
                totalIncome,
                totalExpenses,
                totalAssets,
                totalLiabilities,
                netCashFlow,
                netWorth,
            },
            details: {
                earnedIncomes,
                passiveIncomes,
                expenses,
                assets,
                liabilities,
            },
        });
    }
    catch (error) {
        console.error("Error fetching financial summary:", error);
        res.status(500).json({ message: `Error fetching financial summary: ${error.message}` });
    }
});
exports.getFinancialSummary = getFinancialSummary;
