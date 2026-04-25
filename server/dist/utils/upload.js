"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackUpload = exports.mixedUpload = exports.multipleUpload = exports.singleUpload = exports.generalUpload = exports.profilePictureUpload = void 0;
// server\src\utils\upload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOAD_DIR = path_1.default.join(process.cwd(), "uploads");
// Ensure the uploads directory exists
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// Create separate storage configurations
const profilePictureStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const userId = req.params.userId;
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `profile-${userId}-${uniqueSuffix}${extension}`);
    }
});
const generalStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let dest = UPLOAD_DIR;
        if (file.fieldname === 'attachments') {
            dest = path_1.default.join(UPLOAD_DIR, 'feedback');
            if (!fs_1.default.existsSync(dest)) {
                fs_1.default.mkdirSync(dest, { recursive: true });
            }
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});
// Create separate upload instances
exports.profilePictureUpload = (0, multer_1.default)({
    storage: profilePictureStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed for profile pictures!"));
        }
    }
}).single('profilePicture');
exports.generalUpload = (0, multer_1.default)({
    storage: generalStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") ||
            file.mimetype === "application/pdf" ||
            file.mimetype === "application/msword" ||
            file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            cb(null, true);
        }
        else {
            cb(new Error("Only image, PDF, and Word files are allowed!"));
        }
    }
});
// Export specific middleware instances
exports.singleUpload = exports.generalUpload.single("file");
exports.multipleUpload = exports.generalUpload.array("files", 10);
exports.mixedUpload = exports.generalUpload.fields([
    { name: "webDesignAgreement", maxCount: 1 },
    { name: "webDesignInstallments", maxCount: 10 },
    { name: "microsoftServices", maxCount: 10 },
    { name: "taskAttachments", maxCount: 10 },
]);
exports.feedbackUpload = exports.generalUpload.fields([
    { name: 'attachments', maxCount: 10 }
]);
// Default export remains generalUpload for backward compatibility
exports.default = exports.generalUpload;
