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
exports.sendSubtaskCreationEmails = void 0;
const date_fns_tz_1 = require("date-fns-tz");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prismaClient_1 = __importDefault(require("../../prismaClient"));
// Initialize nodemailer transporter
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "workspace@webtechnepal.com",
        pass: "ikcasazktikvpvqn",
    },
});
// Format date in Nepali time
const formatNepaliTime = (dateValue) => {
    if (!dateValue)
        return "Not set";
    return (0, date_fns_tz_1.format)(dateValue, "MMMM dd, yyyy hh:mm a", {
        timeZone: "Asia/Kathmandu",
    });
};
// Calculate time remaining
function calculateTimeLeft(dueDate) {
    if (!dueDate)
        return "No due date set";
    const now = new Date();
    const due = new Date(dueDate);
    const diffInMs = due.getTime() - now.getTime();
    if (diffInMs < 0) {
        const absDiff = Math.abs(diffInMs);
        const daysOverdue = Math.floor(absDiff / (1000 * 60 * 60 * 24));
        const hoursOverdue = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesOverdue = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${daysOverdue}d ${hoursOverdue}h ${minutesOverdue}m overdue`;
    }
    const daysLeft = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    if (daysLeft > 0) {
        return `${daysLeft}d ${hoursLeft}h ${minutesLeft}m left`;
    }
    else if (hoursLeft > 0) {
        return `${hoursLeft}h ${minutesLeft}m left`;
    }
    else {
        return `${minutesLeft}m left`;
    }
}
// Email template for subtask creation
const subtaskCreatedEmailTemplate = (creatorName, assignedUsername, subtaskTitle, parentTaskTitle, projectName, formattedStartDate, formattedDueDate, timeLeft) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: auto; padding: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 25px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 500;">New Subtask Assigned</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px;">
    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px; font-size: 16px; color: #333;">
        <strong style="color: #4CAF50;">${creatorName}</strong> assigned you a new subtask under task 
        <strong style="color: #4CAF50;">${parentTaskTitle}</strong> 
        of project <strong>${projectName}</strong>.
      </p>
      
      <div style="background-color: white; border-radius: 6px; padding: 15px; margin-top: 15px; border-left: 4px solid #4CAF50;">
        <h3 style="margin: 0 0 10px; color: #4CAF50;">${subtaskTitle}</h3>
        
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 10px;">
          <div style="flex: 1; min-width: 200px;">
            <p style="margin: 0; font-size: 14px; color: #666;"><strong>Start Date:</strong></p>
            <p style="margin: 5px 0 0; font-size: 15px; font-weight: 500;">${formattedStartDate}</p>
          </div>
          
          <div style="flex: 1; min-width: 200px;">
            <p style="margin: 0; font-size: 14px; color: #666;"><strong>Due Date:</strong></p>
            <p style="margin: 5px 0 0; font-size: 15px; font-weight: 500;">${formattedDueDate}</p>
          </div>
        </div>
        
        <div style="margin-top: 10px;">
          <p style="margin: 0; font-size: 14px; color: #666;"><strong>Time Remaining:</strong></p>
          <p style="margin: 5px 0 0; font-size: 15px; font-weight: 500; color: ${timeLeft.includes("overdue") ? "#e74c3c" : "#27ae60"}">
            ${timeLeft}
          </p>
        </div>
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
// Function to send subtask creation emails
const sendSubtaskCreationEmails = (subtask, parentTask, creator) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting email sending process for subtask:', subtask.id);
        if (!subtask.assignedUsers.length) {
            console.log('No assigned users for this subtask');
            return;
        }
        if (!parentTask.project) {
            console.log('Parent task has no associated project');
        }
        const formattedStartDate = formatNepaliTime(subtask.startDate);
        const formattedDueDate = formatNepaliTime(subtask.dueDate);
        const timeLeft = calculateTimeLeft(subtask.dueDate);
        // Get the client information
        const client = yield prismaClient_1.default.client.findUnique({
            where: { id: parentTask.clientId || undefined },
            select: {
                domainName: true,
                companyName: true
            }
        });
        // Use client's domainName if available, otherwise use companyName, fallback to "No Project"
        const projectName = (client === null || client === void 0 ? void 0 : client.domainName) || (client === null || client === void 0 ? void 0 : client.companyName) || "No Project";
        const emailSubject = `New Subtask Assigned: ${subtask.title}`;
        console.log(`Preparing to send emails to ${subtask.assignedUsers.length} users`);
        for (const user of subtask.assignedUsers) {
            if (!user.email) {
                console.log(`User ${user.userId} has no email address`);
                continue;
            }
            console.log(`Sending email to ${user.email}`);
            const userMessage = subtaskCreatedEmailTemplate(creator.username || "System", user.username || "User", subtask.title, parentTask.title, projectName, // Updated project name here
            formattedStartDate, formattedDueDate, timeLeft);
            try {
                yield transporter.sendMail({
                    to: user.email,
                    cc: ["gaurav@webtech.com.np"
                        // , "sudeep@webtechnepal.com"
                    ],
                    subject: emailSubject,
                    html: userMessage,
                });
                console.log(`Email successfully sent to ${user.email}`);
            }
            catch (sendError) {
                console.error(`Failed to send email to ${user.email}:`, sendError);
            }
        }
    }
    catch (error) {
        console.error("Error in sendSubtaskCreationEmails:", error);
        throw error;
    }
});
exports.sendSubtaskCreationEmails = sendSubtaskCreationEmails;
