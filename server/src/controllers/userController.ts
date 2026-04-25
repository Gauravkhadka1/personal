import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import validator from "validator";
import { RateLimiterMemory } from "rate-limiter-flexible";

const prisma = new PrismaClient();

// Rate limiter for login attempts
const loginRateLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 15 * 60, // 15 minutes
});

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      firstname,
      lastname,
      phone,
      email,
      role,
      profilePictureUrl,
      password,
      clientId,
    } = req.body;

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (password.length < 8) {
      res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
      return;
    }

    // Check password complexity
    if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        password,
      )
    ) {
      res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number, and special character",
      });
      return;
    }

    if (!firstname || !lastname || !phone || !email || !role || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!["DESIGNER", "ADMIN", "USER"].includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    if (role && role === "ADMIN") {
      res
        .status(403)
        .json({ message: "Cannot assign ADMIN role during user creation" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        phone,
        email,
        profilePictureUrl: profilePictureUrl || "",
        role,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        userId: newUser.userId,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        phone: newUser.phone,
        email: newUser.email,
        profilePictureUrl: newUser.profilePictureUrl,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: `Error creating user: ${error.message}` });
  }
};

/**
 * Login user
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Rate limiting
    try {
      const key = (req.ip || "unknown") + req.body.email;
      await loginRateLimiter.consume(key);
    } catch (rateLimiterRes) {
      res.status(429).json({
        message: "Too many login attempts. Try again later.",
      });
      return;
    }
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        email: true,
        password: true,
        profilePictureUrl: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Add failed login attempt tracking to user model
    if (!isMatch) {
      await prisma.user.update({
        where: { email },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { email },
      data: { failedLoginAttempts: 0, lastLogin: new Date() },
    });

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.userId, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: `Error logging in: ${error.message}` });
  }
};

/**
 * Get all users
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        firstname: true,
        lastname: true,
        phone: true,
        email: true,
        profilePictureUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });


    res.json(users);
  } catch (error: any) {
    console.error("Error retrieving users:", error);
    res
      .status(500)
      .json({ message: `Error retrieving users: ${error.message}` });
  }
};

/**
 * Get a user by email
 */
export const getUserByEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.params;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        email: true,
        profilePictureUrl: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error retrieving user:", error);
    res
      .status(500)
      .json({ message: `Error retrieving user: ${error.message}` });
  }
};

/**
 * Delete a user by email
 */
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.params;

    const deletedUser = await prisma.user.delete({
      where: { email },
    });

    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: `Error deleting user: ${error.message}` });
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ message: "Current password and new password are required" });
      return;
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { userId: Number(userId) },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Ensure the user has a password
    if (!user.password) {
      res.status(401).json({ message: "User does not have a password set" });
      return;
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { userId: Number(userId) },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ message: `Error changing password: ${error.message}` });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // The userId is set by the auth middleware
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userId: Number(userId) },
      select: {
        userId: true,
        email: true,
        profilePictureUrl: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error retrieving current user:", error);
    res
      .status(500)
      .json({ message: `Error retrieving current user: ${error.message}` });
  }
};

export const uploadProfilePicture = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // The file has already been saved to disk by multer
    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // Update user's profile picture in database
    const updatedUser = await prisma.user.update({
      where: { userId: Number(userId) },
      data: { profilePictureUrl },
      select: {
        userId: true,
        firstname: true,
        lastname: true,
        phone: true,
        email: true,
        profilePictureUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePictureUrl,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error uploading profile picture:", error);
    res
      .status(500)
      .json({ message: `Error uploading profile picture: ${error.message}` });
  }
};
