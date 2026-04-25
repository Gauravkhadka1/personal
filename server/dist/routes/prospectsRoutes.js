"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prospectsController_1 = require("../controllers/prospectsController"); // Optional: Add authentication middleware
const router = (0, express_1.Router)();
// Get all prospects
router.get("/", prospectsController_1.getProspects);
// Create a new prospect
router.post("/", prospectsController_1.createProspect);
// Update prospect status
router.patch("/:prospectId/status", prospectsController_1.updateProspectStatus);
// Edit a prospect
router.put("/:prospectId", prospectsController_1.updateProspect);
// Delete a prospect
router.delete("/:prospectId", prospectsController_1.deleteProspect);
router.get("/prospect-followup-note/:prospectId", prospectsController_1.getProspectFollowupNote);
router.post("/prospect-followup-note/:prospectId", prospectsController_1.addProspectFollowupNote);
router.put("/prospect-followup-note/:commentId", prospectsController_1.updateProspectFollowupNote);
router.delete("/prospect-followup-note/:commentId", prospectsController_1.deleteProspectFollowupNote);
exports.default = router;
