"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const nepaliDateFilter_1 = require("../middleware/nepaliDateFilter");
const financeController_1 = require("../controllers/financeController");
const dailyExpenseController_1 = require("../controllers/dailyExpenseController");
const router = express_1.default.Router();
// Apply authentication to all routes
router.use(authMiddleware_1.authenticateToken);
// ==================== FILTER UTILITIES ====================
router.get("/available-filters", nepaliDateFilter_1.getAvailableNepaliFilters);
// ==================== EARNED INCOME ROUTES ====================
router.post("/earned-income", financeController_1.createEarnedIncome);
router.get("/earned-income", nepaliDateFilter_1.parseNepaliDateFilter, financeController_1.getEarnedIncomes);
router.get("/earned-income/:id", financeController_1.getEarnedIncomeById);
router.put("/earned-income/:id", financeController_1.updateEarnedIncome);
router.delete("/earned-income/:id", financeController_1.deleteEarnedIncome);
// ==================== PASSIVE INCOME ROUTES ====================
router.post("/passive-income", financeController_1.createPassiveIncome);
router.get("/passive-income", nepaliDateFilter_1.parseNepaliDateFilter, financeController_1.getPassiveIncomes);
router.get("/passive-income/:id", financeController_1.getPassiveIncomeById);
router.put("/passive-income/:id", financeController_1.updatePassiveIncome);
router.delete("/passive-income/:id", financeController_1.deletePassiveIncome);
// ==================== EXPENSE ROUTES ====================
router.post('/expense-category', financeController_1.createExpenseCategory);
router.get('/expense-category', financeController_1.getExpenseCategories);
router.get('/expense-category/:id', financeController_1.getExpenseCategoryById);
router.put('/expense-category/:id', financeController_1.updateExpenseCategory);
router.delete('/expense-category/:id', financeController_1.deleteExpenseCategory);
// ==================== ASSET ROUTES ====================
router.post("/asset", financeController_1.createAsset);
router.get("/asset", financeController_1.getAssets);
router.get("/asset/:id", financeController_1.getAssetById);
router.put("/asset/:id", financeController_1.updateAsset);
router.delete("/asset/:id", financeController_1.deleteAsset);
// ==================== LIABILITY ROUTES ====================
router.post("/liability", financeController_1.createLiability);
router.get("/liability", financeController_1.getLiabilities);
router.get("/liability/:id", financeController_1.getLiabilityById);
router.put("/liability/:id", financeController_1.updateLiability);
router.delete("/liability/:id", financeController_1.deleteLiability);
// ==================== DAILY EXPENSE ROUTES ====================
router.post("/daily-expense", dailyExpenseController_1.createDailyExpense);
router.get("/daily-expense", nepaliDateFilter_1.parseNepaliDateFilter, dailyExpenseController_1.getDailyExpenses);
router.get("/daily-expense/:id", dailyExpenseController_1.getDailyExpenseById);
router.put("/daily-expense/:id", dailyExpenseController_1.updateDailyExpense);
router.delete("/daily-expense/:id", dailyExpenseController_1.deleteDailyExpense);
// ==================== EXPENSE CATEGORY SUMMARY ====================
router.get("/expense-category-summary", nepaliDateFilter_1.parseNepaliDateFilter, dailyExpenseController_1.getExpenseCategorySummary);
// ==================== SUMMARY ROUTE ====================
router.get("/summary", nepaliDateFilter_1.parseNepaliDateFilter, financeController_1.getFinancialSummary);
exports.default = router;
