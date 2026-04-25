// server/src/middleware/authMiddleware.ts - Fixed with token blacklist implementation
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simple in-memory token blacklist (for production, use Redis or database)
const tokenBlacklist = new Set<string>();

// Token blacklist functions
export const addToBlacklist = (token: string): void => {
  // Add token to blacklist with expiration time (extract from token)
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      const expiresIn = decoded.exp * 1000 - Date.now();
      if (expiresIn > 0) {
        tokenBlacklist.add(token);
        // Auto-remove expired tokens
        setTimeout(() => tokenBlacklist.delete(token), expiresIn);
      }
    }
  } catch (error) {
    console.error("Error adding token to blacklist:", error);
  }
};

export const checkTokenBlacklist = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if token is blacklisted FIRST (before verification)
    const isBlacklisted = checkTokenBlacklist(token);
    if (isBlacklisted) {
      res.status(403).json({ message: "Token revoked" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // Check if user still exists and is active
     const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      select: { 
        userId: true, 
        role: true  // ← ADD THIS
      }
    });

 (req as any).userId = decoded.userId;
    (req as any).user = user;  // ← ADD THIS
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Invalid token" });
    } else {
      res.status(500).json({ message: "Authentication error" });
    }
  }
};
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (user.role !== 'ADMIN') {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Authorization error" });
  }
};