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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProspectFollowupNote = exports.updateProspectFollowupNote = exports.addProspectFollowupNote = exports.getProspectFollowupNote = exports.deleteProspect = exports.updateProspect = exports.updateProspectStatus = exports.createProspect = exports.getProspects = void 0;
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prospectDeletedEmailTemplate_1 = require("../templates/prospectDeletedEmailTemplate");
const prisma = new client_1.PrismaClient();
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "gauravkhadka111111@gmail.com",
        pass: "catgfxsmwkqrdknh", // Use environment variables for sensitive data
    },
});
function sendMail(to, sub, msg, cc) {
    const mailOptions = {
        to: to,
        subject: sub,
        html: msg,
        cc: cc,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        }
        else {
            console.log("Email Sent:", info.response);
        }
    });
}
const decodeToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '045ffc1dc9a74ea1812af89ec2f03c531a56b144b984ce3f0413ab0e6202e7c6');
        return decoded;
    }
    catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};
// Get all prospects
const getProspects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prospects = yield prisma.prospects.findMany({
            orderBy: {
                inquiryDate: 'desc', // Sort by inquiryDate in descending order (latest first)
            },
            include: {
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
            },
        });
        res.json(prospects);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving prospects: ${error.message}` });
    }
});
exports.getProspects = getProspects;
// Create a new prospect
const createProspect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, status = "New", category, inquiryDate, description } = req.body;
    // Validate required fields
    if (!name || !category) {
        res.status(400).json({ message: "Name and category are required fields." });
        return;
    }
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
    }
    const decodedToken = decodeToken(token);
    if (!decodedToken || !decodedToken.userId) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
        return;
    }
    const creatorId = decodedToken.userId;
    try {
        const newProspect = yield prisma.prospects.create({
            data: {
                name,
                description,
                status, // Defaults to "New" if not provided
                category,
                inquiryDate: inquiryDate ? new Date(inquiryDate) : null,
            },
        });
        yield prisma.activityLog.create({
            data: {
                action: "CREATE",
                details: null,
                userId: creatorId,
                prospectId: newProspect.id,
            },
        });
        res.status(201).json(newProspect);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating a prospect: ${error.message}` });
    }
});
exports.createProspect = createProspect;
// Update prospect status
const updateProspectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { prospectId } = req.params;
    const { status } = req.body; // Remove updatedBy from here
    try {
        // Verify token first
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const decodedToken = decodeToken(token);
        if (!decodedToken || !decodedToken.userId) {
            res.status(401).json({ message: "Unauthorized: Invalid token" });
            return;
        }
        const userId = decodedToken.userId;
        const existingProspect = yield prisma.prospects.findUnique({
            where: { id: Number(prospectId) },
        });
        if (!existingProspect) {
            res.status(404).json({ message: "Prospect not found" });
            return;
        }
        const previousStatus = existingProspect.status;
        const prospectName = existingProspect.name;
        // Get the updating user details
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the prospect" });
            return;
        }
        // Create activity log first
        const activityLog = yield prisma.activityLog.create({
            data: {
                action: "STATUS_UPDATE",
                details: `${previousStatus}|${status}`,
                userId: Number(userId),
                prospectId: Number(prospectId),
            },
        });
        // Then update the prospect
        const updatedProspect = yield prisma.prospects.update({
            where: { id: Number(prospectId) },
            data: { status },
        });
        const emailSubject = `Prospect Status Updated: ${prospectName}`;
        const emailMessage = `
      <p><strong>${updatingUser.username}</strong> updated the prospect <strong>${prospectName}</strong>.</p>
      <p>Status changed from <strong>${previousStatus}</strong> to <strong>${status}</strong>.</p>
    `;
        sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
        res.json(updatedProspect);
    }
    catch (error) {
        console.error("Error in updateProspectStatus:", error);
        res.status(500).json({ message: `Error updating prospect status: ${error.message}` });
    }
});
exports.updateProspectStatus = updateProspectStatus;
// Edit a prospect
const updateProspect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prospectId } = req.params;
    const { name, status, category, inquiryDate, description } = req.body;
    try {
        const existingProspect = yield prisma.prospects.findUnique({
            where: { id: Number(prospectId) },
        });
        if (!existingProspect) {
            res.status(404).json({ message: "Prospect not found" });
            return;
        }
        const updatedProspect = yield prisma.prospects.update({
            where: { id: Number(prospectId) },
            data: {
                name,
                description,
                status,
                category,
                inquiryDate: inquiryDate ? new Date(inquiryDate) : null,
            },
        });
        // Send email notification on prospect edit
        // const updatingUser = await prisma.user.findUnique({
        //   where: { userId: Number(updatedBy) },
        // });
        // if (updatingUser) {
        //   const emailSubject = `Prospect Updated: ${updatedProspect.name}`;
        //   const emailMessage = `
        //     <p><strong>${updatingUser.username}</strong> updated the prospect <strong>${updatedProspect.name}</strong>.</p>
        //     <p>Details:</p>
        //     <ul>
        //       <li>Name: ${updatedProspect.name}</li>
        //       <li>Status: ${updatedProspect.status}</li>
        //       <li>Category: ${updatedProspect.category}</li>
        //       <li>Inquiry Date: ${updatedProspect.inquiryDate ? format(new Date(updatedProspect.inquiryDate), 'MMM d, yyyy h:mm a') : 'N/A'}</li>
        //     </ul>
        //   `;
        //   sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
        // }
        res.json(updatedProspect);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating prospect: ${error.message}` });
    }
});
exports.updateProspect = updateProspect;
// Delete a prospect
const deleteProspect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { prospectId } = req.params;
    try {
        const prospectToDelete = yield prisma.prospects.findUnique({
            where: { id: Number(prospectId) }, // Ensure `prospectId` is a number
        });
        if (!prospectToDelete) {
            res.status(404).json({ message: "Prospect not found" });
            return;
        }
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const decodedToken = decodeToken(token);
        if (!decodedToken || !decodedToken.userId) {
            res.status(401).json({ message: "Unauthorized: Invalid token" });
            return;
        }
        const deletingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!deletingUser) {
            res.status(400).json({ message: "Invalid user deleting the prospect" });
            return;
        }
        yield prisma.prospects.delete({
            where: { id: Number(prospectId) },
        });
        // Send email to gaurav@webtech.com.np
        const gauravEmailSubject = `Prospect Deleted: ${prospectToDelete.name}`;
        const gauravEmailMessage = (0, prospectDeletedEmailTemplate_1.prospectDeletedEmailTemplate)(deletingUser.username || "Unknown User", // Fallback value if username is null
        prospectToDelete.name);
        sendMail("gaurav@webtech.com.np", gauravEmailSubject, gauravEmailMessage);
        res.status(200).json({ message: "Prospect successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting prospect: ${error.message}` });
    }
});
exports.deleteProspect = deleteProspect;
const getProspectFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { prospectId } = req.params;
    try {
        const whereCondition = Number(prospectId) === 0
            ? {}
            : { prospectId: Number(prospectId) };
        const prospectFollowupNotes = yield ((_a = prisma.prospectFollowupNote) === null || _a === void 0 ? void 0 : _a.findMany({
            where: whereCondition,
            include: {
                user: {
                    select: {
                        userId: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
                prospect: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        }));
        res.json(prospectFollowupNotes);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving follow-up notes: ${error.message}` });
    }
});
exports.getProspectFollowupNote = getProspectFollowupNote;
// Update the addFollowupNote function
const addProspectFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prospectId } = req.params;
    const { content, userId } = req.body;
    if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
    }
    try {
        // First verify the client exists
        const client = yield prisma.prospects.findUnique({
            where: { id: Number(prospectId) }
        });
        if (!client) {
            res.status(404).json({ message: "Client not found" });
            return;
        }
        // Verify user exists
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const newProspectFollowupNote = yield prisma.prospectFollowupNote.create({
            data: {
                content,
                prospectId: Number(prospectId),
                userId: Number(userId),
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });
        res.status(201).json(newProspectFollowupNote);
    }
    catch (error) {
        console.error("Error adding follow-up note:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                res.status(400).json({
                    message: "Invalid client or user ID",
                    details: error.meta
                });
                return;
            }
        }
        if (error instanceof Error) {
            res.status(500).json({
                message: "Failed to add follow-up note",
                error: error.message
            });
        }
        else {
            res.status(500).json({
                message: "Failed to add follow-up note",
                error: "Unknown error occurred"
            });
        }
    }
});
exports.addProspectFollowupNote = addProspectFollowupNote;
const updateProspectFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
    }
    try {
        const updatedProspectFollowupNote = yield prisma.prospectFollowupNote.update({
            where: { id: Number(commentId) },
            data: { content },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });
        res.status(200).json(updatedProspectFollowupNote);
    }
    catch (error) {
        console.error("Error updating follow-up note:", error);
        res.status(500).json({ message: `Error updating follow-up note: ${error.message}` });
    }
});
exports.updateProspectFollowupNote = updateProspectFollowupNote;
const deleteProspectFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    try {
        yield prisma.prospectFollowupNote.delete({
            where: { id: Number(commentId) }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting follow-up note:", error);
        res.status(500).json({ message: `Error deleting follow-up note: ${error.message}` });
    }
});
exports.deleteProspectFollowupNote = deleteProspectFollowupNote;
