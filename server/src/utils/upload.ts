// server\src\utils\upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Create separate storage configurations
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.params.userId;
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${userId}-${uniqueSuffix}${extension}`);
  }
});

const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = UPLOAD_DIR;
    if (file.fieldname === 'attachments') {
      dest = path.join(UPLOAD_DIR, 'feedback');
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// Create separate upload instances
export const profilePictureUpload = multer({
  storage: profilePictureStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for profile pictures!"));
    }
  }
}).single('profilePicture');

export const generalUpload = multer({
  storage: generalStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image, PDF, and Word files are allowed!"));
    }
  }
});

// Export specific middleware instances
export const singleUpload = generalUpload.single("file");
export const multipleUpload = generalUpload.array("files", 10);
export const mixedUpload = generalUpload.fields([
  { name: "webDesignAgreement", maxCount: 1 },
  { name: "webDesignInstallments", maxCount: 10 },
  { name: "microsoftServices", maxCount: 10 },
  { name: "taskAttachments", maxCount: 10 },
]);

export const feedbackUpload = generalUpload.fields([
  { name: 'attachments', maxCount: 10 }
]);

// Default export remains generalUpload for backward compatibility
export default generalUpload;