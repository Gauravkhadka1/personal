import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { authenticateToken } from "./middleware/authMiddleware";

/* ROUTE IMPORTS */
import userRoutes from "./routes/userRoutes";
import financeRoutes from "./routes/financeRoutes";


dotenv.config();

const app = express();
const server = http.createServer(app);
const UPLOAD_DIR = path.join(process.cwd(), "/uploads");

// ✅ Single source of truth for allowed origins
const ALLOWED_ORIGINS = [
  "https://webtech.mobi.np",       // no trailing slash
  "https://www.webtech.mobi.np",   // www variant
  "http://localhost:3000",          // local dev
  "http://localhost:3001",          // local dev
];

/* SOCKET.IO SETUP */
const io = new SocketIOServer(server, {
  cors: {
    origin: ALLOWED_ORIGINS,        // ✅ same list
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export { io };

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("join_room", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

/* MIDDLEWARE */
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ Express CORS uses the same ALLOWED_ORIGINS list
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!requestOrigin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(requestOrigin)) {
        callback(null, true);
      } else {
        console.error(`❌ CORS blocked origin: ${requestOrigin}`);
        callback(new Error(`CORS policy: origin ${requestOrigin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ✅ Handle preflight OPTIONS requests for all routes
app.options("*", cors());

// Serve static files
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      } else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
        res.setHeader("Content-Type", "image/jpeg");
      }
    },
  }),
);

/* ROUTES */
app.get("/api", (req: Request, res: Response) => {
  res.send("This is home route. Backend is running.");
});

app.use("/api/users",             userRoutes);
app.use("/api/finance", financeRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 8000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});