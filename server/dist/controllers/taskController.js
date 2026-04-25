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
exports.getUserDailySchedule = exports.getSubtaskTimerStatus = exports.stopSubtaskTimer = exports.pauseSubtaskTimer = exports.startSubtaskTimer = exports.getTimerStatus = exports.stopTimer = exports.pauseTimer = exports.startTimer = exports.getMyDeletedSubtasks = exports.getMyDeletedTasks = exports.getAllDeletedSubtasks = exports.getDeletedSubtasks = exports.restoreSubtask = exports.softDeleteSubtask = exports.deleteAttachment = exports.deleteSubtask = exports.updateSubtask = exports.getSubtasks = exports.createSubtask = exports.getCommentWithReplies = exports.toggleReplyLike = exports.deleteReply = exports.editReply = exports.addReplyToComment = exports.toggleCommentLike = exports.deleteComment = exports.editComment = exports.getTaskComments = exports.addCommentToTask = exports.permanentDeleteTask = exports.getAllDeletedTasks = exports.getDeletedTasks = exports.restoreTask = exports.softDeleteTask = exports.deleteTask = exports.uploadAttachments = exports.updateTask = exports.getTasksByUserIdForProfile = exports.getTasksByUserIdForUserTasks = exports.updateTaskStatus = exports.getTasksByUser = exports.getTaskCountByStatus = exports.getMyTasksCountByStatus = exports.getTaskById = exports.getTaskReport = exports.getTasksForTaskPage = exports.getTasks = exports.createTask = exports.Priority = void 0;
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_tz_1 = require("date-fns-tz");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailTemplates_1 = require("../templates/emailTemplates");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const create_1 = require("../templates/SubTasks/create");
const update_1 = require("../templates/SubTasks/update");
const delete_1 = require("../templates/SubTasks/delete");
const index_1 = require("../index");
var Priority;
(function (Priority) {
    Priority["Urgent"] = "Urgent";
    Priority["High"] = "High";
    Priority["Normal"] = "Normal";
})(Priority || (exports.Priority = Priority = {}));
const formatNepaliTime = (dateValue) => {
    if (!dateValue)
        return "Not set";
    return new Date(dateValue).toLocaleString("en-US", {
        timeZone: "Asia/Kathmandu",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};
//---------------------------------------------- Task Assigned Email Start--------------------------------------------
// Update the taskAssignedEmailTemplate function with this new design
const taskAssignedEmailTemplate = (assignerName, assignedUsernames, taskTitle, projectName, formattedStartDate, formattedDueDate, timeLeft, priority, taskId, description) => {
    // Priority styling
    const priorityStyles = {
        [Priority.Urgent]: {
            bg: "bg-red-600/20",
            border: "border-red-600/40",
            text: "text-red-800",
            icon: "🔴",
        },
        [Priority.High]: {
            bg: "bg-[#bde0fe]",
            border: "border-[#bde0fe]",
            text: "text-[#0d5478]",
            icon: "🟠",
        },
        [Priority.Normal]: {
            bg: "bg-emerald-500/15",
            border: "border-emerald-500/30",
            text: "text-emerald-800",
            icon: "🟢",
        },
    };
    const currentPriority = priorityStyles[priority] || priorityStyles[Priority.Normal];
    return `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: auto; padding: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #4a6fdc, #3a56b0); padding: 25px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 500;">New Task Assigned</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px;">
    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px; font-size: 16px; color: #333;">
        <strong style="color: #4a6fdc;">${assignerName}</strong> assigned 
        ${assignedUsernames.length > 1
        ? `the following team members: <strong>${assignedUsernames.join(", ")}</strong>`
        : `<strong>${assignedUsernames[0]}</strong>`} 
        to the task <strong style="color: #4a6fdc;">${taskTitle}</strong> 
        ${projectName ? `in project <strong>${projectName}</strong>` : ""}.
      </p>
      
      <div style="background-color: white; border-radius: 6px; padding: 15px; margin-top: 15px; border-left: 4px solid #4a6fdc;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #4a6fdc;">${taskTitle}</h3>
         
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <p style=" margin-right: 4px;">Priority:</p>
         <span style="display: inline-flex; align-items: center; gap: 4px; ${currentPriority.bg}; ${currentPriority.border}; border-radius: 9999px; padding: 4px 12px; font-size: 14px; font-weight: 500; ${currentPriority.text}">
            ${currentPriority.icon} ${priority}
          </span>
        </div>
        
  
        
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

        <!-- View Task Button -->
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://www.webtech.mobi.np/task/${taskId}" 
             style="display: inline-block; background: linear-gradient(135deg, #4a6fdc, #3a56b0); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            View Task
          </a>
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
};
//---------------------------------------------- Task Assigned Email End--------------------------------------------
//-------------------------------- Task status updated email template Start -----------------------------------
const taskStatusUpdatedEmailTemplate = (updaterName, taskTitle, projectName, oldStatus, newStatus, formattedUpdateTime, taskId) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: auto; padding: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #6c5ce7, #4a3fb5); padding: 25px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 500;">Task Status Updated</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px;">
    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px; font-size: 16px; color: #333;">
        <strong style="color: #6c5ce7;">${updaterName}</strong> updated the status of 
        <strong style="color: #6c5ce7;">${taskTitle}</strong> 
        in project <strong>${projectName}</strong>
      </p>
      
      <div style="background-color: white; border-radius: 6px; padding: 15px; margin-top: 15px; border-left: 4px solid #6c5ce7;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div style="flex: 1; text-align: center; padding: 10px; background-color: #f1f1f1; border-radius: 4px; margin-right: 10px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Previous Status</p>
            <p style="margin: 5px 0 0; font-size: 16px; font-weight: 600; color: #e74c3c;">${oldStatus}</p>
          </div>
          
          <div style="flex: 0; display: flex; align-items: center; padding: 0 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 16L18 12M18 12L14 8M18 12H6" stroke="#6c5ce7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div style="flex: 1; text-align: center; padding: 10px; background-color: #f1f1f1; border-radius: 4px; margin-left: 10px;">
            <p style="margin: 0; font-size: 14px; color: #666;">New Status</p>
            <p style="margin: 5px 0 0; font-size: 16px; font-weight: 600; color: #27ae60;">${newStatus}</p>
          </div>
        </div>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 14px; color: #666;"><strong>Updated at:</strong></p>
          <p style="margin: 5px 0 0; font-size: 15px; font-weight: 500;">${formattedUpdateTime}</p>
        </div>

        <!-- View Task Button -->
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://www.webtech.mobi.np/task/${taskId}" 
             style="display: inline-block; background: linear-gradient(135deg, #6c5ce7, #4a3fb5); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            View Task
          </a>
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
//----------------------------- Task status updated email template End --------------------------------
// Helper function to calculate time left with days, hours, and minutes Start
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
// Helper function to calculate time left with days, hours, and minutes Start
//---------------------------- Subtask Created Email Template Start ---------------------------------
const subtaskCreatedEmailTemplate = (creatorName, subtaskTitle, parentTaskTitle, projectName, formattedStartDate, formattedDueDate) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
  <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
    <h2 style="margin: 0;">New Subtask Created</h2>
  </div>
  <div style="padding: 20px;">
    <p><strong style="color: #2c3e50;">${creatorName}</strong> created a new subtask:</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0;">
      <h3 style="margin-top: 0; color: #2E7D32;">${subtaskTitle}</h3>
      <p><strong>Parent Task:</strong> ${parentTaskTitle}</p>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Start Date:</strong> ${formattedStartDate}</p>
      <p><strong>Due Date:</strong> ${formattedDueDate}</p>
    </div>
 
  </div>
</div>
`;
//------------------------------------ Subtask Created Email Template End --------------------------------
const prisma = new client_1.PrismaClient();
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "workspace@webtechnepal.com",
        pass: "ikcasazktikvpvqn",
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET ||
            "045ffc1dc9a74ea1812af89ec2f03c531a56b144b984ce3f0413ab0e6202e7c6");
        return decoded;
    }
    catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};
function createNotification(userId_1, title_1, message_1) {
    return __awaiter(this, arguments, void 0, function* (userId, title, message, sound = "default") {
        yield prisma.notification.create({
            data: {
                title,
                message,
                userId,
                sound,
            },
        });
    });
}
// =========================================== Task CRUD Start ===================================================
// Task Create Start
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, description, status, priority = Priority.Normal, startDate, dueDate, clientId, assignedTo, assignedBy, } = req.body;
    try {
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
        // Get creator user details for activity log
        const creator = yield prisma.user.findUnique({
            where: { userId: creatorId },
            select: { username: true, email: true },
        });
        if (!creator) {
            res.status(404).json({ message: "Creator user not found" });
            return;
        }
        const assignedUserIds = Array.isArray(assignedTo)
            ? assignedTo.map((id) => Number(id))
            : [];
        // Get assigned users details for activity log
        const assignedUsers = yield prisma.user.findMany({
            where: { userId: { in: assignedUserIds } },
            select: { userId: true, username: true, email: true },
        });
        const assignedUsernames = assignedUsers
            .map((user) => user.username)
            .join(", ");
        // Prepare task data with optional clientId
        const taskData = {
            title,
            description,
            status,
            priority,
            startDate,
            dueDate,
            assignedBy,
            category: req.body.category,
            assignedUsers: {
                connect: assignedTo.map((userId) => ({
                    userId: Number(userId),
                })),
            },
        };
        // Only add clientId if it exists and is valid
        if (clientId && clientId !== undefined && clientId !== null) {
            taskData.clientId = Number(clientId);
        }
        const newTask = yield prisma.task.create({
            data: taskData,
            include: {
                assignedUsers: true,
                client: true,
            },
        });
        // Enhanced Activity Log with detailed information
        yield prisma.activityLog.create({
            data: {
                action: "CREATE",
                details: `${creator.username} created the task "${title}".`,
                userId: creatorId,
                taskId: newTask.id,
            },
        });
        const assigningUser = yield prisma.user.findUnique({
            where: { email: assignedBy },
        });
        // Only fetch client if clientId exists
        let client = null;
        if (clientId && clientId !== undefined && clientId !== null) {
            client = yield prisma.client.findUnique({
                where: { id: Number(clientId) },
            });
        }
        if (newTask.assignedUsers && assigningUser) {
            const emailSubject = `New Task Assigned: ${newTask.title}`;
            const formattedStartDate = formatNepaliTime(newTask.startDate);
            const formattedDueDate = formatNepaliTime(newTask.dueDate);
            const timeLeft = calculateTimeLeft(newTask.dueDate);
            const projectName = (client === null || client === void 0 ? void 0 : client.domainName) || (client === null || client === void 0 ? void 0 : client.companyName) || null;
            // Email to assigned users
            for (const user of newTask.assignedUsers) {
                if (user.email) {
                    const assignedUserMessage = taskAssignedEmailTemplate(assigningUser.username, [user.username], newTask.title, projectName, formattedStartDate, formattedDueDate, timeLeft, newTask.priority, newTask.id.toString());
                    sendMail(user.email, emailSubject, assignedUserMessage);
                }
            }
            // Email to CC
            const assignedUsernames = newTask.assignedUsers.map((user) => user.username);
            const ccMessage = taskAssignedEmailTemplate(assigningUser.username, assignedUsernames, newTask.title, projectName, formattedStartDate, formattedDueDate, timeLeft, newTask.priority, newTask.id.toString());
            sendMail("gaurav@webtech.com.np", emailSubject, ccMessage);
            sendMail("gaurav@webtech.com.np", emailSubject, ccMessage);
        }
        if (newTask.assignedUsers) {
            for (const user of newTask.assignedUsers) {
                const projectName = (client === null || client === void 0 ? void 0 : client.domainName) || "the project";
                yield createNotification(user.userId, "New Task Assigned", `${creator.username} assigned you a new task: "${newTask.title}" in project "${projectName}"`, "task_assigned");
            }
        }
        if (!req.body.category) {
            res.status(400).json({ message: "Category is required" });
            return;
        }
        // Only fetch project if clientId exists
        let updatedProject = null;
        if (clientId && clientId !== undefined && clientId !== null) {
            updatedProject = yield prisma.project.findUnique({
                where: { id: Number(clientId) },
                include: { tasks: true },
            });
        }
        // Emit to all assigned users' rooms
        for (const user of newTask.assignedUsers) {
            index_1.io.to(String(user.userId)).emit("task:created", {
                task: newTask,
                message: `New task assigned: ${newTask.title}`,
            });
        }
        res.status(201).json(Object.assign(Object.assign({}, newTask), { project: updatedProject }));
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating a task: ${error.message}` });
    }
});
exports.createTask = createTask;
// Task Create End
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { clientId, assignedTo, includeDeleted, page = "1", limit = "10", search, projectName, status, clientDomainName, companyName, } = req.query;
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build search conditions
        const searchConditions = {
            isDeleted: includeDeleted ? undefined : false,
        };
        // Add client filter if provided
        if (clientId) {
            searchConditions.clientId = Number(clientId);
        }
        // Add assigned user filter if provided
        if (assignedTo) {
            searchConditions.assignedUsers = {
                some: {
                    userId: Number(assignedTo),
                },
            };
        }
        // Add comprehensive search if provided
        if (search) {
            searchConditions.OR = [
                {
                    title: {
                        contains: search,
                        // mode: 'insensitive' as const,
                    },
                },
                {
                    project: {
                        name: {
                            contains: search,
                            // mode: 'insensitive' as const,
                        },
                    },
                },
                {
                    client: {
                        domainName: {
                            contains: search,
                            // mode: 'insensitive' as const,
                        },
                    },
                },
                {
                    client: {
                        companyName: {
                            contains: search,
                            // mode: 'insensitive' as const,
                        },
                    },
                },
                {
                    description: {
                        contains: search,
                        // mode: 'insensitive' as const,
                    },
                },
                // Add search by assigned user username - CORRECTED
                {
                    assignedUsers: {
                        some: {
                            username: {
                                contains: search,
                                // mode: 'insensitive' as const,
                            },
                        },
                    },
                },
                // Add search by assigned user email - CORRECTED
                {
                    assignedUsers: {
                        some: {
                            email: {
                                contains: search,
                                // mode: 'insensitive' as const,
                            },
                        },
                    },
                },
            ];
        }
        // Add individual field filters if provided
        if (projectName) {
            searchConditions.project = Object.assign(Object.assign({}, searchConditions.project), { name: {
                    contains: projectName,
                    // mode: 'insensitive' as const,
                } });
        }
        if (clientDomainName) {
            searchConditions.client = Object.assign(Object.assign({}, searchConditions.client), { domainName: {
                    contains: clientDomainName,
                    // mode: 'insensitive' as const,
                } });
        }
        if (companyName) {
            searchConditions.client = Object.assign(Object.assign({}, searchConditions.client), { companyName: {
                    contains: companyName,
                    // mode: 'insensitive' as const,
                } });
        }
        // Add status filter if provided
        if (status) {
            searchConditions.status = status;
        }
        // Get total count for pagination
        const totalCount = yield prisma.task.count({
            where: searchConditions,
        });
        // For completed tasks, we need to handle pagination differently
        let tasksQuery = {
            where: searchConditions,
            include: {
                assignedUsers: true, // Directly include users (no nesting needed)
                subtasks: true,
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                },
                project: true,
                client: true,
                attachments: {
                    include: { uploadedBy: true },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: [
                {
                    priority: {
                        sort: "asc",
                        nulls: "last",
                    },
                },
                {
                    dueDate: "asc",
                },
            ],
        };
        // Apply pagination only for completed tasks or when specifically requested
        if (status === "completed" || searchConditions.status === "completed") {
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        // If no status filter is applied, we need to handle completed tasks separately
        else if (!status) {
            // Exclude completed tasks from pagination, they'll be handled separately
            searchConditions.status = {
                not: "completed",
            };
            // For non-completed tasks, apply normal pagination
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        else {
            // For other status filters, apply normal pagination
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        const tasks = yield prisma.task.findMany(tasksQuery);
        // If no status filter and we're on the first page, get completed tasks separately
        let completedTasks = [];
        if (!status && pageNum === 1) {
            const completedConditions = Object.assign(Object.assign({}, searchConditions), { status: "completed" });
            (_a = completedConditions.status) === null || _a === void 0 ? true : delete _a.not; // Remove the not: 'completed' condition
            completedTasks = yield prisma.task.findMany({
                where: completedConditions,
                include: tasksQuery.include,
                orderBy: tasksQuery.orderBy,
                take: 10, // Limit completed tasks to 10
            });
        }
        // Manual sorting by priority
        const priorityOrder = {
            [Priority.Urgent]: 0,
            [Priority.High]: 1,
            [Priority.Normal]: 2,
        };
        const sortedTasks = tasks.sort((a, b) => {
            return (priorityOrder[a.priority] -
                priorityOrder[b.priority]);
        });
        const sortedCompletedTasks = completedTasks.sort((a, b) => {
            return (priorityOrder[a.priority] -
                priorityOrder[b.priority]);
        });
        // Combine results: non-completed tasks + limited completed tasks (only on first page)
        const allTasks = pageNum === 1 ? [...sortedTasks, ...sortedCompletedTasks] : sortedTasks;
        // Calculate current elapsed time for running timers
        // In the getTasks function, replace the timer calculation section:
        const tasksWithTimerData = allTasks.map((task) => {
            let currentElapsed = 0;
            // Add null check for timerStartTime
            if (task.isTimerRunning && task.timerStartTime) {
                // Use the same approach for both server and client
                const now = new Date();
                const startTime = new Date(task.timerStartTime);
                // Calculate difference in milliseconds without timezone conversion
                currentElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            }
            return Object.assign(Object.assign({}, task), { currentElapsed, totalElapsed: task.timeSpent + currentElapsed, formattedTimeSpent: formatTime(task.timeSpent), formattedTotalElapsed: formatTime(task.timeSpent + currentElapsed), formattedCurrentElapsed: formatTime(currentElapsed) });
        });
        // Adjust total count calculation for the special case
        let adjustedTotalCount = totalCount;
        if (!status) {
            // Get count of non-completed tasks
            const nonCompletedConditions = Object.assign(Object.assign({}, searchConditions), { status: {
                    not: "completed",
                } });
            const nonCompletedCount = yield prisma.task.count({
                where: nonCompletedConditions,
            });
            // Get count of completed tasks (we'll only show max 10)
            const completedConditions = Object.assign(Object.assign({}, searchConditions), { status: "completed" });
            (_b = completedConditions.status) === null || _b === void 0 ? true : delete _b.not;
            const completedCount = yield prisma.task.count({
                where: completedConditions,
            });
            adjustedTotalCount = nonCompletedCount + Math.min(completedCount, 10);
        }
        res.json({
            tasks: tasksWithTimerData, // Return tasks with timer data
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(adjustedTotalCount / limitNum),
                totalItems: adjustedTotalCount,
                hasNext: pageNum < Math.ceil(adjustedTotalCount / limitNum),
                hasPrev: pageNum > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        res
            .status(500)
            .json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasks = getTasks;
// Get Task Start
const getTasksForTaskPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { clientId, assignedTo, includeDeleted, page = "1", limit = "1000", search, projectName, status, clientDomainName, companyName, completedDate, // New parameter for single date
    completedDateFrom, // New parameter for date range start
    completedDateTo, // New parameter for date range end
     } = req.query;
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build search conditions
        const searchConditions = {
            isDeleted: includeDeleted ? undefined : false,
        };
        // Add client filter if provided
        if (clientId) {
            searchConditions.clientId = Number(clientId);
        }
        // Add assigned user filter if provided
        if (assignedTo) {
            searchConditions.assignedUsers = {
                some: {
                    userId: Number(assignedTo),
                },
            };
        }
        // Add date filter for completed tasks
        if (status === "completed") {
            // If date filters are provided, use them
            if (completedDate) {
                // Filter for a specific date
                const targetDate = new Date(completedDate);
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                searchConditions.completedAt = {
                    gte: startOfDay,
                    lte: endOfDay,
                };
            }
            else if (completedDateFrom && completedDateTo) {
                // Filter for date range
                const startDate = new Date(completedDateFrom);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(completedDateTo);
                endDate.setHours(23, 59, 59, 999);
                searchConditions.completedAt = {
                    gte: startDate,
                    lte: endDate,
                };
            }
            else if (completedDateFrom && !completedDateTo) {
                // Filter from a specific date to present
                const startDate = new Date(completedDateFrom);
                startDate.setHours(0, 0, 0, 0);
                searchConditions.completedAt = {
                    gte: startDate,
                };
            }
            else if (!completedDate && !completedDateFrom && !completedDateTo) {
                // Default: only show tasks completed today
                const today = new Date();
                const startOfToday = new Date(today);
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);
                searchConditions.completedAt = {
                    gte: startOfToday,
                    lte: endOfToday,
                };
            }
        }
        // Add comprehensive search if provided
        if (search) {
            searchConditions.OR = [
                {
                    title: {
                        contains: search,
                        // mode: 'insensitive' as const,
                    },
                },
                {
                    project: {
                        name: {
                            contains: search,
                            // mode: 'insensitive' as const,
                        },
                    },
                },
                {
                    client: {
                        domainName: {
                            contains: search,
                            // mode: 'insensitive' as const,
                        },
                    },
                },
                {
                    client: {
                        companyName: {
                            contains: search,
                            // mode: 'insensitive' as const,
                        },
                    },
                },
                {
                    description: {
                        contains: search,
                        // mode: 'insensitive' as const,
                    },
                },
                // Add search by assigned user username - CORRECTED
                {
                    assignedUsers: {
                        some: {
                            username: {
                                contains: search,
                                // mode: 'insensitive' as const,
                            },
                        },
                    },
                },
                // Add search by assigned user email - CORRECTED
                {
                    assignedUsers: {
                        some: {
                            email: {
                                contains: search,
                                // mode: 'insensitive' as const,
                            },
                        },
                    },
                },
            ];
        }
        // Add individual field filters if provided
        if (projectName) {
            searchConditions.project = Object.assign(Object.assign({}, searchConditions.project), { name: {
                    contains: projectName,
                    // mode: 'insensitive' as const,
                } });
        }
        if (clientDomainName) {
            searchConditions.client = Object.assign(Object.assign({}, searchConditions.client), { domainName: {
                    contains: clientDomainName,
                    // mode: 'insensitive' as const,
                } });
        }
        if (companyName) {
            searchConditions.client = Object.assign(Object.assign({}, searchConditions.client), { companyName: {
                    contains: companyName,
                    // mode: 'insensitive' as const,
                } });
        }
        // Add status filter if provided
        if (status) {
            searchConditions.status = status;
        }
        // Get total count for pagination
        const totalCount = yield prisma.task.count({
            where: searchConditions,
        });
        // For completed tasks, we need to handle pagination differently
        let tasksQuery = {
            where: searchConditions,
            include: {
                assignedUsers: true, // Directly include users (no nesting needed)
                subtasks: true,
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                },
                project: true,
                client: true,
                attachments: {
                    include: { uploadedBy: true },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: [
                {
                    priority: {
                        sort: "asc",
                        nulls: "last",
                    },
                },
                {
                    dueDate: "asc",
                },
            ],
        };
        // Apply pagination only for completed tasks or when specifically requested
        if (status === "completed" || searchConditions.status === "completed") {
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        // If no status filter is applied, we need to handle completed tasks separately
        else if (!status) {
            // Exclude completed tasks from pagination, they'll be handled separately
            searchConditions.status = {
                not: "completed",
            };
            // For non-completed tasks, apply normal pagination
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        else {
            // For other status filters, apply normal pagination
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        const tasks = yield prisma.task.findMany(tasksQuery);
        // If no status filter and we're on the first page, get completed tasks separately
        let completedTasks = [];
        if (!status && pageNum === 1) {
            const completedConditions = Object.assign(Object.assign({}, searchConditions), { status: "completed" });
            (_a = completedConditions.status) === null || _a === void 0 ? true : delete _a.not; // Remove the not: 'completed' condition
            // Apply the same date filters to completed tasks when no status filter is provided
            if (completedDate) {
                const targetDate = new Date(completedDate);
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                completedConditions.completedAt = {
                    gte: startOfDay,
                    lte: endOfDay,
                };
            }
            else if (completedDateFrom && completedDateTo) {
                const startDate = new Date(completedDateFrom);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(completedDateTo);
                endDate.setHours(23, 59, 59, 999);
                completedConditions.completedAt = {
                    gte: startDate,
                    lte: endDate,
                };
            }
            else if (completedDateFrom && !completedDateTo) {
                const startDate = new Date(completedDateFrom);
                startDate.setHours(0, 0, 0, 0);
                completedConditions.completedAt = {
                    gte: startDate,
                };
            }
            else if (!completedDate && !completedDateFrom && !completedDateTo) {
                // Default: only show tasks completed today
                const today = new Date();
                const startOfToday = new Date(today);
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);
                completedConditions.completedAt = {
                    gte: startOfToday,
                    lte: endOfToday,
                };
            }
            completedTasks = yield prisma.task.findMany({
                where: completedConditions,
                include: tasksQuery.include,
                orderBy: tasksQuery.orderBy,
                take: 1000, // Limit completed tasks to 1000
            });
        }
        // Manual sorting by priority
        const priorityOrder = {
            [Priority.Urgent]: 0,
            [Priority.High]: 1,
            [Priority.Normal]: 2,
        };
        const sortedTasks = tasks.sort((a, b) => {
            return (priorityOrder[a.priority] -
                priorityOrder[b.priority]);
        });
        const sortedCompletedTasks = completedTasks.sort((a, b) => {
            return (priorityOrder[a.priority] -
                priorityOrder[b.priority]);
        });
        // Combine results: non-completed tasks + limited completed tasks (only on first page)
        const allTasks = pageNum === 1 ? [...sortedTasks, ...sortedCompletedTasks] : sortedTasks;
        // Calculate current elapsed time for running timers
        const tasksWithTimerData = allTasks.map((task) => {
            let currentElapsed = 0;
            // Add null check for timerStartTime
            if (task.isTimerRunning && task.timerStartTime) {
                // Use the same approach for both server and client
                const now = new Date();
                const startTime = new Date(task.timerStartTime);
                // Calculate difference in milliseconds without timezone conversion
                currentElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            }
            return Object.assign(Object.assign({}, task), { currentElapsed, totalElapsed: task.timeSpent + currentElapsed, formattedTimeSpent: formatTime(task.timeSpent), formattedTotalElapsed: formatTime(task.timeSpent + currentElapsed), formattedCurrentElapsed: formatTime(currentElapsed) });
        });
        // Adjust total count calculation for the special case
        let adjustedTotalCount = totalCount;
        if (!status) {
            // Get count of non-completed tasks
            const nonCompletedConditions = Object.assign(Object.assign({}, searchConditions), { status: {
                    not: "completed",
                } });
            const nonCompletedCount = yield prisma.task.count({
                where: nonCompletedConditions,
            });
            // Get count of completed tasks (we'll only show max 1000)
            const completedConditions = Object.assign(Object.assign({}, searchConditions), { status: "completed" });
            (_b = completedConditions.status) === null || _b === void 0 ? true : delete _b.not;
            // Apply date filters to completed count as well
            if (completedDate) {
                const targetDate = new Date(completedDate);
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                completedConditions.completedAt = {
                    gte: startOfDay,
                    lte: endOfDay,
                };
            }
            else if (completedDateFrom && completedDateTo) {
                const startDate = new Date(completedDateFrom);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(completedDateTo);
                endDate.setHours(23, 59, 59, 999);
                completedConditions.completedAt = {
                    gte: startDate,
                    lte: endDate,
                };
            }
            else if (completedDateFrom && !completedDateTo) {
                const startDate = new Date(completedDateFrom);
                startDate.setHours(0, 0, 0, 0);
                completedConditions.completedAt = {
                    gte: startDate,
                };
            }
            else if (!completedDate && !completedDateFrom && !completedDateTo) {
                const today = new Date();
                const startOfToday = new Date(today);
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);
                completedConditions.completedAt = {
                    gte: startOfToday,
                    lte: endOfToday,
                };
            }
            const completedCount = yield prisma.task.count({
                where: completedConditions,
            });
            adjustedTotalCount = nonCompletedCount + Math.min(completedCount, 1000);
        }
        res.json({
            tasks: tasksWithTimerData, // Return tasks with timer data
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(adjustedTotalCount / limitNum),
                totalItems: adjustedTotalCount,
                hasNext: pageNum < Math.ceil(adjustedTotalCount / limitNum),
                hasPrev: pageNum > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        res
            .status(500)
            .json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasksForTaskPage = getTasksForTaskPage;
const getTaskReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, fromDate, toDate, page = "1", limit = "100", } = req.query;
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build the base search conditions for completed tasks
        const searchConditions = {
            status: "completed",
            isDeleted: false,
        };
        // Handle date filtering for tasks
        let startDate = new Date();
        let endDate = new Date();
        if (fromDate && toDate) {
            startDate = new Date(fromDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);
            searchConditions.completedAt = {
                gte: startDate,
                lte: endDate,
            };
        }
        else if (fromDate && !toDate) {
            startDate = new Date(fromDate);
            startDate.setHours(0, 0, 0, 0);
            searchConditions.completedAt = {
                gte: startDate,
            };
        }
        else {
            const today = new Date();
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            searchConditions.completedAt = {
                gte: startDate,
                lte: endDate,
            };
        }
        // Add user filter if username is provided
        let filteredUserId = null;
        if (username) {
            // Find the user by username
            const user = yield prisma.user.findUnique({
                where: { username: username },
                select: { userId: true }
            });
            if (user) {
                filteredUserId = user.userId;
                searchConditions.assignedUsers = {
                    some: {
                        userId: filteredUserId,
                    },
                };
            }
            else {
                // User not found, return empty results
                res.json({
                    success: true,
                    data: {
                        summary: {
                            totalTasksCompleted: 0,
                            tasksInCurrentPage: 0,
                            totalTimeSpent: "0h",
                            averageCompletionTime: "0 hours",
                            dateRange: {
                                from: fromDate ? startDate.toISOString() : startDate.toISOString(),
                                to: toDate ? endDate.toISOString() : (endDate ? endDate.toISOString() : null),
                            },
                            filters: {
                                assignedTo: username || "All Users",
                            },
                        },
                        tasksByUser: [],
                        tasksByProject: [],
                        todayUpdates: [],
                        tasks: [],
                        pagination: {
                            currentPage: pageNum,
                            totalPages: 0,
                            totalItems: 0,
                            hasNext: false,
                            hasPrev: false,
                            itemsPerPage: limitNum,
                        },
                    },
                    message: "No user found with the specified username",
                });
                return;
            }
        }
        // Build today updates where clause with same date filter AND user filter
        let todayUpdatesWhere = {};
        // Apply same date filter
        if (fromDate && toDate) {
            todayUpdatesWhere.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }
        else if (fromDate && !toDate) {
            todayUpdatesWhere.createdAt = {
                gte: startDate,
            };
        }
        else {
            const today = new Date();
            const todayStart = new Date(today);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);
            todayUpdatesWhere.createdAt = {
                gte: todayStart,
                lte: todayEnd,
            };
        }
        // Apply user filter to today updates (same as username filter)
        if (filteredUserId) {
            todayUpdatesWhere.userId = filteredUserId;
        }
        // Fetch today updates with filters
        const todayUpdates = yield prisma.todayUpdate.findMany({
            where: todayUpdatesWhere,
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    }
                },
                Like: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                            }
                        }
                    }
                },
                Reply: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                            }
                        },
                        likes: {
                            include: {
                                user: {
                                    select: {
                                        userId: true,
                                        username: true,
                                        firstname: true,
                                        lastname: true,
                                        profilePictureUrl: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        // Transform today updates
        const transformedTodayUpdates = todayUpdates.map(update => {
            var _a;
            return ({
                id: update.id,
                content: update.content,
                createdAt: update.createdAt,
                updatedAt: update.updatedAt,
                user: update.user,
                likes: update.Like,
                replies: (_a = update.Reply) === null || _a === void 0 ? void 0 : _a.map(reply => ({
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    user: reply.user,
                    likes: reply.likes
                }))
            });
        });
        // Get total count for pagination
        const totalCount = yield prisma.task.count({
            where: searchConditions,
        });
        // Fetch tasks - FIXED: assignedUsers is a direct relation to User
        const tasks = yield prisma.task.findMany({
            where: searchConditions,
            include: {
                subtasks: true,
                assignedUsers: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        email: true,
                        profilePictureUrl: true,
                    }
                },
                activityLogs: {
                    where: {
                        action: "completed",
                    },
                    include: {
                        user: true
                    },
                    orderBy: {
                        timestamp: "desc"
                    },
                },
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 5,
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    }
                },
                client: {
                    select: {
                        id: true,
                        domainName: true,
                        companyName: true,
                    }
                },
                attachments: {
                    include: {
                        uploadedBy: true
                    },
                    orderBy: {
                        createdAt: "desc"
                    },
                },
            },
            orderBy: {
                completedAt: "desc",
            },
            skip: skip,
            take: limitNum,
        });
        // Calculate report summary statistics
        let totalTimeSpent = 0;
        let totalCompletionTimeMs = 0;
        let tasksWithCompletionTime = 0;
        const tasksByUser = {};
        const tasksByProject = {};
        tasks.forEach((task) => {
            totalTimeSpent += task.timeSpent || 0;
            if (task.createdAt && task.completedAt) {
                const completionTime = task.completedAt.getTime() - task.createdAt.getTime();
                totalCompletionTimeMs += completionTime;
                tasksWithCompletionTime++;
            }
            // FIXED: assignedUsers is directly an array of User objects
            if (task.assignedUsers && task.assignedUsers.length > 0) {
                task.assignedUsers.forEach((user) => {
                    const userId = user.userId;
                    const userName = user.username || user.email;
                    if (!tasksByUser[userId]) {
                        tasksByUser[userId] = {
                            userName,
                            userId,
                            taskCount: 0,
                            totalTimeSpent: 0,
                            tasks: [],
                        };
                    }
                    tasksByUser[userId].taskCount++;
                    tasksByUser[userId].totalTimeSpent += task.timeSpent || 0;
                    tasksByUser[userId].tasks.push({
                        id: task.id,
                        title: task.title,
                        completedAt: task.completedAt,
                        timeSpent: task.timeSpent,
                    });
                });
            }
            if (task.project) {
                const projectId = task.project.id;
                if (!tasksByProject[projectId]) {
                    tasksByProject[projectId] = {
                        projectName: task.project.name,
                        projectId,
                        taskCount: 0,
                        totalTimeSpent: 0,
                        tasks: [],
                    };
                }
                tasksByProject[projectId].taskCount++;
                tasksByProject[projectId].totalTimeSpent += task.timeSpent || 0;
                tasksByProject[projectId].tasks.push({
                    id: task.id,
                    title: task.title,
                    completedAt: task.completedAt,
                    timeSpent: task.timeSpent,
                });
            }
        });
        const avgCompletionTimeHours = tasksWithCompletionTime > 0
            ? (totalCompletionTimeMs / tasksWithCompletionTime) / (1000 * 60 * 60)
            : 0;
        // Prepare report data with filtered today updates
        const reportData = {
            summary: {
                totalTasksCompleted: totalCount,
                tasksInCurrentPage: tasks.length,
                totalTimeSpent: formatTime(totalTimeSpent),
                averageCompletionTime: `${avgCompletionTimeHours.toFixed(2)} hours`,
                dateRange: {
                    from: fromDate ? startDate.toISOString() : startDate.toISOString(),
                    to: toDate ? endDate.toISOString() : (endDate ? endDate.toISOString() : null),
                },
                filters: {
                    assignedTo: username || "All Users",
                },
            },
            tasksByUser: Object.values(tasksByUser),
            tasksByProject: Object.values(tasksByProject),
            todayUpdates: transformedTodayUpdates,
            tasks: tasks.map((task) => {
                var _a, _b, _c, _d, _e;
                return ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    completedAt: task.completedAt,
                    createdAt: task.createdAt,
                    timeSpent: task.timeSpent,
                    formattedTimeSpent: formatTime(task.timeSpent || 0),
                    project: task.project,
                    client: task.client,
                    assignedUsers: task.assignedUsers, // Direct array of users now
                    subtasksCount: ((_a = task.subtasks) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    completedSubtasksCount: ((_b = task.subtasks) === null || _b === void 0 ? void 0 : _b.filter((st) => st.status === "completed").length) || 0,
                    attachmentsCount: ((_c = task.attachments) === null || _c === void 0 ? void 0 : _c.length) || 0,
                    commentsCount: ((_d = task.comments) === null || _d === void 0 ? void 0 : _d.length) || 0,
                    lastComment: (_e = task.comments) === null || _e === void 0 ? void 0 : _e[0],
                });
            }),
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalItems: totalCount,
                hasNext: pageNum < Math.ceil(totalCount / limitNum),
                hasPrev: pageNum > 1,
                itemsPerPage: limitNum,
            },
        };
        res.json({
            success: true,
            data: reportData,
            message: "Task report generated successfully",
        });
    }
    catch (error) {
        console.error("Error generating task report:", error);
        res.status(500).json({
            success: false,
            message: `Error generating task report: ${error.message}`,
        });
    }
});
exports.getTaskReport = getTaskReport;
// Keep all other existing controller functions here...
// (createTask, deleteTask, updateTask, getTasks, etc.)
// Get Task By ID Start
const getTaskById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const task = yield prisma.task.findUnique({
            where: {
                id: Number(taskId),
                isDeleted: false,
            },
            include: {
                assignedUsers: true,
                subtasks: {
                    where: {
                        isDeleted: false,
                    },
                    include: {
                        assignedUsers: true,
                        attachments: {
                            include: { uploadedBy: true },
                            orderBy: { createdAt: "desc" },
                        },
                        comments: {
                            include: { user: true },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                },
                project: true,
                client: true,
                attachments: {
                    include: { uploadedBy: true },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        // Calculate timer data similar to getTasks function
        let currentElapsed = 0;
        if (task.isTimerRunning && task.timerStartTime) {
            const now = new Date();
            const startTime = new Date(task.timerStartTime);
            currentElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        }
        // Format subtasks with timer data if needed
        const subtasksWithTimerData = task.subtasks.map((subtask) => {
            let subtaskCurrentElapsed = 0;
            if (subtask.isTimerRunning && subtask.timerStartTime) {
                const now = new Date();
                const startTime = new Date(subtask.timerStartTime);
                subtaskCurrentElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            }
            return Object.assign(Object.assign({}, subtask), { currentElapsed: subtaskCurrentElapsed, totalElapsed: subtask.timeSpent + subtaskCurrentElapsed, formattedTimeSpent: formatTime(subtask.timeSpent), formattedTotalElapsed: formatTime(subtask.timeSpent + subtaskCurrentElapsed), formattedCurrentElapsed: formatTime(subtaskCurrentElapsed) });
        });
        // Return task with timer data and formatted subtasks
        const taskWithTimerData = Object.assign(Object.assign({}, task), { currentElapsed, totalElapsed: task.timeSpent + currentElapsed, formattedTimeSpent: formatTime(task.timeSpent), formattedTotalElapsed: formatTime(task.timeSpent + currentElapsed), formattedCurrentElapsed: formatTime(currentElapsed), subtasks: subtasksWithTimerData });
        res.json(taskWithTimerData);
    }
    catch (error) {
        console.error("Error fetching task:", error);
        res
            .status(500)
            .json({ message: `Error retrieving task: ${error.message}` });
    }
});
exports.getTaskById = getTaskById;
// Get Task By ID End
// Get Task End
// Get My Tasks Count By Status Start
// Get My Tasks Count By Status Start
const getMyTasksCountByStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
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
        // Get counts for each status for the current user's tasks, excluding subtasks
        const counts = yield prisma.task.groupBy({
            by: ["status"],
            _count: {
                status: true,
            },
            where: {
                status: {
                    in: ["To Do", "Work In Progress", "QA", "Completed"],
                },
                parentTaskId: null, // Only count tasks that are not subtasks
                isDeleted: false, // Exclude deleted tasks
                assignedUsers: {
                    some: {
                        userId: userId,
                    },
                },
            },
        });
        // Initialize with all possible statuses
        const result = {
            "To Do": 0,
            "Work In Progress": 0,
            QA: 0,
            Completed: 0,
        };
        // Update counts from the query
        counts.forEach((item) => {
            result[item.status] = item._count.status;
        });
        res.json(result);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving task counts: ${error.message}` });
    }
});
exports.getMyTasksCountByStatus = getMyTasksCountByStatus;
// Get My Tasks Count By Status End
// Get Tasks Count By Status Start
const getTaskCountByStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get counts for each status, excluding subtasks (tasks with parentTaskId)
        const counts = yield prisma.task.groupBy({
            by: ["status"],
            _count: {
                status: true,
            },
            where: {
                status: {
                    in: ["To Do", "Work In Progress", "QA", "Completed"],
                },
                parentTaskId: null, // Only count tasks that are not subtasks
                isDeleted: false, // Exclude deleted tasks
            },
        });
        // Initialize with all possible statuses
        const result = {
            "To Do": 0,
            "Work In Progress": 0,
            QA: 0,
            Completed: 0,
        };
        // Update counts from the query
        counts.forEach((item) => {
            result[item.status] = item._count.status;
        });
        res.json(result);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving task counts: ${error.message}` });
    }
});
exports.getTaskCountByStatus = getTaskCountByStatus;
// Get Tasks Count By Status Start
// Get Tasks Count By Status Start
//Get Task End
//Get Task BY User Start
const getTasksByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { includeDeleted, page = "1", limit = "500", search, projectName, status, clientDomainName, companyName, } = req.query;
    try {
        // Validate userId first
        if (!userId || userId === "undefined") {
            res.status(400).json({ error: "User ID is required" });
            return;
        }
        const userIdNum = Number(userId);
        if (isNaN(userIdNum)) {
            res.status(400).json({ error: "Invalid User ID" });
            return;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build base conditions
        const baseConditions = {
            assignedUsers: {
                some: {
                    userId: userIdNum,
                },
            },
            isDeleted: includeDeleted ? undefined : false,
        };
        // Add status filter if provided
        if (status) {
            baseConditions.status = status;
        }
        // Build individual field filters
        const fieldFilters = {};
        if (projectName) {
            fieldFilters.project = {
                name: {
                    contains: projectName,
                },
            };
        }
        if (clientDomainName) {
            fieldFilters.client = {
                domainName: {
                    contains: clientDomainName,
                },
            };
        }
        if (companyName) {
            fieldFilters.client = {
                companyName: {
                    contains: companyName,
                },
            };
        }
        // Build search conditions
        let searchCondition = {};
        if (search) {
            searchCondition = {
                OR: [
                    {
                        title: {
                            contains: search,
                        },
                    },
                    {
                        project: {
                            name: {
                                contains: search,
                            },
                        },
                    },
                    {
                        client: {
                            domainName: {
                                contains: search,
                            },
                        },
                    },
                    {
                        client: {
                            companyName: {
                                contains: search,
                            },
                        },
                    },
                    {
                        description: {
                            contains: search,
                        },
                    },
                    {
                        assignedUsers: {
                            some: {
                                username: {
                                    contains: search,
                                },
                            },
                        },
                    },
                    {
                        assignedUsers: {
                            some: {
                                email: {
                                    contains: search,
                                },
                            },
                        },
                    },
                ],
            };
        }
        // Combine all conditions
        const allConditions = [
            baseConditions,
            searchCondition,
            fieldFilters,
        ].filter((condition) => Object.keys(condition).length > 0);
        const finalConditions = allConditions.length > 0 ? { AND: allConditions } : {};
        // Get total count for pagination
        const totalCount = yield prisma.task.count({
            where: finalConditions,
        });
        // For completed tasks, we need to handle pagination differently
        let tasksQuery = {
            where: finalConditions,
            include: {
                assignedUsers: true,
                subtasks: true,
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                },
                project: true,
                attachments: {
                    include: { uploadedBy: true },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: [
                {
                    priority: {
                        sort: "asc",
                        nulls: "last",
                    },
                },
                {
                    dueDate: "asc",
                },
            ],
        };
        // Handle pagination logic
        let completedTasksConditions = {};
        let nonCompletedConditions = {};
        if (status === "completed" || baseConditions.status === "completed") {
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        else if (!status) {
            // Create conditions for non-completed tasks
            nonCompletedConditions = Object.assign(Object.assign({}, finalConditions), { status: {
                    not: "completed",
                } });
            tasksQuery.where = nonCompletedConditions;
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
            // Create conditions for completed tasks (for later use)
            completedTasksConditions = Object.assign(Object.assign({}, finalConditions), { status: "completed" });
        }
        else {
            tasksQuery.skip = skip;
            tasksQuery.take = limitNum;
        }
        const tasks = yield prisma.task.findMany(tasksQuery);
        const tasksWithTimerData = tasks.map((task) => {
            let currentElapsed = 0;
            if (task.isTimerRunning && task.timerStartTime) {
                currentElapsed = Math.floor((new Date().getTime() - new Date(task.timerStartTime).getTime()) /
                    1000);
            }
            return Object.assign(Object.assign({}, task), { currentElapsed, totalElapsed: task.timeSpent + currentElapsed, formattedTimeSpent: formatTime(task.timeSpent), formattedTotalElapsed: formatTime(task.timeSpent + currentElapsed), formattedCurrentElapsed: formatTime(currentElapsed) });
        });
        // If no status filter and we're on the first page, get completed tasks separately
        let completedTasks = [];
        if (!status && pageNum === 1) {
            completedTasks = yield prisma.task.findMany({
                where: completedTasksConditions,
                include: tasksQuery.include,
                orderBy: tasksQuery.orderBy,
                take: 500,
            });
        }
        // Manual sorting by priority
        const priorityOrder = {
            [Priority.Urgent]: 0,
            [Priority.High]: 1,
            [Priority.Normal]: 2,
        };
        const sortedTasks = tasksWithTimerData.sort((a, b) => {
            return (priorityOrder[a.priority] -
                priorityOrder[b.priority]);
        });
        const sortedCompletedTasks = completedTasks.sort((a, b) => {
            return (priorityOrder[a.priority] -
                priorityOrder[b.priority]);
        });
        // Combine results: non-completed tasks + limited completed tasks (only on first page)
        const allTasks = pageNum === 1 ? [...sortedTasks, ...sortedCompletedTasks] : sortedTasks;
        // Adjust total count calculation for the special case
        let adjustedTotalCount = totalCount;
        if (!status) {
            // Get count of non-completed tasks
            const nonCompletedCount = yield prisma.task.count({
                where: nonCompletedConditions,
            });
            // Get count of completed tasks (we'll only show max 10)
            const completedCount = yield prisma.task.count({
                where: completedTasksConditions,
            });
            adjustedTotalCount = nonCompletedCount + Math.min(completedCount, 500);
        }
        res.json({
            tasks: allTasks,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(adjustedTotalCount / limitNum),
                totalItems: adjustedTotalCount,
                hasNext: pageNum < Math.ceil(adjustedTotalCount / limitNum),
                hasPrev: pageNum > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});
exports.getTasksByUser = getTasksByUser;
//Get Task BY User End
//Get Task BY User End
// Update Task Status Start
// Update Task Status Start
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { taskId } = req.params;
    const { status, updatedBy } = req.body;
    try {
        const existingTask = yield prisma.task.findUnique({
            where: {
                id: Number(taskId),
                isDeleted: false,
            },
            include: {
                assignedUsers: true,
                client: {
                    select: {
                        domainName: true,
                        companyName: true,
                    },
                },
            },
        });
        if (!existingTask) {
            res.status(404).json({ message: "Task not found or has been deleted" });
            return;
        }
        const previousStatus = existingTask.status || "Not set";
        if (previousStatus === status) {
            res.json(existingTask);
            return;
        }
        // Get updating user details
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: Number(updatedBy) },
            select: { username: true, email: true },
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the task" });
            return;
        }
        // Enhanced Activity Log with detailed status change information
        yield prisma.activityLog.create({
            data: {
                action: "STATUS_UPDATE",
                details: `${updatingUser.username} updated the task status from "${previousStatus}" to "${status}"`,
                userId: Number(updatedBy),
                taskId: Number(taskId),
            },
        });
        // Set completedAt when status changes to "completed"
        let completedAt = undefined;
        if (status === "Completed" && previousStatus !== "Completed") {
            completedAt = new Date();
        }
        // Clear completedAt if moving from completed to another status
        else if (status !== "Completed" && previousStatus === "Completed") {
            completedAt = null;
        }
        const updatedTask = yield prisma.task.update({
            where: {
                id: Number(taskId),
                isDeleted: false,
            },
            data: { status, completedAt: completedAt },
            include: {
                assignedUsers: true,
                client: {
                    select: {
                        domainName: true,
                        companyName: true,
                    },
                },
            },
        });
        const currentTime = new Date();
        const formattedUpdateTime = formatNepaliTime(currentTime);
        const projectName = ((_a = updatedTask.client) === null || _a === void 0 ? void 0 : _a.domainName) ||
            ((_b = updatedTask.client) === null || _b === void 0 ? void 0 : _b.companyName) ||
            "Unknown Project";
        const emailSubject = `Task Status Updated: ${updatedTask.title}`;
        const emailMessage = taskStatusUpdatedEmailTemplate(updatingUser.username, updatedTask.title, projectName, previousStatus, status, formattedUpdateTime, updatedTask.id.toString());
        // Collect all recipient emails
        const recipientEmails = [];
        if (updatedTask.assignedUsers) {
            updatedTask.assignedUsers.forEach((user) => {
                if (user.email) {
                    recipientEmails.push(user.email);
                }
            });
        }
        recipientEmails.push("gaurav@webtech.com.np");
        // Send email
        sendMail(recipientEmails.join(","), emailSubject, emailMessage);
        // Create detailed notifications
        if (updatedTask.assignedUsers) {
            for (const user of updatedTask.assignedUsers) {
                yield createNotification(user.userId, "Task Status Updated", `${updatingUser.username} changed task "${updatedTask.title}" status from ${previousStatus} to ${status}`, "status_changed");
            }
        }
        // Emit to all assigned users' rooms
        for (const user of updatedTask.assignedUsers) {
            index_1.io.to(String(user.userId)).emit("task:statusUpdated", {
                taskId: updatedTask.id,
                newStatus: status,
                previousStatus,
                updatedBy: updatingUser.username,
            });
        }
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTaskStatus = updateTaskStatus;
// Get Task By Status End
// Get Task By Status End
// Get Task By UserId For User Tasks Start
// Get Task By UserId For User Tasks Start
const getTasksByUserIdForUserTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { includeDeleted } = req.query; // Add includeDeleted query param
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedUsers: {
                    some: {
                        userId: Number(userId),
                    },
                },
                isDeleted: includeDeleted ? undefined : false, // Exclude deleted tasks by default
            },
            include: {
                assignedUsers: true,
                subtasks: true,
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasksByUserIdForUserTasks = getTasksByUserIdForUserTasks;
//Get Task By UserId For User Tasks End
//Get Task By UserId For User Tasks End
// Get Task By UserId For Profile Start
// Get Task By UserId For Profile Start
const getTasksByUserIdForProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { includeDeleted } = req.query; // Add includeDeleted query param
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedUsers: {
                    some: {
                        userId: Number(userId),
                    },
                },
                isDeleted: includeDeleted ? undefined : false, // Exclude deleted tasks by default
            },
            include: {
                assignedUsers: true,
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasksByUserIdForProfile = getTasksByUserIdForProfile;
// Get Task By UserId For Profile End
// Get Task By UserId For Profile End
// Update Task Start
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { taskId } = req.params;
    const { title, description, status, priority, startDate, dueDate, assignedTo, // This should be the userId
    assignedBy, clientId, } = req.body;
    try {
        const existingTask = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                client: true, // Changed from project to client
                assignedUsers: true,
            },
        });
        if (!existingTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        if (!req.body.category) {
            res.status(400).json({ message: "Category is required" });
            return;
        }
        // Fetch the assigned user's details
        const assignedUsers = yield prisma.user.findMany({
            where: {
                userId: {
                    in: assignedTo.map((id) => Number(id)),
                },
            },
        });
        if (!assignedUsers || assignedUsers.length !== assignedTo.length) {
            res.status(400).json({ message: "One or more assigned users not found" });
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
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the task" });
            return;
        }
        // Get the client/project name (domainName if available, otherwise companyName)
        const getProjectName = (clientId) => __awaiter(void 0, void 0, void 0, function* () {
            if (!clientId)
                return "No Project";
            const client = yield prisma.client.findUnique({
                where: { id: clientId },
            });
            return (client === null || client === void 0 ? void 0 : client.domainName) || (client === null || client === void 0 ? void 0 : client.companyName) || "Unknown Project";
        });
        const oldProjectName = existingTask.client
            ? existingTask.client.domainName ||
                existingTask.client.companyName ||
                "Unknown Project"
            : "No Project";
        let newProjectName = oldProjectName;
        // Check if clientId is being updated (handling undefined/null vs actual value)
        const newClientId = clientId !== undefined && clientId !== null && clientId !== "" ? Number(clientId) : null;
        const oldClientId = existingTask.clientId;
        if (newClientId !== oldClientId) {
            newProjectName = yield getProjectName(newClientId || undefined);
        }
        // Prepare update data
        const updateData = {
            title,
            description,
            status,
            priority,
            startDate,
            dueDate,
            assignedBy,
            category: req.body.category,
            assignedUsers: {
                set: assignedTo.map((userId) => ({ userId: Number(userId) })),
            },
        };
        // Only include clientId if it's provided (can be null to remove association)
        if (clientId !== undefined) {
            // Allow null or empty string to set clientId to null
            if (clientId === null || clientId === "") {
                updateData.clientId = null;
            }
            else {
                updateData.clientId = Number(clientId);
            }
        }
        // Update the task
        const updatedTask = yield prisma.task.update({
            where: { id: Number(taskId) },
            data: updateData,
            include: {
                client: true, // Include client information
                assignedUsers: true,
            },
        });
        const changes = [];
        if (title && title !== existingTask.title) {
            changes.push(`Task Title: <strong>${existingTask.title}</strong> → <strong>${title}</strong>`);
        }
        if (description !== undefined && description !== existingTask.description) {
            changes.push(`Description: <strong>${existingTask.description || "N/A"}</strong> → <strong>${description || "N/A"}</strong>`);
        }
        if (status && status !== existingTask.status) {
            changes.push(`Status: <strong>${existingTask.status || "N/A"}</strong> → <strong>${status}</strong>`);
        }
        if (priority && priority !== existingTask.priority) {
            changes.push(`Priority: <strong>${existingTask.priority || "N/A"}</strong> → <strong>${priority}</strong>`);
        }
        if (startDate &&
            existingTask.startDate !== null &&
            new Date(startDate).getTime() !==
                new Date(existingTask.startDate).getTime()) {
            const oldStartDate = (0, date_fns_tz_1.format)(new Date(existingTask.startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newStartDate = (0, date_fns_tz_1.format)(new Date(startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            changes.push(`Start Date: <strong>${oldStartDate}</strong> → <strong>${newStartDate}</strong>`);
        }
        if (dueDate &&
            existingTask.dueDate !== null &&
            new Date(dueDate).getTime() !== new Date(existingTask.dueDate).getTime()) {
            const oldDueDate = (0, date_fns_tz_1.format)(new Date(existingTask.dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newDueDate = (0, date_fns_tz_1.format)(new Date(dueDate), "MMMM dd, yyyy hh:mm a", {
                timeZone: "Asia/Kathmandu",
            });
            changes.push(`Due Date: <strong>${oldDueDate}</strong> → <strong>${newDueDate}</strong>`);
        }
        if (assignedTo &&
            JSON.stringify(assignedTo) !==
                JSON.stringify(existingTask.assignedUsers.map((u) => u.userId.toString()))) {
            const oldAssignees = existingTask.assignedUsers
                .map((u) => u.username || u.userId.toString())
                .join(", ") || "N/A";
            const newAssignees = updatedTask.assignedUsers
                .map((u) => u.username || u.userId.toString())
                .join(", ") || "N/A";
            changes.push(`Assigned Users: <strong>${oldAssignees}</strong> → <strong>${newAssignees}</strong>`);
        }
        // Handle client/project change (including removal)
        if (newClientId !== oldClientId) {
            const oldProjectDisplay = oldProjectName || "No Project";
            const newProjectDisplay = newProjectName || "No Project";
            changes.push(`Project: <strong>${oldProjectDisplay}</strong> → <strong>${newProjectDisplay}</strong>`);
        }
        if (assignedBy && assignedBy !== existingTask.assignedBy) {
            const oldAssignedBy = ((_b = (yield prisma.user.findUnique({
                where: { email: existingTask.assignedBy },
            }))) === null || _b === void 0 ? void 0 : _b.username) ||
                existingTask.assignedBy ||
                "N/A";
            const newAssignedBy = ((_c = (yield prisma.user.findUnique({ where: { email: assignedBy } }))) === null || _c === void 0 ? void 0 : _c.username) ||
                assignedBy ||
                "N/A";
            changes.push(`Assigned By: <strong>${oldAssignedBy}</strong> → <strong>${newAssignedBy}</strong>`);
        }
        if (changes.length > 0) {
            const emailSubject = `Task Updated: ${updatedTask.title}`;
            const emailMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white; margin: 0;">
            Task Updated by ${updatingUser.username}
          </h2>
          <div style="padding: 20px;">
            <p>
              <strong>${updatingUser.username}</strong> updated the task <strong>${updatedTask.title}</strong> of <strong>${newProjectName || "No Project"}</strong>:
            </p>
            <ul style="list-style-type: disc; padding-left: 20px;">
              ${changes.map((change) => `<li>${change}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
            for (const user of assignedUsers) {
                if (user.email) {
                    sendMail(user.email, emailSubject, emailMessage);
                }
            }
            sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
            // sendMail("sudeep@webtechnepal.com", emailSubject, emailMessage);
            // Send notifications
            for (const user of updatedTask.assignedUsers) {
                const projectName = ((_d = updatedTask.client) === null || _d === void 0 ? void 0 : _d.domainName) || ((_e = updatedTask.client) === null || _e === void 0 ? void 0 : _e.companyName) || "No Project";
                yield createNotification(user.userId, "Task Updated", `The task "${updatedTask.title}" in project "${projectName}" has been updated`, "task_updated");
            }
        }
        for (const user of updatedTask.assignedUsers) {
            index_1.io.to(String(user.userId)).emit("task:updated", {
                task: updatedTask,
            });
        }
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTask = updateTask;
// Update Task End
const uploadAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { taskId } = req.params;
    try {
        const task = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        if (!req.files || !Array.isArray(req.files)) {
            res.status(400).json({ message: "No files uploaded" });
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
        const uploadedAttachments = yield Promise.all(req.files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const attachment = yield prisma.attachment.create({
                data: {
                    fileName: file.originalname,
                    fileURL: `uploads/${file.filename}`,
                    taskId: Number(taskId),
                    uploadedById: decodedToken.userId,
                },
            });
            return attachment;
        })));
        yield prisma.activityLog.create({
            data: {
                action: "UPLOAD_ATTACHMENT",
                details: `Uploaded ${uploadedAttachments.length} attachment(s) to task ${taskId}`,
                userId: decodedToken.userId,
                taskId: Number(taskId),
            },
        });
        res.status(201).json(uploadedAttachments);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error uploading attachments: ${error.message}` });
    }
});
exports.uploadAttachments = uploadAttachments;
// Delete Task Start
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { taskId } = req.params;
    try {
        const taskToDelete = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                client: true, // Include client information
                assignedUsers: true,
            },
        });
        if (!taskToDelete) {
            res.status(404).json({ message: "Task not found" });
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
        const deletingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!deletingUser) {
            res.status(400).json({ message: "Invalid user deleting the task" });
            return;
        }
        // Get the project name (domainName if available, otherwise companyName)
        const projectName = ((_b = taskToDelete.client) === null || _b === void 0 ? void 0 : _b.domainName) ||
            ((_c = taskToDelete.client) === null || _c === void 0 ? void 0 : _c.companyName) ||
            "Unknown Project";
        // Delete the task and all its related records in a transaction
        yield prisma.$transaction([
            prisma.attachment.deleteMany({
                where: { taskId: Number(taskId) },
            }),
            prisma.task.deleteMany({
                where: { parentTaskId: Number(taskId) },
            }),
            prisma.task.delete({
                where: { id: Number(taskId) },
            }),
        ]);
        // Send email to gaurav@webtech.com.np
        const gauravEmailSubject = `Task Deleted: ${taskToDelete.title}`;
        const gauravEmailMessage = (0, emailTemplates_1.taskDeletedEmailTemplate)(deletingUser.username || "Unknown User", taskToDelete.title, projectName);
        sendMail("gaurav@webtech.com.np", gauravEmailSubject, gauravEmailMessage);
        // sendMail("sudeep@webtechnepal.com", gauravEmailSubject, gauravEmailMessage);
        // Send notifications to assigned users
        if (taskToDelete.assignedUsers) {
            for (const user of taskToDelete.assignedUsers) {
                yield createNotification(user.userId, "Task Deleted", `The task "${taskToDelete.title}" in project "${projectName}" has been deleted`, "task_deleted");
            }
        }
        res.status(200).json({ message: "Task successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting task: ${error.message}` });
    }
});
exports.deleteTask = deleteTask;
const softDeleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { taskId } = req.params;
    try {
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
        const deletingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!deletingUser) {
            res.status(400).json({ message: "Invalid user deleting the task" });
            return;
        }
        const taskToDelete = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                assignedUsers: true,
                client: true,
                subtasks: true,
                timeLogs: {
                    where: {
                        endTime: null,
                    },
                },
            },
        });
        if (!taskToDelete) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        // Stop any running timers for this task
        if (taskToDelete.isTimerRunning && taskToDelete.timerStartTime) {
            const elapsedSeconds = Math.floor((new Date().getTime() - taskToDelete.timerStartTime.getTime()) / 1000);
            const newTimeSpent = taskToDelete.timeSpent + elapsedSeconds;
            // Update active time logs
            if (taskToDelete.timeLogs.length > 0) {
                yield prisma.timeLog.updateMany({
                    where: {
                        taskId: Number(taskId),
                        endTime: null,
                    },
                    data: {
                        endTime: new Date(),
                        duration: elapsedSeconds,
                    },
                });
            }
            // Update task time
            yield prisma.task.update({
                where: { id: Number(taskId) },
                data: {
                    timeSpent: newTimeSpent,
                    isTimerRunning: false,
                    timerStartTime: null,
                },
            });
        }
        // Stop timers for all subtasks
        const subtasksWithTimers = yield prisma.task.findMany({
            where: {
                parentTaskId: Number(taskId),
                isTimerRunning: true,
            },
            include: {
                timeLogs: {
                    where: {
                        endTime: null,
                    },
                },
            },
        });
        for (const subtask of subtasksWithTimers) {
            if (subtask.timerStartTime) {
                const elapsedSeconds = Math.floor((new Date().getTime() - subtask.timerStartTime.getTime()) / 1000);
                const newTimeSpent = subtask.timeSpent + elapsedSeconds;
                // Update active time logs for subtask
                if (subtask.timeLogs.length > 0) {
                    yield prisma.timeLog.updateMany({
                        where: {
                            subtaskId: subtask.id,
                            endTime: null,
                        },
                        data: {
                            endTime: new Date(),
                            duration: elapsedSeconds,
                        },
                    });
                }
                // Update subtask time
                yield prisma.task.update({
                    where: { id: subtask.id },
                    data: {
                        timeSpent: newTimeSpent,
                        isTimerRunning: false,
                        timerStartTime: null,
                    },
                });
            }
            else {
                // If timer is running but no start time, just stop the timer
                yield prisma.task.update({
                    where: { id: subtask.id },
                    data: {
                        isTimerRunning: false,
                        timerStartTime: null,
                    },
                });
            }
        }
        // Soft delete the task and all its subtasks in a transaction
        yield prisma.$transaction([
            // Soft delete all subtasks first
            prisma.task.updateMany({
                where: { parentTaskId: Number(taskId) },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    isTimerRunning: false,
                    timerStartTime: null,
                },
            }),
            // Soft delete the main task
            prisma.task.update({
                where: { id: Number(taskId) },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    isTimerRunning: false,
                    timerStartTime: null,
                },
            }),
        ]);
        // Get the project name
        const projectName = ((_b = taskToDelete.client) === null || _b === void 0 ? void 0 : _b.domainName) ||
            ((_c = taskToDelete.client) === null || _c === void 0 ? void 0 : _c.companyName) ||
            "Unknown Project";
        // Send delete email
        const emailSubject = `Task Deleted: ${taskToDelete.title}`;
        const emailMessage = (0, emailTemplates_1.taskDeletedEmailTemplate)(deletingUser.username || "Unknown User", taskToDelete.title, projectName);
        sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
        // Create notifications for assigned users
        if (taskToDelete.assignedUsers) {
            for (const user of taskToDelete.assignedUsers) {
                yield createNotification(user.userId, "Task Deleted", `The task "${taskToDelete.title}" in project "${projectName}" has been deleted`, "task_deleted");
            }
        }
        if (taskToDelete.assignedUsers) {
            for (const user of taskToDelete.assignedUsers) {
                index_1.io.to(String(user.userId)).emit("task:deleted", {
                    taskId: Number(taskId),
                    title: taskToDelete.title,
                });
            }
        }
        res.status(200).json({ message: "Task successfully soft deleted" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error soft deleting task: ${error.message}` });
    }
});
exports.softDeleteTask = softDeleteTask;
// Restore task
const restoreTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { taskId } = req.params;
    try {
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
        const restoringUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!restoringUser) {
            res.status(400).json({ message: "Invalid user restoring the task" });
            return;
        }
        const taskToRestore = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                assignedUsers: true,
                client: true,
                subtasks: true,
            },
        });
        if (!taskToRestore) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        if (!taskToRestore.isDeleted) {
            res.status(400).json({ message: "Task is not deleted" });
            return;
        }
        // Restore the task and all its subtasks in a transaction
        yield prisma.$transaction([
            // Restore all subtasks
            prisma.task.updateMany({
                where: { parentTaskId: Number(taskId) },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                },
            }),
            // Restore the main task
            prisma.task.update({
                where: { id: Number(taskId) },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                },
            }),
        ]);
        // Get the project name
        const projectName = ((_b = taskToRestore.client) === null || _b === void 0 ? void 0 : _b.domainName) ||
            ((_c = taskToRestore.client) === null || _c === void 0 ? void 0 : _c.companyName) ||
            "Unknown Project";
        // Create notifications for assigned users
        if (taskToRestore.assignedUsers) {
            for (const user of taskToRestore.assignedUsers) {
                yield createNotification(user.userId, "Task Restored", `The task "${taskToRestore.title}" in project "${projectName}" has been restored`, "task_restored");
            }
        }
        res.status(200).json({ message: "Task successfully restored" });
    }
    catch (error) {
        res.status(500).json({ message: `Error restoring task: ${error.message}` });
    }
});
exports.restoreTask = restoreTask;
// Get deleted tasks for a specific project/client (optional)
const getDeletedTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params; // This could be clientId or projectId depending on your needs
    try {
        const deletedTasks = yield prisma.task.findMany({
            where: {
                clientId: Number(taskId), // Assuming taskId is actually clientId here
                isDeleted: true,
                parentTaskId: null, // Only get main tasks, not subtasks
            },
            include: {
                assignedUsers: true,
                client: {
                    select: {
                        id: true,
                        domainName: true,
                        companyName: true,
                    },
                },
            },
            orderBy: {
                deletedAt: "desc",
            },
        });
        res.status(200).json(deletedTasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error fetching deleted tasks: ${error.message}` });
    }
});
exports.getDeletedTasks = getDeletedTasks;
// Get all deleted tasks
const getAllDeletedTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedTasks = yield prisma.task.findMany({
            where: {
                isDeleted: true,
                parentTaskId: null, // Only get main tasks, not subtasks
            },
            include: {
                assignedUsers: true,
                client: {
                    select: {
                        id: true,
                        domainName: true,
                        companyName: true,
                    },
                },
            },
            orderBy: {
                deletedAt: "desc",
            },
        });
        res.status(200).json(deletedTasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error fetching all deleted tasks: ${error.message}` });
    }
});
exports.getAllDeletedTasks = getAllDeletedTasks;
// Permanent delete task (similar to your original delete but with isDeleted check)
const permanentDeleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { taskId } = req.params;
    try {
        const taskToDelete = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                client: true,
                assignedUsers: true,
            },
        });
        if (!taskToDelete) {
            res.status(404).json({ message: "Task not found" });
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
        const deletingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!deletingUser) {
            res.status(400).json({ message: "Invalid user deleting the task" });
            return;
        }
        // Get the project name
        const projectName = ((_b = taskToDelete.client) === null || _b === void 0 ? void 0 : _b.domainName) ||
            ((_c = taskToDelete.client) === null || _c === void 0 ? void 0 : _c.companyName) ||
            "Unknown Project";
        // Delete the task and all its related records in a transaction
        yield prisma.$transaction([
            prisma.attachment.deleteMany({
                where: { taskId: Number(taskId) },
            }),
            prisma.task.deleteMany({
                where: { parentTaskId: Number(taskId) },
            }),
            prisma.task.delete({
                where: { id: Number(taskId) },
            }),
        ]);
        // Send email
        const emailSubject = `Task Permanently Deleted: ${taskToDelete.title}`;
        const emailMessage = (0, emailTemplates_1.taskDeletedEmailTemplate)(deletingUser.username || "Unknown User", taskToDelete.title, projectName);
        sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
        // Send notifications to assigned users
        if (taskToDelete.assignedUsers) {
            for (const user of taskToDelete.assignedUsers) {
                yield createNotification(user.userId, "Task Permanently Deleted", `The task "${taskToDelete.title}" in project "${projectName}" has been permanently deleted`, "task_deleted_permanent");
            }
        }
        res.status(200).json({ message: "Task successfully permanently deleted" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error permanently deleting task: ${error.message}` });
    }
});
exports.permanentDeleteTask = permanentDeleteTask;
const mentionEmailTemplate = (mentionedUsername, mentionedByUsername, taskTitle, projectDomainName, commentContent, taskId) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: auto; padding: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #6a11cb, #2575fc); padding: 25px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 500;">You Were Mentioned in a Comment</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px;">
    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px; font-size: 16px; color: #333;">
        <strong style="color: #6a11cb;">${mentionedByUsername}</strong> mentioned you in a comment on task 
        <strong style="color: #6a11cb;">${taskTitle}</strong> 
        ${projectDomainName ? `in project <strong>${projectDomainName}</strong>` : ""}.
      </p>
      
      <div style="background-color: white; border-radius: 6px; padding: 15px; margin-top: 15px; border-left: 4px solid #6a11cb;">
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #666;"><strong>Comment:</strong></p>
          <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #e5e5e5;">
            <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.5;">${commentContent}</p>
          </div>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
          <div style="flex: 1; min-width: 200px;">
            <p style="margin: 0; font-size: 14px; color: #666;"><strong>Task:</strong></p>
            <p style="margin: 5px 0 0; font-size: 15px; font-weight: 500;">${taskTitle}</p>
          </div>
          
          <div style="flex: 1; min-width: 200px;">
            <p style="margin: 0; font-size: 14px; color: #666;"><strong>Project:</strong></p>
            <p style="margin: 5px 0 0; font-size: 15px; font-weight: 500;">${projectDomainName || "No project"}</p>
          </div>
        </div>

        <!-- View Task Button -->
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://www.webtech.mobi.np/task/${taskId}" 
             style="display: inline-block; background: linear-gradient(135deg, #6a11cb, #2575fc); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            View Task & Comment
          </a>
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
// Comment Controller with Edit, Delete, Like, and Reply functionality
// Helper function to extract mentions (existing)
function extractMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]);
    }
    return [...new Set(mentions)]; // Remove duplicates
}
// Send mention notifications helper
const sendMentionNotifications = (mentionedUsernames_1, commentUser_1, task_1, content_1, commentId_1, ...args_1) => __awaiter(void 0, [mentionedUsernames_1, commentUser_1, task_1, content_1, commentId_1, ...args_1], void 0, function* (mentionedUsernames, commentUser, task, content, commentId, isReply = false) {
    var _a, _b;
    if (mentionedUsernames.length > 0) {
        const mentionedUsers = yield prisma.user.findMany({
            where: {
                username: {
                    in: mentionedUsernames,
                },
            },
        });
        for (const mentionedUser of mentionedUsers) {
            // Create mention record
            if (isReply) {
                yield prisma.commentReplyMention.create({
                    data: {
                        replyId: commentId,
                        userId: mentionedUser.userId,
                    },
                });
            }
            else {
                yield prisma.mention.create({
                    data: {
                        commentId: commentId,
                        userId: mentionedUser.userId,
                    },
                });
            }
            // Send email notification
            if (mentionedUser.email) {
                const emailSubject = `You were mentioned in a ${isReply ? "reply" : "comment"} on task: ${task.title}`;
                const emailMessage = mentionEmailTemplate(mentionedUser.username, commentUser.username, task.title, ((_a = task.client) === null || _a === void 0 ? void 0 : _a.domainName) || ((_b = task.project) === null || _b === void 0 ? void 0 : _b.name) || "Unknown Project", content, task.id.toString());
                sendMail(mentionedUser.email, emailSubject, emailMessage);
            }
            // Create in-app notification
            yield createNotification(mentionedUser.userId, "You Were Mentioned", `${commentUser.username} mentioned you in a ${isReply ? "reply" : "comment"} on task "${task.title}"`, "mention");
        }
    }
});
const addCommentToTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { content, userId } = req.body;
    try {
        const commentUser = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { username: true, email: true },
        });
        if (!commentUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const task = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                client: true,
                project: true,
            },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const newComment = yield prisma.comment.create({
            data: {
                content,
                userId: Number(userId),
                taskId: Number(taskId),
            },
            include: {
                user: true,
                mentions: {
                    include: {
                        user: true,
                    },
                },
                likes: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                            },
                        },
                    },
                },
                replies: {
                    include: {
                        user: true,
                        likes: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });
        // Extract and process mentions
        const mentionedUsernames = extractMentions(content);
        yield sendMentionNotifications(mentionedUsernames, commentUser, task, content, newComment.id, false);
        res.status(201).json(newComment);
    }
    catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: `Error adding comment: ${error.message}` });
    }
});
exports.addCommentToTask = addCommentToTask;
const getTaskComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const comments = yield prisma.comment.findMany({
            where: { taskId: Number(taskId) },
            include: {
                user: true,
                mentions: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(comments);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving comments: ${error.message}` });
    }
});
exports.getTaskComments = getTaskComments;
// Edit Comment Function
const editComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content, userId } = req.body;
    try {
        const existingComment = yield prisma.comment.findUnique({
            where: { id: Number(commentId) },
            include: {
                user: true,
                mentions: {
                    include: { user: true },
                },
            },
        });
        if (!existingComment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        if (existingComment.userId !== Number(userId)) {
            res.status(403).json({ message: "You can only edit your own comments" });
            return;
        }
        // Extract old and new mentions for comparison
        const oldMentionedUsernames = existingComment.mentions.map((m) => m.user.username);
        const newMentionedUsernames = extractMentions(content);
        const updatedComment = yield prisma.comment.update({
            where: { id: Number(commentId) },
            data: {
                content,
                isEdited: true,
                updatedAt: new Date(),
            },
            include: {
                user: true,
                mentions: {
                    include: { user: true },
                },
                likes: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                            },
                        },
                    },
                },
                replies: {
                    include: {
                        user: true,
                        likes: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });
        const task = yield prisma.task.findUnique({
            where: { id: existingComment.taskId },
            include: { client: true, project: true },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const commentUser = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { username: true, email: true },
        });
        if (!commentUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Handle mention changes
        const mentionsToAdd = newMentionedUsernames.filter((username) => !oldMentionedUsernames.includes(username));
        const mentionsToRemove = oldMentionedUsernames.filter((username) => !newMentionedUsernames.includes(username));
        // Remove old mentions
        if (mentionsToRemove.length > 0) {
            const usersToRemove = yield prisma.user.findMany({
                where: { username: { in: mentionsToRemove } },
            });
            for (const userToRemove of usersToRemove) {
                yield prisma.mention.deleteMany({
                    where: {
                        commentId: Number(commentId),
                        userId: userToRemove.userId,
                    },
                });
            }
        }
        // Add new mentions
        yield sendMentionNotifications(mentionsToAdd, commentUser, task, content, Number(commentId), false);
        res.status(200).json(updatedComment);
    }
    catch (error) {
        console.error("Error editing comment:", error);
        res
            .status(500)
            .json({ message: `Error editing comment: ${error.message}` });
    }
});
exports.editComment = editComment;
// Delete Comment Function
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { userId } = req.body;
    try {
        const existingComment = yield prisma.comment.findUnique({
            where: { id: Number(commentId) },
        });
        if (!existingComment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        if (existingComment.userId !== Number(userId)) {
            res
                .status(403)
                .json({ message: "You can only delete your own comments" });
            return;
        }
        yield prisma.comment.delete({
            where: { id: Number(commentId) },
        });
        res.status(200).json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        res
            .status(500)
            .json({ message: `Error deleting comment: ${error.message}` });
    }
});
exports.deleteComment = deleteComment;
// Like/Unlike Comment Function
const toggleCommentLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { userId } = req.body;
    try {
        const existingComment = yield prisma.comment.findUnique({
            where: { id: Number(commentId) },
        });
        if (!existingComment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        const existingLike = yield prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId: Number(userId),
                    commentId: Number(commentId),
                },
            },
        });
        if (existingLike) {
            // Unlike
            yield prisma.commentLike.delete({
                where: {
                    userId_commentId: {
                        userId: Number(userId),
                        commentId: Number(commentId),
                    },
                },
            });
            res.status(200).json({ message: "Comment unliked", liked: false });
        }
        else {
            // Like
            yield prisma.commentLike.create({
                data: {
                    userId: Number(userId),
                    commentId: Number(commentId),
                },
            });
            res.status(200).json({ message: "Comment liked", liked: true });
        }
    }
    catch (error) {
        console.error("Error toggling comment like:", error);
        res
            .status(500)
            .json({ message: `Error toggling comment like: ${error.message}` });
    }
});
exports.toggleCommentLike = toggleCommentLike;
// Add Reply to Comment Function
const addReplyToComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content, userId, parentReplyId } = req.body;
    try {
        const parentComment = yield prisma.comment.findUnique({
            where: { id: Number(commentId) },
        });
        if (!parentComment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        const replyUser = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { username: true, email: true },
        });
        if (!replyUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const task = yield prisma.task.findUnique({
            where: { id: parentComment.taskId },
            include: { client: true, project: true },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const newReply = yield prisma.commentReply.create({
            data: {
                content,
                userId: Number(userId),
                commentId: Number(commentId),
                parentReplyId: parentReplyId ? Number(parentReplyId) : null,
            },
            include: {
                user: true,
                likes: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                            },
                        },
                    },
                },
                mentions: {
                    include: {
                        user: true,
                    },
                },
                replies: {
                    include: {
                        user: true,
                        likes: true,
                    },
                },
            },
        });
        // Extract and process mentions for reply
        const mentionedUsernames = extractMentions(content);
        yield sendMentionNotifications(mentionedUsernames, replyUser, task, content, newReply.id, true);
        res.status(201).json(newReply);
    }
    catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ message: `Error adding reply: ${error.message}` });
    }
});
exports.addReplyToComment = addReplyToComment;
// Edit Reply Function
const editReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { replyId } = req.params;
    const { content, userId } = req.body;
    try {
        const existingReply = yield prisma.commentReply.findUnique({
            where: { id: Number(replyId) },
            include: {
                mentions: {
                    include: { user: true },
                },
            },
        });
        if (!existingReply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        if (existingReply.userId !== Number(userId)) {
            res.status(403).json({ message: "You can only edit your own replies" });
            return;
        }
        // Extract old and new mentions for comparison
        const oldMentionedUsernames = existingReply.mentions.map((m) => m.user.username);
        const newMentionedUsernames = extractMentions(content);
        const updatedReply = yield prisma.commentReply.update({
            where: { id: Number(replyId) },
            data: {
                content,
                isEdited: true,
                updatedAt: new Date(),
            },
            include: {
                user: true,
                likes: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                            },
                        },
                    },
                },
                mentions: {
                    include: { user: true },
                },
                replies: {
                    include: {
                        user: true,
                        likes: true,
                    },
                },
            },
        });
        const comment = yield prisma.comment.findUnique({
            where: { id: existingReply.commentId },
            include: {
                task: {
                    include: { client: true, project: true },
                },
            },
        });
        if (!comment || !comment.task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const replyUser = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { username: true, email: true },
        });
        if (!replyUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Handle mention changes for reply
        const mentionsToAdd = newMentionedUsernames.filter((username) => !oldMentionedUsernames.includes(username));
        const mentionsToRemove = oldMentionedUsernames.filter((username) => !newMentionedUsernames.includes(username));
        // Remove old mentions
        if (mentionsToRemove.length > 0) {
            const usersToRemove = yield prisma.user.findMany({
                where: { username: { in: mentionsToRemove } },
            });
            for (const userToRemove of usersToRemove) {
                yield prisma.commentReplyMention.deleteMany({
                    where: {
                        replyId: Number(replyId),
                        userId: userToRemove.userId,
                    },
                });
            }
        }
        // Add new mentions
        yield sendMentionNotifications(mentionsToAdd, replyUser, comment.task, content, Number(replyId), true);
        res.status(200).json(updatedReply);
    }
    catch (error) {
        console.error("Error editing reply:", error);
        res.status(500).json({ message: `Error editing reply: ${error.message}` });
    }
});
exports.editReply = editReply;
// Delete Reply Function
const deleteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { replyId } = req.params;
    const { userId } = req.body;
    try {
        const existingReply = yield prisma.commentReply.findUnique({
            where: { id: Number(replyId) },
        });
        if (!existingReply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        if (existingReply.userId !== Number(userId)) {
            res.status(403).json({ message: "You can only delete your own replies" });
            return;
        }
        yield prisma.commentReply.delete({
            where: { id: Number(replyId) },
        });
        res.status(200).json({ message: "Reply deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).json({ message: `Error deleting reply: ${error.message}` });
    }
});
exports.deleteReply = deleteReply;
// Like/Unlike Reply Function
const toggleReplyLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { replyId } = req.params;
    const { userId } = req.body;
    try {
        const existingReply = yield prisma.commentReply.findUnique({
            where: { id: Number(replyId) },
        });
        if (!existingReply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        const existingLike = yield prisma.commentReplyLike.findUnique({
            where: {
                userId_replyId: {
                    userId: Number(userId),
                    replyId: Number(replyId),
                },
            },
        });
        if (existingLike) {
            // Unlike
            yield prisma.commentReplyLike.delete({
                where: {
                    userId_replyId: {
                        userId: Number(userId),
                        replyId: Number(replyId),
                    },
                },
            });
            res.status(200).json({ message: "Reply unliked", liked: false });
        }
        else {
            // Like
            yield prisma.commentReplyLike.create({
                data: {
                    userId: Number(userId),
                    replyId: Number(replyId),
                },
            });
            res.status(200).json({ message: "Reply liked", liked: true });
        }
    }
    catch (error) {
        console.error("Error toggling reply like:", error);
        res
            .status(500)
            .json({ message: `Error toggling reply like: ${error.message}` });
    }
});
exports.toggleReplyLike = toggleReplyLike;
// Get comment with replies function
const getCommentWithReplies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    try {
        const comment = yield prisma.comment.findUnique({
            where: { id: Number(commentId) },
            include: {
                user: true,
                mentions: {
                    include: { user: true },
                },
                likes: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                            },
                        },
                    },
                },
                replies: {
                    include: {
                        user: true,
                        likes: {
                            include: {
                                user: {
                                    select: {
                                        userId: true,
                                        username: true,
                                    },
                                },
                            },
                        },
                        mentions: {
                            include: { user: true },
                        },
                        replies: {
                            include: {
                                user: true,
                                likes: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });
        if (!comment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        res.status(200).json(comment);
    }
    catch (error) {
        console.error("Error fetching comment:", error);
        res
            .status(500)
            .json({ message: `Error fetching comment: ${error.message}` });
    }
});
exports.getCommentWithReplies = getCommentWithReplies;
//----------------------------------------- Post Task Comment End ----------------------------------------------
// =================================SubTask Section Start==============================
//------------------------------ Subtask Create function Start-------------------------------------
const createSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { parentTaskId } = req.params;
    const { title, description, status, priority, startDate, dueDate, assignedTo, assignedBy, } = req.body;
    try {
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
        const parentTask = yield prisma.task.findUnique({
            where: { id: Number(parentTaskId) },
            include: { project: true },
        });
        if (!parentTask) {
            res.status(404).json({ message: "Parent task not found" });
            return;
        }
        const creator = yield prisma.user.findUnique({
            where: { userId: creatorId },
        });
        const newSubtask = yield prisma.task.create({
            data: {
                title,
                description,
                status: status || "To Do",
                priority,
                startDate,
                dueDate,
                clientId: parentTask.clientId,
                assignedBy: assignedBy || "",
                parentTaskId: Number(parentTaskId),
                assignedUsers: {
                    connect: assignedTo.map((userId) => ({
                        userId: Number(userId),
                    })),
                },
            },
            include: {
                assignedUsers: true,
                project: true,
            },
        });
        yield prisma.activityLog.create({
            data: {
                action: "CREATE_SUBTASK",
                details: `Created subtask for parent task ${parentTask.title}`,
                userId: creatorId,
                taskId: newSubtask.id,
            },
        });
        // Send emails to assigned users
        if (creator) {
            yield (0, create_1.sendSubtaskCreationEmails)(newSubtask, parentTask, creator);
            // Create notifications for assigned users
            for (const user of newSubtask.assignedUsers) {
                yield createNotification(user.userId, "New Subtask Assigned", `You've been assigned a new subtask: "${newSubtask.title}" under parent task "${parentTask.title}"`, "subtask_assigned");
            }
        }
        res.status(201).json(newSubtask);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating subtask: ${error.message}` });
    }
});
exports.createSubtask = createSubtask;
//----------------------------- Subtask Create function End -------------------------------------------
//-------------------------------- Subtask Get function Start --------------------------------------------
const getSubtasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const subtasks = yield prisma.task.findMany({
            where: {
                parentTaskId: Number(taskId),
                isDeleted: false,
            },
            include: {
                assignedUsers: true,
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                },
                attachments: {
                    include: { uploadedBy: true }, // Include uploader details if needed
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        res.json(subtasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving subtasks: ${error.message}` });
    }
});
exports.getSubtasks = getSubtasks;
//-------------------------------- Subtask Get function End ------------------------------------------
//--------------------------------- Subtask Update function Start -----------------------------------
const updateSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { subtaskId } = req.params;
    const { title, description, status, priority, startDate, dueDate, assignedTo, } = req.body;
    try {
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
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the subtask" });
            return;
        }
        const existingSubtask = yield prisma.task.findUnique({
            where: { id: Number(subtaskId) },
            include: {
                assignedUsers: true,
                project: true,
                parentTask: true,
            },
        });
        if (!existingSubtask) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        const changes = [];
        if (title && title !== existingSubtask.title) {
            changes.push(`Title: <strong>${existingSubtask.title}</strong> → <strong>${title}</strong>`);
        }
        if (description !== undefined &&
            description !== existingSubtask.description) {
            changes.push(`Description: <strong>${existingSubtask.description || "N/A"}</strong> → <strong>${description || "N/A"}</strong>`);
        }
        if (status && status !== existingSubtask.status) {
            changes.push(`Status: <strong>${existingSubtask.status || "N/A"}</strong> → <strong>${status}</strong>`);
        }
        if (priority && priority !== existingSubtask.priority) {
            changes.push(`Priority: <strong>${existingSubtask.priority || "N/A"}</strong> → <strong>${priority}</strong>`);
        }
        if (startDate &&
            existingSubtask.startDate !== null &&
            new Date(startDate).getTime() !==
                new Date(existingSubtask.startDate).getTime()) {
            const oldStartDate = (0, date_fns_tz_1.format)(new Date(existingSubtask.startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newStartDate = (0, date_fns_tz_1.format)(new Date(startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            changes.push(`Start Date: <strong>${oldStartDate}</strong> → <strong>${newStartDate}</strong>`);
        }
        if (dueDate &&
            existingSubtask.dueDate !== null &&
            new Date(dueDate).getTime() !==
                new Date(existingSubtask.dueDate).getTime()) {
            const oldDueDate = (0, date_fns_tz_1.format)(new Date(existingSubtask.dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newDueDate = (0, date_fns_tz_1.format)(new Date(dueDate), "MMMM dd, yyyy hh:mm a", {
                timeZone: "Asia/Kathmandu",
            });
            changes.push(`Due Date: <strong>${oldDueDate}</strong> → <strong>${newDueDate}</strong>`);
        }
        if (assignedTo &&
            JSON.stringify(assignedTo) !==
                JSON.stringify(existingSubtask.assignedUsers.map((u) => u.userId.toString()))) {
            const oldAssignees = existingSubtask.assignedUsers
                .map((u) => u.username || u.userId.toString())
                .join(", ") || "N/A";
            const newAssignees = assignedTo.join(", ") || "N/A";
            changes.push(`Assigned Users: <strong>${oldAssignees}</strong> → <strong>${newAssignees}</strong>`);
        }
        const updatedSubtask = yield prisma.task.update({
            where: { id: Number(subtaskId) },
            data: {
                title,
                description,
                status,
                priority,
                startDate,
                dueDate,
                assignedUsers: {
                    set: assignedTo.map((userId) => ({ userId: Number(userId) })),
                },
            },
            include: {
                assignedUsers: true,
                project: true,
                parentTask: true,
            },
        });
        yield prisma.activityLog.create({
            data: {
                action: "UPDATE_SUBTASK",
                details: `Updated subtask ${updatedSubtask.title}`,
                userId: decodedToken.userId,
                taskId: updatedSubtask.id,
            },
        });
        // Send edit emails to assigned users
        if (changes.length > 0 && updatingUser) {
            yield (0, update_1.sendSubtaskEditEmails)(updatedSubtask, updatingUser, changes);
            // Create notifications for assigned users
            for (const user of updatedSubtask.assignedUsers) {
                yield createNotification(user.userId, "Subtask Updated", `Subtask "${updatedSubtask.title}" under "${(_b = updatedSubtask.parentTask) === null || _b === void 0 ? void 0 : _b.title}" has been updated`, "subtask_updated");
            }
        }
        res.json(updatedSubtask);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error updating subtask: ${error.message}` });
    }
});
exports.updateSubtask = updateSubtask;
//------------------------------------ Subtask Delete function End ---------------------------------------
//---------------------------------------- Subtask Delete function Start -------------------------------
const deleteSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { subtaskId } = req.params;
    try {
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
        const deletingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!deletingUser) {
            res.status(400).json({ message: "Invalid user deleting the subtask" });
            return;
        }
        const subtaskToDelete = yield prisma.task.findUnique({
            where: { id: Number(subtaskId) },
            include: {
                assignedUsers: true,
                parentTask: {
                    include: {
                        client: true, // Include client information from parent task
                    },
                },
            },
        });
        if (!subtaskToDelete) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        yield prisma.task.delete({
            where: { id: Number(subtaskId) },
        });
        // Send delete emails to assigned users
        yield (0, delete_1.sendSubtaskDeleteEmails)(subtaskToDelete, deletingUser);
        // Create notifications for assigned users
        for (const user of subtaskToDelete.assignedUsers) {
            yield createNotification(user.userId, "Subtask Deleted", `Subtask "${subtaskToDelete.title}" under "${(_b = subtaskToDelete.parentTask) === null || _b === void 0 ? void 0 : _b.title}" has been deleted`, "subtask_deleted");
        }
        res.status(200).json({ message: "Subtask successfully deleted" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error deleting subtask: ${error.message}` });
    }
});
exports.deleteSubtask = deleteSubtask;
//---------------------------------------- Subtask Delete function End -------------------------------
//-------------------------------------- Attachment Delete function Start ----------------------------------
const deleteAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { taskId, attachmentId } = req.params;
    try {
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
        // Check if the task exists
        const task = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        // Check if the attachment exists and include the filename
        const attachment = yield prisma.attachment.findUnique({
            where: { id: Number(attachmentId) },
            include: {
                uploadedBy: true,
                task: true,
            },
        });
        if (!attachment) {
            res.status(404).json({ message: "Attachment not found" });
            return;
        }
        // Verify the attachment belongs to the specified task
        if (attachment.taskId !== Number(taskId)) {
            res
                .status(400)
                .json({ message: "Attachment does not belong to this task" });
            return;
        }
        // Delete the file from storage
        const filePath = path_1.default.join(process.cwd(), "uploads", attachment.fileName);
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        catch (err) {
            console.error("Error deleting file:", err);
            // Continue with database deletion even if file deletion fails
        }
        // Delete the attachment record from database
        yield prisma.attachment.delete({
            where: { id: Number(attachmentId) },
        });
        // Create activity log
        yield prisma.activityLog.create({
            data: {
                action: "DELETE_ATTACHMENT",
                details: `Deleted attachment: ${attachment.fileName}`,
                userId: decodedToken.userId,
                taskId: Number(taskId),
            },
        });
        res.status(200).json({ message: "Attachment deleted successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error deleting attachment: ${error.message}` });
    }
});
exports.deleteAttachment = deleteAttachment;
// Soft delete subtask
const softDeleteSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { subtaskId } = req.params;
    try {
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
        const deletingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!deletingUser) {
            res.status(400).json({ message: "Invalid user deleting the subtask" });
            return;
        }
        const subtaskToDelete = yield prisma.task.findUnique({
            where: { id: Number(subtaskId) },
            include: {
                assignedUsers: true,
                parentTask: {
                    include: {
                        client: true,
                    },
                },
                timeLogs: {
                    where: {
                        endTime: null,
                    },
                },
            },
        });
        if (!subtaskToDelete) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        // Stop any running timer for this subtask
        if (subtaskToDelete.isTimerRunning && subtaskToDelete.timerStartTime) {
            const elapsedSeconds = Math.floor((new Date().getTime() - subtaskToDelete.timerStartTime.getTime()) /
                1000);
            const newTimeSpent = subtaskToDelete.timeSpent + elapsedSeconds;
            // Update active time logs
            if (subtaskToDelete.timeLogs.length > 0) {
                yield prisma.timeLog.updateMany({
                    where: {
                        subtaskId: Number(subtaskId),
                        endTime: null,
                    },
                    data: {
                        endTime: new Date(),
                        duration: elapsedSeconds,
                    },
                });
            }
            // Update subtask time
            yield prisma.task.update({
                where: { id: Number(subtaskId) },
                data: {
                    timeSpent: newTimeSpent,
                    isTimerRunning: false,
                    timerStartTime: null,
                },
            });
        }
        else if (subtaskToDelete.isTimerRunning) {
            // If timer is running but no start time, just stop the timer
            yield prisma.task.update({
                where: { id: Number(subtaskId) },
                data: {
                    isTimerRunning: false,
                    timerStartTime: null,
                },
            });
        }
        // Soft delete by updating isDeleted and deletedAt fields
        yield prisma.task.update({
            where: { id: Number(subtaskId) },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                isTimerRunning: false,
                timerStartTime: null,
            },
        });
        // Send delete emails to assigned users
        yield (0, delete_1.sendSubtaskDeleteEmails)(subtaskToDelete, deletingUser);
        // Create notifications for assigned users
        for (const user of subtaskToDelete.assignedUsers) {
            yield createNotification(user.userId, "Subtask Deleted", `Subtask "${subtaskToDelete.title}" under "${(_b = subtaskToDelete.parentTask) === null || _b === void 0 ? void 0 : _b.title}" has been deleted`, "subtask_deleted");
        }
        res.status(200).json({ message: "Subtask successfully soft deleted" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error soft deleting subtask: ${error.message}` });
    }
});
exports.softDeleteSubtask = softDeleteSubtask;
// Restore subtask
const restoreSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { subtaskId } = req.params;
    try {
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
        const restoringUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!restoringUser) {
            res.status(400).json({ message: "Invalid user restoring the subtask" });
            return;
        }
        const subtaskToRestore = yield prisma.task.findUnique({
            where: { id: Number(subtaskId) },
            include: {
                assignedUsers: true,
                parentTask: true,
            },
        });
        if (!subtaskToRestore) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        if (!subtaskToRestore.isDeleted) {
            res.status(400).json({ message: "Subtask is not deleted" });
            return;
        }
        // Restore by updating isDeleted and clearing deletedAt
        yield prisma.task.update({
            where: { id: Number(subtaskId) },
            data: {
                isDeleted: false,
                deletedAt: null,
            },
        });
        // Create notifications for assigned users
        for (const user of subtaskToRestore.assignedUsers) {
            yield createNotification(user.userId, "Subtask Restored", `Subtask "${subtaskToRestore.title}" under "${(_b = subtaskToRestore.parentTask) === null || _b === void 0 ? void 0 : _b.title}" has been restored`, "subtask_restored");
        }
        res.status(200).json({ message: "Subtask successfully restored" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error restoring subtask: ${error.message}` });
    }
});
exports.restoreSubtask = restoreSubtask;
// Add a function to get deleted subtasks (optional)
// server\src\controllers\taskController.ts
const getDeletedSubtasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const deletedSubtasks = yield prisma.task.findMany({
            where: {
                parentTaskId: Number(taskId),
                isDeleted: true,
            },
            include: {
                assignedUsers: true,
                parentTask: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                domainName: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json(deletedSubtasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error fetching deleted subtasks: ${error.message}` });
    }
});
exports.getDeletedSubtasks = getDeletedSubtasks;
// server\src\controllers\taskController.ts
const getAllDeletedSubtasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedSubtasks = yield prisma.task.findMany({
            where: {
                isDeleted: true,
                parentTaskId: { not: null }, // Only get subtasks, not main tasks
            },
            include: {
                assignedUsers: true,
                parentTask: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                domainName: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                deletedAt: "desc",
            },
        });
        res.status(200).json(deletedSubtasks);
    }
    catch (error) {
        res.status(500).json({
            message: `Error fetching all deleted subtasks: ${error.message}`,
        });
    }
});
exports.getAllDeletedSubtasks = getAllDeletedSubtasks;
//------------------------------------------ Attachment Delete function End -------------------------------
//------------------------------------ Subtask Delete function End ---------------------------------------
/////////////////////////////////------------- SubTask Section End-----------------///////////////////////////////
// Get only deleted TASKS for the current user
const getMyDeletedTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
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
        const myDeletedTasks = yield prisma.task.findMany({
            where: {
                isDeleted: true,
                parentTaskId: null,
                assignedUsers: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                assignedUsers: true,
                client: {
                    select: {
                        id: true,
                        domainName: true,
                        companyName: true,
                    },
                },
            },
            orderBy: {
                deletedAt: "desc",
            },
        });
        res.status(200).json(myDeletedTasks);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error fetching your deleted tasks: ${error.message}` });
    }
});
exports.getMyDeletedTasks = getMyDeletedTasks;
// Get only deleted SUBTASKS for the current user
const getMyDeletedSubtasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
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
        const myDeletedSubtasks = yield prisma.task.findMany({
            where: {
                isDeleted: true,
                parentTaskId: { not: null },
                assignedUsers: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                assignedUsers: true,
                parentTask: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                domainName: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                deletedAt: "desc",
            },
        });
        res.status(200).json(myDeletedSubtasks);
    }
    catch (error) {
        res.status(500).json({
            message: `Error fetching your deleted subtasks: ${error.message}`,
        });
    }
});
exports.getMyDeletedSubtasks = getMyDeletedSubtasks;
// Update startTimer function
const startTimer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { userId, isSubtask = false } = req.body;
    console.log("startTimer request body:", req.body);
    console.log("startTimer userId:", userId);
    try {
        // Validate userId
        if (isNaN(Number(userId))) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const numericUserId = Number(userId);
        const numericTaskId = Number(taskId);
        // Check if any other timer is already running for this user
        const runningTimers = yield prisma.task.findMany({
            where: {
                OR: [
                    { parentTaskId: { not: null } }, // Subtasks
                    { parentTaskId: null }, // Main tasks
                ],
                isTimerRunning: true,
                assignedUsers: {
                    some: {
                        userId: numericUserId,
                    },
                },
                id: { not: numericTaskId }, // Exclude current task
            },
            select: {
                id: true,
                title: true,
                isTimerRunning: true,
            },
        });
        // If there are running timers, return them instead of starting a new one
        if (runningTimers.length > 0) {
            res.status(409).json({
                message: "Another timer is already running",
                runningTimers: runningTimers.map((timer) => ({
                    id: timer.id,
                    title: timer.title,
                })),
            });
            return;
        }
        // First, check if the user is assigned to this task
        const taskWithAssignment = yield prisma.task.findUnique({
            where: { id: numericTaskId },
            include: {
                assignedUsers: {
                    where: {
                        userId: numericUserId,
                    },
                },
            },
        });
        // Check if user is assigned to this task
        if (taskWithAssignment && taskWithAssignment.assignedUsers.length === 0) {
            res.status(403).json({ message: "You are not assigned to this task" });
            return;
        }
        // Create a new TimeLog entry
        const timeLogData = {
            userId: numericUserId,
            startTime: new Date(),
        };
        if (isSubtask) {
            timeLogData.subtaskId = numericTaskId;
            // Also link to parent task if available
            if (taskWithAssignment === null || taskWithAssignment === void 0 ? void 0 : taskWithAssignment.parentTaskId) {
                timeLogData.taskId = taskWithAssignment.parentTaskId;
            }
        }
        else {
            timeLogData.taskId = numericTaskId;
        }
        const timeLog = yield prisma.timeLog.create({
            data: timeLogData,
        });
        const updatedTask = yield prisma.task.update({
            where: { id: numericTaskId },
            data: {
                isTimerRunning: true,
                timerStartTime: new Date(),
            },
        });
        res.json({
            message: "Timer started",
            task: updatedTask,
            timeLogId: timeLog.id,
        });
    }
    catch (error) {
        console.error("Error in startTimer:", error);
        res.status(500).json({ message: `Error starting timer: ${error.message}` });
    }
});
exports.startTimer = startTimer;
// Update pauseTimer function
// Update pauseTimer function to handle subtasks
const pauseTimer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { userId, isSubtask = false } = req.body;
    try {
        const task = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        if (!task.isTimerRunning || !task.timerStartTime) {
            res.status(400).json({ message: "Timer is not running" });
            return;
        }
        // Find the latest active TimeLog for this task/subtask and user
        const whereClause = {
            userId: Number(userId),
            endTime: null,
        };
        if (isSubtask) {
            whereClause.subtaskId = Number(taskId);
        }
        else {
            whereClause.taskId = Number(taskId);
        }
        const activeTimeLog = yield prisma.timeLog.findFirst({
            where: whereClause,
            orderBy: {
                startTime: "desc",
            },
        });
        if (!activeTimeLog) {
            res.status(404).json({ message: "No active time log found" });
            return;
        }
        // Calculate elapsed time
        const elapsedSeconds = Math.floor((new Date().getTime() - task.timerStartTime.getTime()) / 1000);
        const newTimeSpent = task.timeSpent + elapsedSeconds;
        // Update the TimeLog with end time and duration
        yield prisma.timeLog.update({
            where: { id: activeTimeLog.id },
            data: {
                endTime: new Date(),
                duration: elapsedSeconds,
            },
        });
        const updatedTask = yield prisma.task.update({
            where: { id: Number(taskId) },
            data: {
                isTimerRunning: false,
                timerStartTime: null,
                timeSpent: newTimeSpent,
            },
        });
        res.json({
            message: isSubtask ? "Subtask timer paused" : "Timer paused",
            elapsedSeconds,
            totalTimeSpent: newTimeSpent,
            task: updatedTask,
        });
    }
    catch (error) {
        res.status(500).json({ message: `Error pausing timer: ${error.message}` });
    }
});
exports.pauseTimer = pauseTimer;
// Update stopTimer function to handle subtasks
const stopTimer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { userId, isSubtask = false } = req.body;
    try {
        const task = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        if (!task.isTimerRunning || !task.timerStartTime) {
            res.status(400).json({ message: "Timer is not running" });
            return;
        }
        // Find the latest active TimeLog for this task/subtask and user
        const whereClause = {
            userId: Number(userId),
            endTime: null,
        };
        if (isSubtask) {
            whereClause.subtaskId = Number(taskId);
        }
        else {
            whereClause.taskId = Number(taskId);
        }
        const activeTimeLog = yield prisma.timeLog.findFirst({
            where: whereClause,
            orderBy: {
                startTime: "desc",
            },
        });
        if (!activeTimeLog) {
            res.status(404).json({ message: "No active time log found" });
            return;
        }
        // Calculate elapsed time
        const elapsedSeconds = Math.floor((new Date().getTime() - task.timerStartTime.getTime()) / 1000);
        const newTimeSpent = task.timeSpent + elapsedSeconds;
        // Update the TimeLog with end time and duration
        yield prisma.timeLog.update({
            where: { id: activeTimeLog.id },
            data: {
                endTime: new Date(),
                duration: elapsedSeconds,
            },
        });
        const updatedTask = yield prisma.task.update({
            where: { id: Number(taskId) },
            data: {
                isTimerRunning: false,
                timerStartTime: null,
                timeSpent: newTimeSpent,
            },
        });
        res.json({
            message: isSubtask ? "Subtask timer stopped" : "Timer stopped",
            elapsedSeconds,
            totalTimeSpent: newTimeSpent,
            task: updatedTask,
        });
    }
    catch (error) {
        res.status(500).json({ message: `Error stopping timer: ${error.message}` });
    }
});
exports.stopTimer = stopTimer;
// Get current timer status
const getTimerStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const task = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            select: {
                id: true,
                isTimerRunning: true,
                timerStartTime: true,
                timeSpent: true,
            },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        let currentElapsed = 0;
        if (task.isTimerRunning && task.timerStartTime) {
            // Use simple millisecond difference without timezone conversion
            currentElapsed = Math.floor((new Date().getTime() - task.timerStartTime.getTime()) / 1000);
        }
        res.json({
            isTimerRunning: task.isTimerRunning,
            timerStartTime: task.timerStartTime,
            totalTimeSpent: task.timeSpent,
            currentElapsed,
            totalElapsed: task.timeSpent + currentElapsed,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error getting timer status: ${error.message}` });
    }
});
exports.getTimerStatus = getTimerStatus;
// Helper function to format time
// Helper function to format time
const formatTime = (seconds) => {
    // Ensure seconds is never negative
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
// Subtask Timer Functions
const startSubtaskTimer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subtaskId } = req.params;
    const { userId } = req.body;
    console.log("startSubtaskTimer request body:", req.body);
    console.log("startSubtaskTimer userId:", userId);
    try {
        if (isNaN(Number(userId))) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const numericUserId = Number(userId);
        const numericSubtaskId = Number(subtaskId);
        // Check if any other timer is already running for this user
        const runningTimers = yield prisma.task.findMany({
            where: {
                OR: [
                    { parentTaskId: { not: null } }, // Subtasks
                    { parentTaskId: null }, // Main tasks
                ],
                isTimerRunning: true,
                assignedUsers: {
                    some: {
                        userId: numericUserId,
                    },
                },
                id: { not: numericSubtaskId }, // Exclude current subtask
            },
            select: {
                id: true,
                title: true,
                isTimerRunning: true,
            },
        });
        // If there are running timers, return them instead of starting a new one
        if (runningTimers.length > 0) {
            res.status(409).json({
                message: "Another timer is already running",
                runningTimers: runningTimers.map((timer) => ({
                    id: timer.id,
                    title: timer.title,
                })),
            });
            return;
        }
        // First, check if the user is assigned to this subtask
        const subtaskWithAssignment = yield prisma.task.findUnique({
            where: {
                id: numericSubtaskId,
                parentTaskId: { not: null },
            },
            include: {
                assignedUsers: {
                    where: {
                        userId: numericUserId,
                    },
                },
                parentTask: true, // Include parent task to get client info
            },
        });
        if (!subtaskWithAssignment) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        // Check if user is assigned to this subtask
        if (subtaskWithAssignment.assignedUsers.length === 0) {
            res.status(403).json({ message: "You are not assigned to this subtask" });
            return;
        }
        if (subtaskWithAssignment.isTimerRunning) {
            res.status(400).json({ message: "Timer is already running" });
            return;
        }
        // Create TimeLog entry for subtask
        const timeLog = yield prisma.timeLog.create({
            data: {
                userId: numericUserId,
                subtaskId: numericSubtaskId,
                taskId: subtaskWithAssignment.parentTaskId || undefined,
                startTime: new Date(),
            },
        });
        const updatedSubtask = yield prisma.task.update({
            where: { id: numericSubtaskId },
            data: {
                isTimerRunning: true,
                timerStartTime: new Date(),
            },
        });
        res.json({
            message: "Subtask timer started",
            subtask: updatedSubtask,
            timeLogId: timeLog.id,
        });
    }
    catch (error) {
        console.error("Error in startSubtaskTimer:", error);
        res
            .status(500)
            .json({ message: `Error starting subtask timer: ${error.message}` });
    }
});
exports.startSubtaskTimer = startSubtaskTimer;
// Update pauseSubtaskTimer function to handle TimeLog entries
const pauseSubtaskTimer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subtaskId } = req.params;
    const { userId } = req.body;
    try {
        const subtask = yield prisma.task.findUnique({
            where: { id: Number(subtaskId), parentTaskId: { not: null } },
        });
        if (!subtask) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        if (!subtask.isTimerRunning || !subtask.timerStartTime) {
            res.status(400).json({ message: "Timer is not running" });
            return;
        }
        // Find the latest active TimeLog for this subtask and user
        const activeTimeLog = yield prisma.timeLog.findFirst({
            where: {
                userId: Number(userId),
                subtaskId: Number(subtaskId),
                endTime: null,
            },
            orderBy: {
                startTime: "desc",
            },
        });
        if (!activeTimeLog) {
            res.status(404).json({ message: "No active time log found" });
            return;
        }
        // Calculate elapsed time
        const elapsedSeconds = Math.floor((new Date().getTime() - subtask.timerStartTime.getTime()) / 1000);
        const newTimeSpent = subtask.timeSpent + elapsedSeconds;
        // Update the TimeLog with end time and duration
        yield prisma.timeLog.update({
            where: { id: activeTimeLog.id },
            data: {
                endTime: new Date(),
                duration: elapsedSeconds,
            },
        });
        const updatedSubtask = yield prisma.task.update({
            where: { id: Number(subtaskId) },
            data: {
                isTimerRunning: false,
                timerStartTime: null,
                timeSpent: newTimeSpent,
            },
        });
        res.json({
            message: "Subtask timer paused",
            elapsedSeconds,
            totalTimeSpent: newTimeSpent,
            subtask: updatedSubtask,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error pausing subtask timer: ${error.message}` });
    }
});
exports.pauseSubtaskTimer = pauseSubtaskTimer;
// Update stopSubtaskTimer function to handle TimeLog entries
const stopSubtaskTimer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subtaskId } = req.params;
    const { userId } = req.body;
    try {
        const subtask = yield prisma.task.findUnique({
            where: { id: Number(subtaskId), parentTaskId: { not: null } },
        });
        if (!subtask) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        if (!subtask.isTimerRunning || !subtask.timerStartTime) {
            res.status(400).json({ message: "Timer is not running" });
            return;
        }
        // Find the latest active TimeLog for this subtask and user
        const activeTimeLog = yield prisma.timeLog.findFirst({
            where: {
                userId: Number(userId),
                subtaskId: Number(subtaskId),
                endTime: null,
            },
            orderBy: {
                startTime: "desc",
            },
        });
        if (!activeTimeLog) {
            res.status(404).json({ message: "No active time log found" });
            return;
        }
        // Calculate elapsed time
        const elapsedSeconds = Math.floor((new Date().getTime() - subtask.timerStartTime.getTime()) / 1000);
        const newTimeSpent = subtask.timeSpent + elapsedSeconds;
        // Update the TimeLog with end time and duration
        yield prisma.timeLog.update({
            where: { id: activeTimeLog.id },
            data: {
                endTime: new Date(),
                duration: elapsedSeconds,
            },
        });
        const updatedSubtask = yield prisma.task.update({
            where: { id: Number(subtaskId) },
            data: {
                isTimerRunning: false,
                timerStartTime: null,
                timeSpent: newTimeSpent,
            },
        });
        res.json({
            message: "Subtask timer stopped",
            elapsedSeconds,
            totalTimeSpent: newTimeSpent,
            subtask: updatedSubtask,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error stopping subtask timer: ${error.message}` });
    }
});
exports.stopSubtaskTimer = stopSubtaskTimer;
const getSubtaskTimerStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subtaskId } = req.params;
    try {
        const subtask = yield prisma.task.findUnique({
            where: { id: Number(subtaskId), parentTaskId: { not: null } },
            select: {
                id: true,
                isTimerRunning: true,
                timerStartTime: true,
                timeSpent: true,
            },
        });
        if (!subtask) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        let currentElapsed = 0;
        if (subtask.isTimerRunning && subtask.timerStartTime) {
            // Use simple millisecond difference without timezone conversion
            currentElapsed = Math.floor((new Date().getTime() - subtask.timerStartTime.getTime()) / 1000);
        }
        res.json({
            isTimerRunning: subtask.isTimerRunning,
            timerStartTime: subtask.timerStartTime,
            totalTimeSpent: subtask.timeSpent,
            currentElapsed,
            totalElapsed: subtask.timeSpent + currentElapsed,
        });
    }
    catch (error) {
        res.status(500).json({
            message: `Error getting subtask timer status: ${error.message}`,
        });
    }
});
exports.getSubtaskTimerStatus = getSubtaskTimerStatus;
const formatHumanReadableTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    if (safeSeconds < 60) {
        return `${safeSeconds}s`; // Seconds only
    }
    else if (safeSeconds < 3600) {
        const minutes = Math.floor(safeSeconds / 60);
        const remainingSeconds = safeSeconds % 60;
        return remainingSeconds > 0
            ? `${minutes}m ${remainingSeconds}s`
            : `${minutes}m`;
    }
    else {
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const remainingSeconds = safeSeconds % 60;
        if (minutes === 0 && remainingSeconds === 0) {
            return `${hours}h`;
        }
        else if (remainingSeconds === 0) {
            return `${hours}h ${minutes}m`;
        }
        else {
            return `${hours}h ${minutes}m ${remainingSeconds}s`;
        }
    }
};
const getUserDailySchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { date } = req.query;
    try {
        const numericUserId = Number(userId);
        if (isNaN(numericUserId)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        // Determine the target date (default to today in Nepal time)
        const now = new Date();
        const nowInNepal = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
        const targetDate = date ? new Date(date) : nowInNepal;
        // Get the Nepal timezone offset in minutes
        const nepalOffset = 5 * 60 + 45; // Nepal is UTC+5:45
        // Create start and end of day in UTC that correspond to Nepal time
        const startOfDayUTC = new Date(targetDate);
        startOfDayUTC.setUTCHours(0, 0, 0, 0);
        startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - nepalOffset);
        const endOfDayUTC = new Date(targetDate);
        endOfDayUTC.setUTCHours(23, 59, 59, 999);
        endOfDayUTC.setUTCMinutes(endOfDayUTC.getUTCMinutes() - nepalOffset);
        // Get all time logs for the user on this day, including subtasks
        const timeLogs = yield prisma.timeLog.findMany({
            where: {
                userId: numericUserId,
                startTime: {
                    gte: startOfDayUTC,
                    lte: endOfDayUTC,
                },
            },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                userId: true,
                taskId: true,
                subtaskId: true,
                task: {
                    select: {
                        title: true,
                        status: true,
                        client: {
                            select: {
                                domainName: true,
                                companyName: true,
                            },
                        },
                    },
                },
                subtask: {
                    select: {
                        title: true,
                        status: true,
                        client: {
                            select: {
                                domainName: true,
                                companyName: true,
                            },
                        },
                        parentTask: {
                            select: {
                                client: {
                                    select: {
                                        domainName: true,
                                        companyName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                startTime: "asc",
            },
        });
        // Define core working hours (9 AM to 7 PM in Nepal time)
        const coreStartHour = 9; // 9 AM
        const coreEndHour = 19; // 7 PM (24-hour format)
        // Generate hourly intervals - always include core hours, others only if there are logs
        const timeIntervals = [];
        const hoursWithLogs = new Set();
        // First, identify which hours have time logs
        timeLogs.forEach((log) => {
            const logStart = new Date(log.startTime);
            const logEnd = log.endTime ? new Date(log.endTime) : new Date();
            // Convert to Nepal time for hour calculation
            const logStartNepal = new Date(logStart.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
            const logEndNepal = new Date(logEnd.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
            // Mark hours that have logs
            const startHour = logStartNepal.getHours();
            const endHour = logEndNepal.getHours();
            for (let hour = startHour; hour <= endHour; hour++) {
                hoursWithLogs.add(hour);
            }
        });
        // Create intervals for core hours (9 AM to 7 PM)
        for (let hour = coreStartHour; hour < coreEndHour; hour++) {
            const startHourFormatted = hour % 12 || 12;
            const endHourFormatted = (hour + 1) % 12 || 12;
            const startPeriod = hour < 12 ? "am" : "pm";
            const endPeriod = hour + 1 < 12 ? "am" : "pm";
            timeIntervals.push({
                timeFrame: `${startHourFormatted}:00${startPeriod} - ${endHourFormatted}:00${endPeriod}`,
                startHour: hour,
                endHour: (hour + 1) % 24,
                isCoreHour: true,
            });
        }
        // Add non-core hours only if they have time logs
        for (let hour = 0; hour < 24; hour++) {
            // Skip core hours (already added)
            if (hour >= coreStartHour && hour < coreEndHour)
                continue;
            // Only add if this hour has logs
            if (hoursWithLogs.has(hour)) {
                const startHourFormatted = hour % 12 || 12;
                const endHourFormatted = (hour + 1) % 12 || 12;
                const startPeriod = hour < 12 ? "am" : "pm";
                const endPeriod = hour + 1 < 12 ? "am" : "pm";
                timeIntervals.push({
                    timeFrame: `${startHourFormatted}:00${startPeriod} - ${endHourFormatted}:00${endPeriod}`,
                    startHour: hour,
                    endHour: (hour + 1) % 24,
                    isCoreHour: false,
                });
            }
        }
        // Sort intervals by hour
        timeIntervals.sort((a, b) => a.startHour - b.startHour);
        let totalTimeSpent = 0;
        const taskTimeMap = new Map();
        // Process time logs to assign them to hourly intervals
        const schedule = timeIntervals.map((interval) => {
            // Calculate interval start and end times in Nepal time
            const intervalStartTime = new Date(targetDate);
            intervalStartTime.setHours(interval.startHour, 0, 0, 0);
            const intervalEndTime = new Date(targetDate);
            intervalEndTime.setHours(interval.endHour, 0, 0, 0);
            let timeSpentInInterval = 0;
            const tasksInInterval = [];
            const taskTimeMapInInterval = new Map();
            // Check all time logs for overlap with this interval
            timeLogs.forEach((log) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
                const logStart = new Date(log.startTime);
                const logEnd = log.endTime ? new Date(log.endTime) : new Date();
                // Convert to Nepal time for comparison
                const logStartNepal = new Date(logStart.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
                const logEndNepal = new Date(logEnd.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
                // Create Date objects for log start/end on the target date (for proper comparison)
                const logStartTime = new Date(targetDate);
                logStartTime.setHours(logStartNepal.getHours(), logStartNepal.getMinutes(), logStartNepal.getSeconds(), logStartNepal.getMilliseconds());
                const logEndTime = new Date(targetDate);
                logEndTime.setHours(logEndNepal.getHours(), logEndNepal.getMinutes(), logEndNepal.getSeconds(), logEndNepal.getMilliseconds());
                // Check if log overlaps with this hourly interval
                const overlapStart = Math.max(logStartTime.getTime(), intervalStartTime.getTime());
                const overlapEnd = Math.min(logEndTime.getTime(), intervalEndTime.getTime());
                // If there's an overlap
                if (overlapStart < overlapEnd) {
                    const overlapSeconds = (overlapEnd - overlapStart) / 1000;
                    timeSpentInInterval += overlapSeconds;
                    totalTimeSpent += overlapSeconds;
                    // Get task info (either from task or subtask)
                    let taskTitle = "";
                    let clientDomainName = "No Client";
                    let taskStatus = "";
                    if (log.subtaskId) {
                        // This is a subtask log
                        taskTitle = ((_a = log.subtask) === null || _a === void 0 ? void 0 : _a.title) || "Unknown Subtask";
                        clientDomainName =
                            ((_c = (_b = log.subtask) === null || _b === void 0 ? void 0 : _b.client) === null || _c === void 0 ? void 0 : _c.domainName) ||
                                ((_e = (_d = log.subtask) === null || _d === void 0 ? void 0 : _d.client) === null || _e === void 0 ? void 0 : _e.companyName) || // Use companyName if no domainName
                                ((_h = (_g = (_f = log.subtask) === null || _f === void 0 ? void 0 : _f.parentTask) === null || _g === void 0 ? void 0 : _g.client) === null || _h === void 0 ? void 0 : _h.domainName) ||
                                ((_l = (_k = (_j = log.subtask) === null || _j === void 0 ? void 0 : _j.parentTask) === null || _k === void 0 ? void 0 : _k.client) === null || _l === void 0 ? void 0 : _l.companyName) ||
                                "No Client";
                        taskStatus = ((_m = log.subtask) === null || _m === void 0 ? void 0 : _m.status) || "No Status";
                    }
                    else if (log.taskId) {
                        // This is a main task log
                        taskTitle = ((_o = log.task) === null || _o === void 0 ? void 0 : _o.title) || "Unknown Task";
                        clientDomainName =
                            ((_q = (_p = log.task) === null || _p === void 0 ? void 0 : _p.client) === null || _q === void 0 ? void 0 : _q.domainName) ||
                                ((_s = (_r = log.task) === null || _r === void 0 ? void 0 : _r.client) === null || _s === void 0 ? void 0 : _s.companyName) || // Use companyName if no domainName
                                "No Client";
                        taskStatus = ((_t = log.task) === null || _t === void 0 ? void 0 : _t.status) || "No Status";
                    }
                    // Track time for this specific task in this interval
                    if (taskTitle) {
                        const taskKey = `${taskTitle}|${clientDomainName}|${taskStatus}`;
                        const currentTime = taskTimeMapInInterval.get(taskKey) || 0;
                        taskTimeMapInInterval.set(taskKey, currentTime + overlapSeconds);
                        // Update global task time tracking
                        if (!taskTimeMap.has(taskKey)) {
                            taskTimeMap.set(taskKey, {
                                title: taskTitle,
                                clientDomainName,
                                status: taskStatus,
                                timeSpent: 0,
                            });
                        }
                        taskTimeMap.get(taskKey).timeSpent += overlapSeconds;
                    }
                }
            });
            // Convert the taskTimeMapInInterval to the tasksInInterval array
            taskTimeMapInInterval.forEach((timeSpent, taskKey) => {
                const [title, clientDomainName, status] = taskKey.split("|");
                tasksInInterval.push({
                    title,
                    clientDomainName,
                    status,
                    timeSpent: Math.round(timeSpent),
                });
            });
            // Cap at 3600 seconds (1 hour) for this interval
            timeSpentInInterval = Math.min(timeSpentInInterval, 3600);
            return {
                timeFrame: interval.timeFrame,
                timeSpent: Math.round(timeSpentInInterval),
                tasks: tasksInInterval,
                isCoreHour: interval.isCoreHour,
            };
        });
        // Format the response
        const formattedSchedule = schedule.map((item) => ({
            timeFrame: item.timeFrame,
            timeSpent: item.timeSpent,
            timeSpentFormatted: formatTime(item.timeSpent),
            timeSpentHuman: formatHumanReadableTime(item.timeSpent),
            tasks: item.tasks.map((task) => ({
                title: task.title,
                clientDomainName: task.clientDomainName,
                status: task.status,
                timeSpent: task.timeSpent,
                timeSpentFormatted: formatTime(task.timeSpent),
                timeSpentHuman: formatHumanReadableTime(task.timeSpent),
            })),
            isActive: item.timeSpent > 0,
            isCoreHour: item.isCoreHour,
        }));
        // Create task summary array from the taskTimeMap
        const taskSummary = Array.from(taskTimeMap.values()).map((task) => ({
            title: task.title,
            clientDomainName: task.clientDomainName,
            status: task.status,
            timeSpent: Math.round(task.timeSpent),
            timeSpentFormatted: formatTime(task.timeSpent),
            timeSpentHuman: formatHumanReadableTime(task.timeSpent),
        }));
        // Prepare daily summary with Nepal time context
        const dailySummary = {
            date: targetDate.toLocaleDateString("en-US", {
                timeZone: "Asia/Kathmandu",
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
            totalTasks: taskSummary.length,
            tasks: taskSummary,
            totalTimeSpent: Math.round(totalTimeSpent),
            totalTimeFormatted: formatTime(totalTimeSpent),
            totalTimeHuman: formatHumanReadableTime(totalTimeSpent),
            totalIntervals: timeIntervals.length,
            activeIntervals: formattedSchedule.filter((item) => item.isActive).length,
            coreHoursDisplayed: `${coreStartHour % 12 || 12}am - ${coreEndHour % 12 || 12}pm`,
        };
        res.json({
            timeZone: "Asia/Kathmandu (Nepal Time)",
            date: dailySummary.date,
            schedule: formattedSchedule,
            dailySummary,
        });
    }
    catch (error) {
        console.error("Error getting user schedule:", error);
        res
            .status(500)
            .json({ message: `Error getting user schedule: ${error.message}` });
    }
});
exports.getUserDailySchedule = getUserDailySchedule;
