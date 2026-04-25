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
exports.deleteSubtask = exports.updateSubtask = exports.getSubtasks = exports.createSubtask = exports.addCommentToTask = exports.getTaskComments = exports.deleteTask = exports.updateTask = exports.getTasksByUserIdForProfile = exports.getTasksByUserIdForUserTasks = exports.updateTaskStatus = exports.getTasksByUser = exports.getTasks = exports.createTask = void 0;
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_tz_1 = require("date-fns-tz");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailTemplates_1 = require("../templates/emailTemplates");
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
const subtaskUpdatedEmailTemplate = (updaterName, subtaskTitle, parentTaskTitle, projectName, changes) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
  <div style="background: linear-gradient(135deg, #2196F3, #0D47A1); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
    <h2 style="margin: 0;">Subtask Updated</h2>
  </div>
  <div style="padding: 20px;">
    <p><strong style="color: #2c3e50;">${updaterName}</strong> updated the subtask <strong>${subtaskTitle}</strong> in parent task <strong>${parentTaskTitle}</strong> of project <strong>${projectName}</strong>:</p>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0;">
      <h4 style="margin-top: 0; color: #0D47A1;">Changes Made:</h4>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        ${changes.map(change => `<li>${change}</li>`).join('')}
      </ul>
    </div>
 
  </div>
</div>
`;
const subtaskDeletedEmailTemplate = (deleterName, subtaskTitle, parentTaskTitle, projectName) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
  <div style="background: linear-gradient(135deg, #f44336, #c62828); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
    <h2 style="margin: 0;">Subtask Deleted</h2>
  </div>
  <div style="padding: 20px;">
    <p><strong style="color: #2c3e50;">${deleterName}</strong> deleted the subtask:</p>
    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 10px 0;">
      <h3 style="margin-top: 0; color: #c62828;">${subtaskTitle}</h3>
      <p><strong>Parent Task:</strong> ${parentTaskTitle}</p>
      <p><strong>Project:</strong> ${projectName}</p>
    </div>
    <p style="color: #666; font-style: italic; text-align: center;">
      This subtask has been permanently deleted from the system.
    </p>
  </div>
</div>
`;
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
    return __awaiter(this, arguments, void 0, function* (userId, title, message, sound = 'default') {
        yield prisma.notification.create({
            data: {
                title,
                message,
                userId,
                sound
            },
        });
    });
}
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, description, status, priority, startDate, dueDate, projectId, assignedTo, assignedBy, } = req.body;
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
        const newTask = yield prisma.task.create({
            data: {
                title,
                description,
                status,
                priority,
                startDate,
                dueDate,
                projectId,
                assignedBy,
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
                action: "CREATE",
                details: null,
                userId: creatorId,
                taskId: newTask.id,
            },
        });
        const assigningUser = yield prisma.user.findUnique({
            where: { email: assignedBy },
        });
        const project = yield prisma.project.findUnique({
            where: { id: Number(projectId) },
            select: { name: true },
        });
        const formatNepaliTime = (dateValue) => {
            if (!dateValue)
                return "N/A";
            return (0, date_fns_tz_1.format)(dateValue, "MMMM dd, yyyy hh:mm a", {
                timeZone: "Asia/Kathmandu",
            });
        };
        if (newTask.assignedUsers && assigningUser && project) {
            const emailSubject = `New Task Assigned: ${newTask.title}`; // Move this outside the loop but inside the if block
            for (const user of newTask.assignedUsers) {
                if (user.email) {
                    const formattedStartDate = formatNepaliTime(newTask.startDate);
                    const formattedDueDate = formatNepaliTime(newTask.dueDate);
                    const assignedUserMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Task Assigned</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong style="color: #2c3e50;">${assigningUser.username}</strong> assigned you a new task <strong style="color: #3498db;">${newTask.title}</strong> in <strong style="color: #3498db;">${project.name}</strong>.</p>
          </div>
        </div>
      `;
                    sendMail(user.email, emailSubject, assignedUserMessage);
                }
            }
            const gauravMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
        <h2 style="margin: 0;">New Task Assigned</h2>
      </div>
      <div style="padding: 20px;">
        <p><strong style="color: #2c3e50;">${assigningUser.username}</strong> assigned ${newTask.assignedUsers.length} users to task <strong style="color: #3498db;">${newTask.title}</strong> in <strong style="color: #3498db;">${project.name}</strong>.</p>
      </div>
    </div>
  `;
            sendMail("gaurav@webtech.com.np", emailSubject, gauravMessage);
            // sendMail("sudeep@webtechnepal.com", emailSubject, gauravMessage);
        }
        if (newTask.assignedUsers) {
            for (const user of newTask.assignedUsers) {
                yield createNotification(user.userId, "New Task Assigned", `You've been assigned a new task: "${newTask.title}" in project "${project === null || project === void 0 ? void 0 : project.name}"`, 'task_assigned');
            }
        }
        const updatedProject = yield prisma.project.findUnique({
            where: { id: Number(projectId) },
            include: { tasks: true },
        });
        res.status(201).json(Object.assign(Object.assign({}, newTask), { project: updatedProject }));
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating a task: ${error.message}` });
    }
});
exports.createTask = createTask;
// Get Task Start
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, assignedTo } = req.query;
    try {
        const tasks = yield prisma.task.findMany({
            where: Object.assign(Object.assign({}, (projectId ? { projectId: Number(projectId) } : {})), (assignedTo ? { assignedTo: String(assignedTo) } : {})),
            include: {
                assignedUsers: true, // Add this line
                subtasks: true,
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                },
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
exports.getTasks = getTasks;
// Get Task End
// Get Task By User Start
const getTasksByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedUsers: {
                    some: {
                        userId: Number(userId),
                    },
                },
            },
            include: {
                assignedUsers: true, // Make sure this is included
                subtasks: true,
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: "desc" },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                },
                project: true, // Include project if needed
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});
exports.getTasksByUser = getTasksByUser;
// Get Task BY User End
// Update Task Status Start
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { status, updatedBy } = req.body;
    try {
        const existingTask = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: { project: true },
        });
        if (!existingTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const previousStatus = existingTask.status;
        // Only proceed if the status is actually changing
        if (previousStatus === status) {
            res.json(existingTask); // Return the existing task without changes
            return;
        }
        // Create activity log only if status changed
        yield prisma.activityLog.create({
            data: {
                action: "STATUS_UPDATE",
                details: `${previousStatus}|${status}`,
                userId: Number(updatedBy),
                taskId: Number(taskId),
            },
        });
        // In updateTaskStatus function, after updating the status
        const task = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: { assignedUsers: true, project: true },
        });
        if (task) {
            for (const user of task.assignedUsers) {
                yield createNotification(user.userId, "Task Status Updated", `Task "${task.title}" status changed from ${previousStatus} to ${status}`, 'status_changed');
            }
        }
        const taskName = existingTask.title;
        const projectName = existingTask.project
            ? existingTask.project.name
            : "Unknown Project";
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: Number(updatedBy) },
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the task" });
            return;
        }
        const updatedTask = yield prisma.task.update({
            where: { id: Number(taskId) },
            data: { status },
        });
        const emailSubject = `Task Status Updated: ${taskName}`;
        const emailMessage = `
      <p><strong>${updatingUser.username}</strong> updated the task <strong>${taskName}</strong> of project <strong>${projectName}</strong>.</p>
      <p>Status changed from <strong>${previousStatus}</strong> to <strong>${status}</strong>.</p>
    `;
        sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
        // sendMail("sudeep@webtechnepal.com", emailSubject, emailMessage);
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTaskStatus = updateTaskStatus;
// Get Task By Status End
// Update Status End
// Get Task By UserId For User Tasks Start
const getTasksByUserIdForUserTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedUsers: {
                    some: {
                        userId: Number(userId),
                    },
                },
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
// Get Task By UserId For User Tasks End
// Get Task By UserId For Profile Start
const getTasksByUserIdForProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedUsers: {
                    some: {
                        userId: Number(userId),
                    },
                },
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
// Update Task Start
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { taskId } = req.params;
    const { title, description, status, priority, startDate, dueDate, assignedTo, // This should be the userId
    assignedBy, projectId, } = req.body;
    try {
        const existingTask = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                project: true,
                assignedUsers: true,
            },
        });
        if (!existingTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        // Fetch the assigned user's details
        const assignedUser = yield prisma.user.findUnique({
            where: { userId: Number(assignedTo) },
        });
        if (!assignedUser) {
            res.status(400).json({ message: "Assigned user not found" });
            return;
        }
        // Extract the logged-in user's information from the JWT token
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
        // Update the task with the assignedTo field as the userId
        const updatedTask = yield prisma.task.update({
            where: { id: Number(taskId) },
            data: {
                title,
                description,
                status,
                priority,
                startDate,
                dueDate,
                assignedBy,
                projectId,
                assignedUsers: {
                    set: assignedTo.map((userId) => ({ userId: Number(userId) })),
                },
            },
            include: {
                project: true,
                assignedUsers: true,
            },
        });
        // Rest of the code (email notifications, etc.)
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
        // Inside updateTask, in the changes array section
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
        if (projectId && projectId !== existingTask.projectId) {
            const oldProject = ((_b = existingTask.project) === null || _b === void 0 ? void 0 : _b.name) || "N/A";
            const newProject = ((_c = (yield prisma.project.findUnique({ where: { id: Number(projectId) } }))) === null || _c === void 0 ? void 0 : _c.name) || "N/A";
            changes.push(`Project: <strong>${oldProject}</strong> → <strong>${newProject}</strong>`);
        }
        if (assignedBy && assignedBy !== existingTask.assignedBy) {
            const oldAssignedBy = ((_d = (yield prisma.user.findUnique({
                where: { email: existingTask.assignedBy },
            }))) === null || _d === void 0 ? void 0 : _d.username) ||
                existingTask.assignedBy ||
                "N/A";
            const newAssignedBy = ((_e = (yield prisma.user.findUnique({ where: { email: assignedBy } }))) === null || _e === void 0 ? void 0 : _e.username) ||
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
              <strong>${updatingUser.username}</strong> updated the task <strong>${updatedTask.title}</strong> of <strong>${((_f = existingTask.project) === null || _f === void 0 ? void 0 : _f.name) || "Unknown Project"}</strong>:
            </p>
            <ul style="list-style-type: disc; padding-left: 20px;">
              ${changes.map((change) => `<li>${change}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
            if (assignedUser.email) {
                // Send to assigned user and both admin emails
                sendMail(assignedUser.email, emailSubject, emailMessage);
            }
            sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
            // sendMail("sudeep@webtechnepal.com", emailSubject, emailMessage);
            console.error("Assigned user email is missing or invalid. Email sent only to admins.");
        }
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTask = updateTask;
// Update Task End
// Delete Task Start
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { taskId } = req.params;
    try {
        const taskToDelete = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: { project: true },
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
        yield prisma.task.delete({
            where: { id: Number(taskId) },
        });
        // Send email to gaurav@webtech.com.np
        const gauravEmailSubject = `Task Deleted: ${taskToDelete.title}`;
        const gauravEmailMessage = (0, emailTemplates_1.taskDeletedEmailTemplate)(deletingUser.username || "Unknown User", // Fallback value if username is null
        taskToDelete.title, ((_b = taskToDelete.project) === null || _b === void 0 ? void 0 : _b.name) || "Unknown Project");
        sendMail("gaurav@webtech.com.np", gauravEmailSubject, gauravEmailMessage);
        // sendMail("sudeep@webtechnepal.com", gauravEmailSubject, gauravEmailMessage);
        res.status(200).json({ message: "Task successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting task: ${error.message}` });
    }
});
exports.deleteTask = deleteTask;
// Delete Task End
// Task Comment Start
const getTaskComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const comments = yield prisma.comment.findMany({
            where: { taskId: Number(taskId) },
            include: { user: true },
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
// Get Comment End
// Post Comment Start
const addCommentToTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { content, userId } = req.body;
    try {
        const newComment = yield prisma.comment.create({
            data: {
                content,
                userId: Number(userId),
                taskId: Number(taskId),
            },
            include: { user: true },
        });
        res.status(201).json(newComment);
    }
    catch (error) {
        res.status(500).json({ message: `Error adding comment: ${error.message}` });
    }
});
exports.addCommentToTask = addCommentToTask;
// server/src/controllers/taskController.ts
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
                projectId: parentTask.projectId,
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
        const formatNepaliTime = (dateValue) => {
            if (!dateValue)
                return "N/A";
            return (0, date_fns_tz_1.format)(dateValue, "MMMM dd, yyyy hh:mm a", {
                timeZone: "Asia/Kathmandu",
            });
        };
        const formattedStartDate = formatNepaliTime(newSubtask.startDate);
        const formattedDueDate = formatNepaliTime(newSubtask.dueDate);
        // Send emails to assigned users
        if (newSubtask.assignedUsers && creator && parentTask.project) {
            const emailSubject = `New Subtask Assigned: ${newSubtask.title}`;
            for (const user of newSubtask.assignedUsers) {
                if (user.email) {
                    const userMessage = subtaskCreatedEmailTemplate(creator.username || "System", newSubtask.title, parentTask.title, parentTask.project.name, formattedStartDate, formattedDueDate);
                    sendMail(user.email, emailSubject, userMessage);
                    // Create notification
                    yield createNotification(user.userId, "New Subtask Assigned", `You've been assigned a new subtask: "${newSubtask.title}" under parent task "${parentTask.title}"`, 'subtask_assigned');
                }
            }
            // Send to admins
            const adminMessage = subtaskCreatedEmailTemplate(creator.username || "System", newSubtask.title, parentTask.title, parentTask.project.name, formattedStartDate, formattedDueDate);
            sendMail("gaurav@webtech.com.np", emailSubject, adminMessage);
            // sendMail("sudeep@webtechnepal.com", emailSubject, adminMessage);
        }
        res.status(201).json(newSubtask);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating subtask: ${error.message}` });
    }
});
exports.createSubtask = createSubtask;
const getSubtasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const subtasks = yield prisma.task.findMany({
            where: {
                parentTaskId: Number(taskId),
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
            },
        });
        res.json(subtasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving subtasks: ${error.message}` });
    }
});
exports.getSubtasks = getSubtasks;
// Update the updateSubtask function
const updateSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        if (description !== undefined && description !== existingSubtask.description) {
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
            new Date(startDate).getTime() !== new Date(existingSubtask.startDate).getTime()) {
            const oldStartDate = (0, date_fns_tz_1.format)(new Date(existingSubtask.startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newStartDate = (0, date_fns_tz_1.format)(new Date(startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            changes.push(`Start Date: <strong>${oldStartDate}</strong> → <strong>${newStartDate}</strong>`);
        }
        if (dueDate &&
            existingSubtask.dueDate !== null &&
            new Date(dueDate).getTime() !== new Date(existingSubtask.dueDate).getTime()) {
            const oldDueDate = (0, date_fns_tz_1.format)(new Date(existingSubtask.dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newDueDate = (0, date_fns_tz_1.format)(new Date(dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
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
        // Send emails if there were changes
        if (changes.length > 0 && existingSubtask.project && existingSubtask.parentTask) {
            const emailSubject = `Subtask Updated: ${updatedSubtask.title}`;
            const emailMessage = subtaskUpdatedEmailTemplate(updatingUser.username || "System", updatedSubtask.title, existingSubtask.parentTask.title, existingSubtask.project.name, changes);
            // Send to all assigned users (both old and new)
            const allAssignedUsers = [...new Set([
                    ...existingSubtask.assignedUsers.map(u => u.userId),
                    ...updatedSubtask.assignedUsers.map(u => u.userId)
                ])];
            for (const userId of allAssignedUsers) {
                const user = yield prisma.user.findUnique({
                    where: { userId },
                    select: { email: true }
                });
                if (user === null || user === void 0 ? void 0 : user.email) {
                    sendMail(user.email, emailSubject, emailMessage);
                }
                // Create notification
                yield createNotification(userId, "Subtask Updated", `Subtask "${updatedSubtask.title}" under "${existingSubtask.parentTask.title}" was updated`);
            }
            // Send to admins
            sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
            // sendMail("sudeep@webtechnepal.com", emailSubject, emailMessage);
        }
        res.json(updatedSubtask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating subtask: ${error.message}` });
    }
});
exports.updateSubtask = updateSubtask;
// Add deleteSubtask function
const deleteSubtask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
                project: true,
                parentTask: true,
                assignedUsers: true,
            },
        });
        if (!subtaskToDelete) {
            res.status(404).json({ message: "Subtask not found" });
            return;
        }
        yield prisma.task.delete({
            where: { id: Number(subtaskId) },
        });
        // Send emails
        if (subtaskToDelete.project && subtaskToDelete.parentTask) {
            const emailSubject = `Subtask Deleted: ${subtaskToDelete.title}`;
            const emailMessage = subtaskDeletedEmailTemplate(deletingUser.username || "System", subtaskToDelete.title, subtaskToDelete.parentTask.title, subtaskToDelete.project.name);
            // Send to all assigned users
            for (const user of subtaskToDelete.assignedUsers) {
                if (user.email) {
                    sendMail(user.email, emailSubject, emailMessage);
                }
                // Create notification
                yield createNotification(user.userId, "Subtask Deleted", `Subtask "${subtaskToDelete.title}" under "${subtaskToDelete.parentTask.title}" was deleted`);
            }
            // Send to admins
            sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
            // sendMail("sudeep@webtechnepal.com", emailSubject, emailMessage);
        }
        res.status(200).json({ message: "Subtask successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting subtask: ${error.message}` });
    }
});
exports.deleteSubtask = deleteSubtask;
