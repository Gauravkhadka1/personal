import { Request, Response } from "express";
import { PrismaClient, LessonContentType } from "@prisma/client";

const prisma = new PrismaClient();

// Get all lessons with filtering
export const getLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, contentType, search, page = 1, limit = 10 } = req.query;
    const userId = (req as any).userId;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build filter conditions
    const where: any = { userId: Number(userId) };
    
    if (categoryId) {
      where.categoryId = categoryId as string;
    }
    
    if (contentType) {
      where.contentType = contentType as LessonContentType;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } }
      ];
    }

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          category: true
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.lesson.count({ where })
    ]);

    res.json({
      data: lessons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ message: `Error fetching lessons: ${error.message}` });
  }
};

// Get single lesson by ID
export const getLessonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
        userId: Number(userId)
      },
      include: {
        category: true
      }
    });

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    res.json(lesson);
  } catch (error: any) {
    console.error("Error fetching lesson:", error);
    res.status(500).json({ message: `Error fetching lesson: ${error.message}` });
  }
};

// Create new lesson
export const createLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, contentType, imageUrl, categoryId } = req.body;
    const userId = (req as any).userId;

    // Validation
    if (!title || !categoryId) {
      res.status(400).json({ message: "Title and category are required" });
      return;
    }

    // Check if category exists
    const category = await prisma.lessonCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Validate content based on type
    if (contentType === 'TEXT' && !content) {
      res.status(400).json({ message: "Content is required for text lessons" });
      return;
    }

    if (contentType === 'IMAGE' && !imageUrl) {
      res.status(400).json({ message: "Image URL is required for image lessons" });
      return;
    }

    if (contentType === 'TEXT_IMAGE' && (!content || !imageUrl)) {
      res.status(400).json({ message: "Both content and image URL are required for text-image lessons" });
      return;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content: content || null,
        contentType: contentType || 'TEXT',
        imageUrl: imageUrl || null,
        categoryId,
        userId: Number(userId)
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      message: "Lesson created successfully",
      lesson
    });
  } catch (error: any) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ message: `Error creating lesson: ${error.message}` });
  }
};

// Update lesson
export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, contentType, imageUrl, categoryId } = req.body;
    const userId = (req as any).userId;

    // Check if lesson exists and belongs to user
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        userId: Number(userId)
      }
    });

    if (!existingLesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    // If category is being updated, check if it exists
    if (categoryId && categoryId !== existingLesson.categoryId) {
      const category = await prisma.lessonCategory.findUnique({
        where: { id: categoryId }
      });
      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (contentType) updateData.contentType = contentType;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (categoryId) updateData.categoryId = categoryId;

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    res.json({
      message: "Lesson updated successfully",
      lesson: updatedLesson
    });
  } catch (error: any) {
    console.error("Error updating lesson:", error);
    res.status(500).json({ message: `Error updating lesson: ${error.message}` });
  }
};

// Delete lesson
export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
        userId: Number(userId)
      }
    });

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    await prisma.lesson.delete({
      where: { id }
    });

    res.json({ message: "Lesson deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting lesson:", error);
    res.status(500).json({ message: `Error deleting lesson: ${error.message}` });
  }
};

// Get lessons by category with count
export const getLessonsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const userId = (req as any).userId;

    const lessons = await prisma.lesson.findMany({
      where: {
        categoryId,
        userId: Number(userId)
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      data: lessons,
      count: lessons.length
    });
  } catch (error: any) {
    console.error("Error fetching lessons by category:", error);
    res.status(500).json({ message: `Error fetching lessons: ${error.message}` });
  }
};