"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/paymentRoutes.ts
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const upload_1 = __importDefault(require("../utils/upload"));
const router = (0, express_1.Router)();
router.get("/", paymentController_1.getPayments);
router.get("/client/:clientId", paymentController_1.getPaymentsByClient);
router.post("/", upload_1.default.single("receipt"), paymentController_1.createPayment);
router.put("/:id", upload_1.default.single("receipt"), paymentController_1.updatePayment);
router.delete("/:id", paymentController_1.deletePayment);
exports.default = router;
