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
exports.sendSystemFeedbackStatusUpdateNotification = exports.sendSystemFeedbackNotification = exports.sendTodayUpdateReplyNotification = exports.sendTodayUpdateLikeNotification = exports.sendTodayUpdateNotification = exports.sendNoteReplyNotification = exports.sendNoteReplyToReplyNotification = exports.sendNoteLikeNotification = exports.sendPublicNoteNotification = exports.sendEmail = void 0;
// server/src/utils/emailSender.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("@prisma/client");
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
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = Object.assign({ from: `"Workspace Webtech" <${process.env.SMTP_FROM_EMAIL}>` }, options);
        yield transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
});
exports.sendEmail = sendEmail;
const sendPublicNoteNotification = (username, noteContent, action) => __awaiter(void 0, void 0, void 0, function* () {
    const recipients = [
        // 'all@webtechnepal.com'
        'gaurav@webtech.com.np'
    ];
    const subject = `New Public Note ${action} by ${username}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
        .note { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Public Note ${action}</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${username}</strong> has ${action} a public note:</p>
          <div class="note">
            ${noteContent}
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    yield (0, exports.sendEmail)({
        to: recipients,
        subject,
        html,
    });
});
exports.sendPublicNoteNotification = sendPublicNoteNotification;
const sendNoteLikeNotification = (noteId, actorUsername) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const note = yield prisma.note.findUnique({
            where: { id: noteId },
            include: { user: true }
        });
        if (!note || !note.user)
            return;
        const subject = `${actorUsername} liked your public note`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
          .note { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your note was liked</h1>
          </div>
          <div class="content">
            <p>Hello ${note.user.username},</p>
            <p><strong>${actorUsername}</strong> liked your public note:</p>
            <div class="note">
              <h3>Public Note</h3>
              <p>${note.content}</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        yield (0, exports.sendEmail)({
            to: note.user.email,
            subject,
            html
        });
    }
    catch (error) {
        console.error('Error sending note like notification:', error);
    }
});
exports.sendNoteLikeNotification = sendNoteLikeNotification;
const sendNoteReplyToReplyNotification = (noteId, actorUsername, replyContent, recipientUsername, recipientEmail) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const note = yield prisma.note.findUnique({
            where: { id: noteId },
            include: { user: true }
        });
        if (!note)
            return;
        const recipient = yield prisma.user.findUnique({
            where: { username: recipientUsername }
        });
        if (!recipient)
            return;
        const subject = `${actorUsername} replied to your comment on a public note`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
          .note { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New reply to your comment</h1>
          </div>
          <div class="content">
            <p>Hello ${recipientUsername},</p>
            <p><strong>${actorUsername}</strong> replied to your comment on a public note:</p>
            <div class="note">
              <h3>Public Note</h3>
              <p>${note.content}</p>
            </div>
            <p>Their reply:</p>
            <div class="note">
              <p>${replyContent}</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        yield (0, exports.sendEmail)({
            to: recipientEmail || recipient.email,
            subject,
            html
        });
        // Also send to gaurav@webtech.com.np
        yield (0, exports.sendEmail)({
            to: 'gaurav@webtech.com.np',
            subject: `[Copy] ${subject}`,
            html
        });
    }
    catch (error) {
        console.error('Error sending note reply-to-reply notification:', error);
    }
});
exports.sendNoteReplyToReplyNotification = sendNoteReplyToReplyNotification;
const sendNoteReplyNotification = (noteId, actorUsername, replyContent, customRecipient) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const note = yield prisma.note.findUnique({
            where: { id: noteId },
            include: { user: true }
        });
        if (!note || !note.user)
            return;
        const subject = `${actorUsername} replied to your public note`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
          .note { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New reply to your note</h1>
          </div>
          <div class="content">
            <p>Hello ${customRecipient || note.user.username},</p>
            <p><strong>${actorUsername}</strong> replied to your public note:</p>
            <div class="note">
              <h3>Public Note</h3>
              <p>${note.content}</p>
            </div>
            <p>Their reply:</p>
            <div class="note">
              <p>${replyContent}</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        yield (0, exports.sendEmail)({
            to: customRecipient || note.user.email,
            subject,
            html
        });
        // Also send to gaurav@webtech.com.np if not already the recipient
        if (!customRecipient || customRecipient !== 'gaurav@webtech.com.np') {
            yield (0, exports.sendEmail)({
                to: 'gaurav@webtech.com.np',
                subject: `[Copy] ${subject}`,
                html
            });
        }
    }
    catch (error) {
        console.error('Error sending note reply notification:', error);
    }
});
exports.sendNoteReplyNotification = sendNoteReplyNotification;
// Add these functions to emailSender.ts
const sendTodayUpdateNotification = (username, updateContent, creatorEmail, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const isSpecialUser = userId && [2, 3].includes(userId);
    // const recipients = isSpecialUser 
    // ? ['gaurav@webtech.com.np']
    // : [
    //     creatorEmail,
    //     'gaurav@webtech.com.np',
    //   ];
    const recipients = isSpecialUser
        ? ['business@webtechnepal.com']
        : [
            creatorEmail,
            'business@webtechnepal.com',
        ];
    const subject = `Today Tasks Details Updated by ${username}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
        .update { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Today's Tasks Details Updated</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${username}</strong> has updated today tasks details:</p>
          <div class="update">
            ${updateContent}
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    yield (0, exports.sendEmail)({
        to: recipients,
        subject,
        html,
    });
});
exports.sendTodayUpdateNotification = sendTodayUpdateNotification;
const sendTodayUpdateLikeNotification = (updateId, actorUsername) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const update = yield prisma.todayUpdate.findUnique({
            where: { id: updateId },
            include: { user: true }
        });
        if (!update || !update.user)
            return;
        const subject = `${actorUsername} liked your today update`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
          .update { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your update was liked</h1>
          </div>
          <div class="content">
            <p>Hello ${update.user.username},</p>
            <p><strong>${actorUsername}</strong> liked your today update:</p>
            <div class="update">
              ${update.content}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        yield (0, exports.sendEmail)({
            to: update.user.email,
            subject,
            html
        });
    }
    catch (error) {
        console.error('Error sending today update like notification:', error);
    }
});
exports.sendTodayUpdateLikeNotification = sendTodayUpdateLikeNotification;
const sendTodayUpdateReplyNotification = (updateId, actorUsername, replyContent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const update = yield prisma.todayUpdate.findUnique({
            where: { id: updateId },
            include: { user: true }
        });
        if (!update || !update.user)
            return;
        const subject = `${actorUsername} replied to your today update`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
          .update { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New reply to your update</h1>
          </div>
          <div class="content">
            <p>Hello ${update.user.username},</p>
            <p><strong>${actorUsername}</strong> replied to your today update:</p>
            <div class="update">
              ${update.content}
            </div>
            <p>Their reply:</p>
            <div class="update">
              ${replyContent}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        yield (0, exports.sendEmail)({
            to: update.user.email,
            subject,
            html
        });
    }
    catch (error) {
        console.error('Error sending today update reply notification:', error);
    }
});
exports.sendTodayUpdateReplyNotification = sendTodayUpdateReplyNotification;
// Add to server/src/utils/emailSender.ts
const sendSystemFeedbackNotification = (username, feedbackContent, feedbackId) => __awaiter(void 0, void 0, void 0, function* () {
    const recipients = [
        'gaurav@webtech.com.np'
    ];
    const subject = `New System Feedback Created by ${username}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 25px 20px; 
          text-align: center; 
          border-radius: 10px 10px 0 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content { 
          padding: 30px; 
          background-color: #ffffff; 
          border-radius: 0 0 10px 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .feedback { 
          background-color: #f8f9fa; 
          padding: 20px; 
          border-left: 4px solid #667eea; 
          margin: 20px 0; 
          border-radius: 4px;
          font-style: italic;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 12px; 
          color: #777; 
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .user-info {
          background-color: #e8f4fd;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          border-left: 4px solid #2196F3;
        }
        .timestamp {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 New System Feedback</h1>
        </div>
        <div class="content">
          <p>Hello Team,</p>
          
          <div class="user-info">
            <strong>${username}</strong> has submitted new system feedback.
          </div>
          
          <p><strong>Feedback Details:</strong></p>
          <div class="feedback">
            ${feedbackContent}
          </div>
          
          <div class="timestamp">
            Submitted on: ${new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
          </div>
          
          <p>You can view and manage this feedback by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="https://webtech.mobi.np/system-feedback" class="button">
              View System Feedback
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            <strong>Note:</strong> This feedback has been marked as <strong>New</strong> and is awaiting review.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from Webtech Workspace System.</p>
          <p>Please do not reply directly to this email.</p>
          <p>© ${new Date().getFullYear()} Webtech Nepal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    yield (0, exports.sendEmail)({
        to: recipients,
        subject,
        html,
    });
});
exports.sendSystemFeedbackNotification = sendSystemFeedbackNotification;
const sendSystemFeedbackStatusUpdateNotification = (creatorEmail, adminEmail, creatorUsername, feedbackContent, feedbackId, oldStatus, newStatus, updatedByUsername) => __awaiter(void 0, void 0, void 0, function* () {
    // Send to both creator and gaurav in a single email
    const recipients = [creatorEmail, adminEmail];
    const subject = `System Feedback Status Updated - ${newStatus}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 25px 20px; 
          text-align: center; 
          border-radius: 10px 10px 0 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content { 
          padding: 30px; 
          background-color: #ffffff; 
          border-radius: 0 0 10px 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .feedback { 
          background-color: #f8f9fa; 
          padding: 20px; 
          border-left: 4px solid #667eea; 
          margin: 20px 0; 
          border-radius: 4px;
          font-style: italic;
        }
        .status-update {
          background-color: #e8f4fd;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          border-left: 4px solid #2196F3;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          margin: 0 5px;
        }
        .status-new { background-color: #ffeb3b; color: #333; }
        .status-acknowledged { background-color: #2196f3; color: white; }
        .status-inprogress { background-color: #ff9800; color: white; }
        .status-resolved { background-color: #4caf50; color: white; }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 12px; 
          color: #777; 
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .user-info {
          background-color: #f0f8ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .timestamp {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .arrow {
          font-size: 20px;
          color: #666;
          margin: 0 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 System Feedback Status Updated</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <div class="user-info">
            <strong>${updatedByUsername}</strong> has updated the status of system feedback created by <strong>you.</strong>.
          </div>
          
          <div class="status-update">
            <strong>Status Change:</strong><br>
            <span class="status-badge status-${oldStatus.toLowerCase()}">${oldStatus}</span>
            <span class="arrow">→</span>
            <span class="status-badge status-${newStatus.toLowerCase()}">${newStatus}</span>
          </div>
          
          <p><strong>Feedback:</strong></p>
          <div class="feedback">
            ${feedbackContent}
          </div>
          
          <div class="timestamp">
            Status updated on: ${new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
          </div>
          
          <p>You can view this feedback by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="https://webtech.mobi.np/system-feedback" class="button" style="color: white;">
              View System Feedback
            </a>
          </div>
          
          
        </div>
        <div class="footer">
          <p>This is an automated message from Webtech Workspace System.</p>
          <p>Please do not reply directly to this email.</p>
          <p>© ${new Date().getFullYear()} Webtech Nepal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    yield (0, exports.sendEmail)({
        to: recipients,
        subject,
        html,
    });
});
exports.sendSystemFeedbackStatusUpdateNotification = sendSystemFeedbackStatusUpdateNotification;
