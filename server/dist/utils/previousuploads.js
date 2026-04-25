"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixedUpload = exports.multipleUpload = exports.singleUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB file size limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images, PDFs, and Word documents
        if (file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        }
        else {
            cb(new Error('Only image, PDF, and Word files are allowed!'));
        }
    }
});
// Create specific middleware instances for different upload scenarios
exports.singleUpload = upload.single('file');
exports.multipleUpload = upload.array('files', 10);
exports.mixedUpload = upload.fields([
    { name: 'webDesignAgreement', maxCount: 1 },
    { name: 'webDesignInstallments', maxCount: 10 },
    { name: 'microsoftServices', maxCount: 10 } // Add this for Microsoft purchase orders
]);
exports.default = upload;
