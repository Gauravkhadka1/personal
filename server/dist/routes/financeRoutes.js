"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const financeController_1 = require("../controllers/financeController");
const router = express_1.default.Router();
// Apply authentication to all routes
router.use(authMiddleware_1.authenticateToken);
// ==================== EARNED INCOME ROUTES ====================
router.post("/earned-income", financeController_1.createEarnedIncome);
router.get("/earned-income", financeController_1.getEarnedIncomes);
router.get("/earned-income/:id", financeController_1.getEarnedIncomeById);
router.put("/earned-income/:id", financeController_1.updateEarnedIncome);
router.delete("/earned-income/:id", financeController_1.deleteEarnedIncome);
// ==================== PASSIVE INCOME ROUTES ====================
router.post("/passive-income", financeController_1.createPassiveIncome);
router.get("/passive-income", financeController_1.getPassiveIncomes);
router.get("/passive-income/:id", financeController_1.getPassiveIncomeById);
router.put("/passive-income/:id", financeController_1.updatePassiveIncome);
router.delete("/passive-income/:id", financeController_1.deletePassiveIncome);
// ==================== EXPENSE ROUTES ====================
router.post("/expense", financeController_1.createExpense);
router.get("/expense", financeController_1.getExpenses);
router.get("/expense/:id", financeController_1.getExpenseById);
router.put("/expense/:id", financeController_1.updateExpense);
router.delete("/expense/:id", financeController_1.deleteExpense);
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
// ==================== SUMMARY ROUTE ====================
router.get("/summary", financeController_1.getFinancialSummary);
exports.default = router;
