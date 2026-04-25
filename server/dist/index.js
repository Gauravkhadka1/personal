"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
/* ROUTE IMPORTS */
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const financeRoutes_1 = __importDefault(require("./routes/financeRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const UPLOAD_DIR = path_1.default.join(process.cwd(), "/uploads");
// ✅ Single source of truth for allowed origins
const ALLOWED_ORIGINS = [
    "https://fin-gym.vercel.app", // no trailing slash
    "https://www.fin-gym.vercel.app", // www variant
    "http://localhost:3000", // local dev
];
/* SOCKET.IO SETUP */
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS, // ✅ same list
        methods: ["GET", "POST"],
        credentials: true,
    },
});
exports.io = io;
io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socket.on("join_room", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
    });
    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});
/* MIDDLEWARE */
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
// ✅ Express CORS uses the same ALLOWED_ORIGINS list
app.use((0, cors_1.default)({
    origin: (requestOrigin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!requestOrigin)
            return callback(null, true);
        if (ALLOWED_ORIGINS.includes(requestOrigin)) {
            callback(null, true);
        }
        else {
            console.error(`❌ CORS blocked origin: ${requestOrigin}`);
            callback(new Error(`CORS policy: origin ${requestOrigin} not allowed`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// ✅ Handle preflight OPTIONS requests for all routes
app.options("*", (0, cors_1.default)());
// Serve static files
app.use("/uploads", express_1.default.static(UPLOAD_DIR, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith(".png")) {
            res.setHeader("Content-Type", "image/png");
        }
        else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
            res.setHeader("Content-Type", "image/jpeg");
        }
    },
}));
/* ROUTES */
app.get("/api", (req, res) => {
    res.send("This is home route. Backend is running.");
});
app.use("/api/users", userRoutes_1.default);
app.use("/api/finance", financeRoutes_1.default);
/* SERVER */
const port = Number(process.env.PORT) || 8000;
server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});
