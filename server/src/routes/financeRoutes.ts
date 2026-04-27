import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  // Earned Income
  createEarnedIncome,
  getEarnedIncomes,
  getEarnedIncomeById,
  updateEarnedIncome,
  deleteEarnedIncome,
  // Passive Income
  createPassiveIncome,
  getPassiveIncomes,
  getPassiveIncomeById,
  updatePassiveIncome,
  deletePassiveIncome,
  // Expense
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  // Asset
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  // Liability
  createLiability,
  getLiabilities,
  getLiabilityById,
  updateLiability,
  deleteLiability,
  // Summary
  getFinancialSummary,
} from "../controllers/financeController";
import dailyExpenseRoutes from "./dailyExpenseRoutes";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== EARNED INCOME ROUTES ====================
router.post("/earned-income", createEarnedIncome);
router.get("/earned-income", getEarnedIncomes);
router.get("/earned-income/:id", getEarnedIncomeById);
router.put("/earned-income/:id", updateEarnedIncome);
router.delete("/earned-income/:id", deleteEarnedIncome);

// ==================== PASSIVE INCOME ROUTES ====================
router.post("/passive-income", createPassiveIncome);
router.get("/passive-income", getPassiveIncomes);
router.get("/passive-income/:id", getPassiveIncomeById);
router.put("/passive-income/:id", updatePassiveIncome);
router.delete("/passive-income/:id", deletePassiveIncome);

// ==================== EXPENSE ROUTES ====================
router.post("/expense", createExpense);
router.get("/expense", getExpenses);
router.get("/expense/:id", getExpenseById);
router.put("/expense/:id", updateExpense);
router.delete("/expense/:id", deleteExpense);

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

// ==================== SUMMARY ROUTE ====================
router.get("/summary", getFinancialSummary);

// ==================== DAILY EXPENSE ROUTES ====================
router.use("/daily-expenses", dailyExpenseRoutes);

export default router;