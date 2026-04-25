"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const upload_1 = __importDefault(require("../utils/upload"));
const clientController_1 = require("../controllers/clientController");
const router = express_1.default.Router();
// Helper function to generate dynamic field names for Microsoft services
const generateMicrosoftFields = (count) => {
    const fields = [];
    for (let i = 0; i < count; i++) {
        fields.push({
            name: `microsoftServices[${i}][purchaseOrder]`,
            maxCount: 1,
        });
    }
    return fields;
};
// Client routes
router.post("/", upload_1.default.fields([
    { name: "webDesignAgreement", maxCount: 1 },
    { name: "webDesignInstallments[0][receiptFile]", maxCount: 1 },
    { name: "webDesignInstallments[1][receiptFile]", maxCount: 1 },
    { name: "webDesignInstallments[2][receiptFile]", maxCount: 1 },
    { name: "webDesignInstallments[3][receiptFile]", maxCount: 1 },
    ...generateMicrosoftFields(5), // Allow up to 5 Microsoft services
]), clientController_1.createClient);
router.put("/:id", upload_1.default.fields([
    { name: "webDesignAgreement", maxCount: 1 },
    { name: "webDesignInstallment1Receipt", maxCount: 1 },
    { name: "webDesignInstallment2Receipt", maxCount: 1 },
    { name: "webDesignInstallment3Receipt", maxCount: 1 },
    { name: "webDesignInstallment4Receipt", maxCount: 1 },
    { name: "microsoftServices[0][purchaseOrder]", maxCount: 1 },
    { name: "microsoftServices[1][purchaseOrder]", maxCount: 1 },
    { name: "microsoftServices[2][purchaseOrder]", maxCount: 1 },
    { name: "microsoftServices[3][purchaseOrder]", maxCount: 1 },
    { name: "microsoftServices[4][purchaseOrder]", maxCount: 1 },
]), clientController_1.updateClient);
// Get Clients 
router.get("/", clientController_1.getClients);
router.get("/project-timelines/all", clientController_1.getAllProjectTimelines);
router.get("/project-support/ending", clientController_1.getProjectSupportEndClient);
router.get("/project", clientController_1.getClientsForProjectPage);
router.get("/expirypage", clientController_1.getClientsForExpiryPage);
router.get("/counts", clientController_1.getClientCounts);
router.get("/new-clients-counts", clientController_1.getNewClientsCounts);
router.get("/design-counts", clientController_1.getClientDesignCounts);
router.get("/design/clients", clientController_1.getClientsByDesignCriteria);
router.get("/list", clientController_1.getClientsList);
router.get("/:id", clientController_1.getClientById);
router.delete("/:id", clientController_1.deleteClient);
router.delete("/", clientController_1.deleteMultipleClients);
router.patch("/:id/renew-service", clientController_1.renewClientService);
router.patch("/:id/project-status", clientController_1.updateClientProjectStatus);
router.get("/project-comments/:clientId", clientController_1.getProjectComments);
router.post("/project-comments/:clientId", clientController_1.addProjectComment);
router.post("/project-comments/:commentId/like", clientController_1.likeProjectComment);
router.post("/project-comments/:commentId/reply", clientController_1.addReplyToProjectComment);
router.post("/project-comments/replies/:replyId/like", clientController_1.likeProjectCommentReply);
router.put("/project-comments/:commentId", clientController_1.updateProjectComment);
router.delete("/project-comments/:commentId", clientController_1.deleteProjectComment);
// followup Note Start
router.get("/followup-note/:clientId", clientController_1.getFollowupNote);
router.post("/followup-note/:clientId", clientController_1.addFollowupNote);
router.put("/followup-note/:commentId", clientController_1.updateFollowupNote);
router.delete("/followup-note/:commentId", clientController_1.deleteFollowupNote);
// followup Note End
router.get("/files/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(__dirname, "../../uploads", filename);
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        res.status(404).json({ error: "File not found" });
    }
});
router.get("/:id/activities", clientController_1.getClientActivityLogs);
router.post("/:clientId/send-reminder", clientController_1.sendReminderEmail);
exports.default = router;
