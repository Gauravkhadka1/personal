import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { parseNepaliDateFilter, getAvailableNepaliFilters } from "../middleware/nepaliDateFilter";
import {
  createEarnedIncome,
  getEarnedIncomes,
  getEarnedIncomeById,
  updateEarnedIncome,
  deleteEarnedIncome,
  createPassiveIncome,
  getPassiveIncomes,
  getPassiveIncomeById,
  updatePassiveIncome,
  deletePassiveIncome,
  createExpenseCategory,
  getExpenseCategories,
  getExpenseCategoryById,
  updateExpenseCategory,
  deleteExpenseCategory,
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  createLiability,
  getLiabilities,
  getLiabilityById,
  updateLiability,
  deleteLiability,
  getFinancialSummary,
} from "../controllers/financeController";

import {
  createDailyExpense,
  getDailyExpenses,
  getDailyExpenseById,
  updateDailyExpense,
  deleteDailyExpense,
  getExpenseCategorySummary,
} from "../controllers/dailyExpenseController";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== FILTER UTILITIES ====================
router.get("/available-filters", getAvailableNepaliFilters);

// ==================== EARNED INCOME ROUTES ====================
router.post("/earned-income", createEarnedIncome);
router.get("/earned-income", parseNepaliDateFilter, getEarnedIncomes);
router.get("/earned-income/:id", getEarnedIncomeById);
router.put("/earned-income/:id", updateEarnedIncome);
router.delete("/earned-income/:id", deleteEarnedIncome);

// ==================== PASSIVE INCOME ROUTES ====================
router.post("/passive-income", createPassiveIncome);
router.get("/passive-income", parseNepaliDateFilter, getPassiveIncomes);
router.get("/passive-income/:id", getPassiveIncomeById);
router.put("/passive-income/:id", updatePassiveIncome);
router.delete("/passive-income/:id", deletePassiveIncome);

// ==================== EXPENSE ROUTES ====================
router.post('/expense-category', createExpenseCategory);
router.get('/expense-category', parseNepaliDateFilter, getExpenseCategories);
router.get('/expense-category/:id', getExpenseCategoryById);
router.put('/expense-category/:id', updateExpenseCategory);
router.delete('/expense-category/:id', deleteExpenseCategory);

// ==================== ASSET ROUTES ====================
router.post("/asset", createAsset);
router.get("/asset", getAssets);
router.get("/asset/:id", getAssetById);
router.put("/asset/:id", updateAsset);
router.delete("/asset/:id", deleteAsset);

// ==================== LIABILITY ROUTES ====================
router.post("/liability", createLiability);
router.get("/liability", getLiabilities);
router.get("/liability/:id", getLiabilityById);
router.put("/liability/:id", updateLiability);
router.delete("/liability/:id", deleteLiability);

// ==================== DAILY EXPENSE ROUTES ====================
router.post("/daily-expense", createDailyExpense);
router.get("/daily-expense", parseNepaliDateFilter, getDailyExpenses);
router.get("/daily-expense/:id", getDailyExpenseById);
router.put("/daily-expense/:id", updateDailyExpense);
router.delete("/daily-expense/:id", deleteDailyExpense);

// ==================== EXPENSE CATEGORY SUMMARY ====================
router.get("/expense-category-summary", parseNepaliDateFilter, getExpenseCategorySummary);

// ==================== SUMMARY ROUTE ====================
router.get("/summary", parseNepaliDateFilter, getFinancialSummary);

export default router;