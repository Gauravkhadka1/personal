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
exports.sendEmailWithAttachment = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        // user: "renewal@webtechnepal.com",
        // pass: "ncskugqkkoijpylj",
        //     user: "workspace@webtechnepal.com",
        // pass: "ikcasazktikvpvqn",
        user: "gauravkhadka111111@gmail.com",
        pass: "rsnmaggznnhknedc",
    },
});
const sendEmailWithAttachment = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Generate text version from HTML if text is not provided
        const textContent = options.text ||
            (options.html ? options.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '');
        const mailOptions = {
            from: '"Webtech Nepal" <workspace@webtechnepal.com>',
            to: options.to,
            subject: options.subject,
            text: textContent,
            html: options.html || textContent.replace(/\n/g, '<br>'),
            attachments: options.attachments || [],
            cc: options.cc || []
        };
        yield transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}`);
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
});
exports.sendEmailWithAttachment = sendEmailWithAttachment;
