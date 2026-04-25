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
exports.sendSubtaskEditEmails = exports.subtaskEditedEmailTemplate = void 0;
const date_fns_tz_1 = require("date-fns-tz");
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
const formatNepaliTime = (dateValue) => {
    if (!dateValue)
        return "Not set";
    return (0, date_fns_tz_1.format)(dateValue, "MMMM dd, yyyy hh:mm a", {
        timeZone: "Asia/Kathmandu",
    });
};
const subtaskEditedEmailTemplate = (editorName, subtaskTitle, parentTaskTitle, projectName, changes) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: auto; padding: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FFA500, #FF8C00); padding: 25px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 500;">Subtask Updated</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px;">
    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px; font-size: 16px; color: #333;">
        <strong style="color: #FF8C00;">${editorName}</strong> edited the subtask 
        <strong style="color: #FF8C00;">${subtaskTitle}</strong> under task 
        <strong>${parentTaskTitle}</strong> in project <strong>${projectName}</strong>.
      </p>
      
      <div style="background-color: white; border-radius: 6px; padding: 15px; margin-top: 15px; border-left: 4px solid #FF8C00;">
        <h3 style="margin: 0 0 10px; color: #FF8C00;">Changes Made:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${changes.map(change => `<li style="margin-bottom: 8px;">${change}</li>`).join('')}
        </ul>
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
exports.subtaskEditedEmailTemplate = subtaskEditedEmailTemplate;
const sendSubtaskEditEmails = (subtask, editor, changes) => __awaiter(void 0, void 0, void 0, function* () {
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
        const emailSubject = `Subtask Updated: ${subtask.title}`;
        for (const user of subtask.assignedUsers) {
            if (!user.email) {
                console.log(`User ${user.userId} has no email address`);
                continue;
            }
            const userMessage = (0, exports.subtaskEditedEmailTemplate)(editor.username || "System", subtask.title, parentTaskTitle, projectName, changes);
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
        console.error("Error in sendSubtaskEditEmails:", error);
        throw error;
    }
});
exports.sendSubtaskEditEmails = sendSubtaskEditEmails;
