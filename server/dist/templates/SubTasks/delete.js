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
exports.sendSubtaskDeleteEmails = exports.subtaskDeletedEmailTemplate = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "workspace@webtechnepal.com",
        pass: "ikcasazktikvpvqn",
    },
});
const subtaskDeletedEmailTemplate = (deleterName, subtaskTitle, parentTaskTitle, projectName) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: auto; padding: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FF4500, #FF6347); padding: 25px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 500;">Subtask Deleted</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px;">
    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px; font-size: 16px; color: #333;">
        <strong style="color: #FF4500;">${deleterName}</strong> deleted the subtask 
        <strong style="color: #FF4500;">${subtaskTitle}</strong> under task 
        <strong>${parentTaskTitle}</strong> in project <strong>${projectName}</strong>.
      </p>
      
      <div style="background-color: white; border-radius: 6px; padding: 15px; margin-top: 15px; border-left: 4px solid #FF4500;">
        <p style="margin: 0; color: #666;">
          This subtask has been permanently removed from the system.
        </p>
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
    <p style="margin: 0; font-size: 13px; color: #999;">
      This is an automated notification. Please do not reply to this email.
    </p>
  </div>
</div>
`;
exports.subtaskDeletedEmailTemplate = subtaskDeletedEmailTemplate;
const sendSubtaskDeleteEmails = (subtask, deleter) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!subtask.assignedUsers.length) {
            console.log('No assigned users for this subtask');
            return;
        }
        // Get client information
        const client = yield prismaClient_1.default.client.findUnique({
            where: { id: subtask.clientId || undefined },
            select: {
                domainName: true,
                companyName: true
            }
        });
        const projectName = (client === null || client === void 0 ? void 0 : client.domainName) || (client === null || client === void 0 ? void 0 : client.companyName) || "No Project";
        const parentTaskTitle = ((_a = subtask.parentTask) === null || _a === void 0 ? void 0 : _a.title) || "Parent Task";
        const emailSubject = `Subtask Deleted: ${subtask.title}`;
        for (const user of subtask.assignedUsers) {
            if (!user.email) {
                console.log(`User ${user.userId} has no email address`);
                continue;
            }
            const userMessage = (0, exports.subtaskDeletedEmailTemplate)(deleter.username || "System", subtask.title, parentTaskTitle, projectName);
            yield transporter.sendMail({
                to: user.email,
                cc: ["gaurav@webtech.com.np"
                    // , "sudeep@webtechnepal.com"
                ],
                subject: emailSubject,
                html: userMessage,
            });
        }
    }
    catch (error) {
        console.error("Error in sendSubtaskDeleteEmails:", error);
        throw error;
    }
});
exports.sendSubtaskDeleteEmails = sendSubtaskDeleteEmails;
