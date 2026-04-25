"use strict";
// server/src/routes/policiesRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const policiesController_1 = require("../controllers/policiesController");
const router = (0, express_1.Router)();
// All policy routes require authentication
router.use(authMiddleware_1.authenticateToken);
// Category routes
router.post("/categories", authMiddleware_1.requireAdmin, policiesController_1.createCategory);
router.get("/categories", policiesController_1.getAllCategories);
router.get("/categories/:id", policiesController_1.getCategoryById);
router.put("/categories/:id", authMiddleware_1.requireAdmin, policiesController_1.updateCategory);
router.delete("/categories/:id", authMiddleware_1.requireAdmin, policiesController_1.deleteCategory);
router.post("/categories/reorder", authMiddleware_1.requireAdmin, policiesController_1.reorderCategories); // Add this
// Policy routes
router.post("/policies", authMiddleware_1.requireAdmin, policiesController_1.createPolicy);
router.get("/policies", policiesController_1.getAllPolicies);
router.get("/policies/:id", policiesController_1.getPolicyById);
router.put("/policies/:id", authMiddleware_1.requireAdmin, policiesController_1.updatePolicy);
router.delete("/policies/:id", authMiddleware_1.requireAdmin, policiesController_1.deletePolicy);
router.delete("/policies/:id/permanent", authMiddleware_1.requireAdmin, policiesController_1.permanentlyDeletePolicy);
router.get("/policies/:id/versions", policiesController_1.getPolicyVersions);
router.post("/policies/reorder", authMiddleware_1.requireAdmin, policiesController_1.reorderPolicies); // Add this
exports.default = router;
