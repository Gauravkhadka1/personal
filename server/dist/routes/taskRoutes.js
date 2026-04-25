"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const upload_1 = __importDefault(require("../utils/upload"));
const router = (0, express_1.Router)();
router.get("/", taskController_1.getTasks);
router.get("/taskpage", taskController_1.getTasksForTaskPage);
router.get("/taskreport", taskController_1.getTaskReport);
router.get("/:taskId", taskController_1.getTaskById);
router.get("/counts/my-status", taskController_1.getMyTasksCountByStatus);
router.get("/counts/status", taskController_1.getTaskCountByStatus);
router.get("/user/:userId", taskController_1.getTasksByUser);
router.get("/usertasks/:userId", taskController_1.getTasksByUserIdForUserTasks); // New route for user tasks
router.get("/profile/:userId", taskController_1.getTasksByUserIdForProfile);
router.post("/", taskController_1.createTask);
router.put("/:taskId", taskController_1.updateTask);
router.delete("/:taskId", taskController_1.deleteTask);
router.patch("/:taskId/status", taskController_1.updateTaskStatus);
router.post("/:taskId/attachments", upload_1.default.array("files"), taskController_1.uploadAttachments);
router.delete("/:taskId/attachments/:attachmentId", taskController_1.deleteAttachment);
router.delete("/:taskId/permanentdeletetasks", taskController_1.permanentDeleteTask); // New permanent delete route
router.patch("/:taskId/soft-deletetasks", taskController_1.softDeleteTask); // New soft delete route
router.patch("/:taskId/restoretasks", taskController_1.restoreTask); // New restore route
router.get("/deletedtasks", taskController_1.getAllDeletedTasks); // New get all deleted tasks route
router.get("/:taskId/deletedtasks", taskController_1.getDeletedTasks);
// Comment routes
router.get("/:taskId/comments", taskController_1.getTaskComments);
router.post("/:taskId/comments", taskController_1.addCommentToTask);
// Individual comment routes
router.get("/comments/:commentId", taskController_1.getCommentWithReplies);
router.put("/comments/:commentId", taskController_1.editComment);
router.delete("/comments/:commentId", taskController_1.deleteComment);
router.post("/comments/:commentId/like", taskController_1.toggleCommentLike);
// Reply routes
router.post("/comments/:commentId/replies", taskController_1.addReplyToComment);
router.put("/replies/:replyId", taskController_1.editReply);
router.delete("/replies/:replyId", taskController_1.deleteReply);
router.post("/replies/:replyId/like", taskController_1.toggleReplyLike);
router.post("/:parentTaskId/subtasks", taskController_1.createSubtask);
router.get("/:taskId/subtasks", taskController_1.getSubtasks);
router.put("/:subtaskId/subtasks", taskController_1.updateSubtask);
router.delete("/subtasks/:subtaskId", taskController_1.deleteSubtask);
router.patch("/subtasks/:subtaskId/soft-delete", taskController_1.softDeleteSubtask);
router.patch("/subtasks/:subtaskId/restore", taskController_1.restoreSubtask);
router.get("/:taskId/subtasks/deleted", taskController_1.getDeletedSubtasks);
router.get("/subtasks/deleted", taskController_1.getAllDeletedSubtasks);
router.get("/deleted/my-tasks", taskController_1.getMyDeletedTasks); // Only tasks
router.get("/deleted/my-subtasks", taskController_1.getMyDeletedSubtasks); // Only subtasks
router.post("/:taskId/timer/start", taskController_1.startTimer);
router.post("/:taskId/timer/pause", taskController_1.pauseTimer);
router.post("/:taskId/timer/stop", taskController_1.stopTimer);
router.get("/:taskId/timer/status", taskController_1.getTimerStatus);
router.post("/subtasks/:subtaskId/timer/start", taskController_1.startSubtaskTimer);
router.post("/subtasks/:subtaskId/timer/pause", taskController_1.pauseSubtaskTimer);
router.post("/subtasks/:subtaskId/timer/stop", taskController_1.stopSubtaskTimer);
router.get("/subtasks/:subtaskId/timer/status", taskController_1.getSubtaskTimerStatus);
router.get("/user-schedule/:userId", taskController_1.getUserDailySchedule);
exports.default = router;
