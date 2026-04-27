import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  createDailyExpense,
  getDailyExpenses,
  getDailyExpenseById,
  updateDailyExpense,
  deleteDailyExpense,
  getExpenseCategories,
  getRemainingAmount,
  getAllRemainingAmounts,
  setBudgetLimit,
  getBudgetSettings,
  deleteBudgetSetting,
} from "../controllers/dailyExpenseController";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CATEGORY ROUTES ====================
router.get("/categories", getExpenseCategories);

// ==================== REMAINING AMOUNT ROUTES ====================
router.get("/remaining/:category", getRemainingAmount);
router.get("/remaining/all", getAllRemainingAmounts);

// ==================== BUDGET SETTINGS ROUTES ====================
router.post("/budget", setBudgetLimit);
router.get("/budget", getBudgetSettings);
router.delete("/budget/:category", deleteBudgetSetting);

// ==================== DAILY EXPENSE ROUTES ====================
router.post("/", createDailyExpense);
router.get("/", getDailyExpenses);
router.get("/:id", getDailyExpenseById);
router.put("/:id", updateDailyExpense);
router.delete("/:id", deleteDailyExpense);

export default router;