// server/src/controllers/dailyExpenseController.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create Daily Expense
export const createDailyExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { description, amount, date, expenseCategoryId } = req.body;

    if (!description || amount === undefined || !date || !expenseCategoryId) {
      res.status(400).json({ message: "Description, amount, date, and expense category ID are required" });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    // Verify the expense category exists and belongs to the user
    const expenseCategory = await prisma.expenseCategory.findFirst({
      where: {
        id: expenseCategoryId,
        userId: Number(userId),
      },
    });

    if (!expenseCategory) {
      res.status(404).json({ message: "Expense category not found" });
      return;
    }

    // Check if expense would exceed category budget
    const totalDailyExpenses = await prisma.dailyExpense.aggregate({
      where: {
        expenseCategoryId,
        userId: Number(userId),
      },
      _sum: {
        amount: true,
      },
    });

    const currentSpent = totalDailyExpenses._sum.amount || 0;
    const newTotal = currentSpent + amount;
    const remaining = expenseCategory.amount - newTotal;

    const dailyExpense = await prisma.dailyExpense.create({
      data: {
        description,
        amount,
        date: new Date(date),
        expenseCategoryId,
        userId: Number(userId),
      },
      include: {
        expenseCategory: true,
      },
    });

    res.status(201).json({
      message: remaining < 0 
        ? `Warning: This expense exceeds the category budget by $${Math.abs(remaining).toFixed(2)}`
        : "Daily expense created successfully",
      data: dailyExpense,
      budgetInfo: {
        categoryBudget: expenseCategory.amount,
        spent: newTotal,
        remaining: remaining,
      },
    });
  } catch (error: any) {
    console.error("Error creating daily expense:", error);
    res.status(500).json({ message: `Error creating daily expense: ${error.message}` });
  }
};

// Get Daily Expenses
export const getDailyExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 10, startDate, endDate, expenseCategoryId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { userId: Number(userId) };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (expenseCategoryId) {
      whereClause.expenseCategoryId = expenseCategoryId;
    }

    const [dailyExpenses, total] = await Promise.all([
      prisma.dailyExpense.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
        include: {
          expenseCategory: {
            select: {
              id: true,
              name: true,
              amount: true,
            },
          },
        },
      }),
      prisma.dailyExpense.count({ where: whereClause }),
    ]);

    // Calculate totals per category
    const expensesByCategory = await prisma.dailyExpense.groupBy({
      by: ['expenseCategoryId'],
      where: whereClause,
      _sum: {
        amount: true,
      },
    });

    res.json({
      data: dailyExpenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      categoryTotals: expensesByCategory,
    });
  } catch (error: any) {
    console.error("Error fetching daily expenses:", error);
    res.status(500).json({ message: `Error fetching daily expenses: ${error.message}` });
  }
};

// Get Daily Expense by ID
export const getDailyExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const dailyExpense = await prisma.dailyExpense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
      include: {
        expenseCategory: {
          select: {
            id: true,
            name: true,
            amount: true,
          },
        },
      },
    });

    if (!dailyExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    res.json({ data: dailyExpense });
  } catch (error: any) {
    console.error("Error fetching daily expense:", error);
    res.status(500).json({ message: `Error fetching daily expense: ${error.message}` });
  }
};

// Update Daily Expense
export const updateDailyExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { description, amount, date, expenseCategoryId } = req.body;

    const existingDailyExpense = await prisma.dailyExpense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
      include: {
        expenseCategory: true,
      },
    });

    if (!existingDailyExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    if (expenseCategoryId) {
      const expenseCategory = await prisma.expenseCategory.findFirst({
        where: {
          id: expenseCategoryId,
          userId: Number(userId),
        },
      });

      if (!expenseCategory) {
        res.status(404).json({ message: "Expense category not found" });
        return;
      }
    }

    const updatedDailyExpense = await prisma.dailyExpense.update({
      where: { id },
      data: {
        description: description || existingDailyExpense.description,
        amount: amount !== undefined ? amount : existingDailyExpense.amount,
        date: date ? new Date(date) : existingDailyExpense.date,
        expenseCategoryId: expenseCategoryId || existingDailyExpense.expenseCategoryId,
      },
      include: {
        expenseCategory: true,
      },
    });

    res.json({
      message: "Daily expense updated successfully",
      data: updatedDailyExpense,
    });
  } catch (error: any) {
    console.error("Error updating daily expense:", error);
    res.status(500).json({ message: `Error updating daily expense: ${error.message}` });
  }
};

// Delete Daily Expense
export const deleteDailyExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existingDailyExpense = await prisma.dailyExpense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingDailyExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    await prisma.dailyExpense.delete({
      where: { id },
    });

    res.json({ message: "Daily expense deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting daily expense:", error);
    res.status(500).json({ message: `Error deleting daily expense: ${error.message}` });
  }
};

// Get Expense Categories with Remaining Amounts
export const getExpenseCategorySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { startDate, endDate } = req.query;

    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { userId: Number(userId) },
    });

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const categorySummaries = await Promise.all(
      expenseCategories.map(async (category) => {
        const spent = await prisma.dailyExpense.aggregate({
          where: {
            expenseCategoryId: category.id,
            userId: Number(userId),
            ...dateFilter,
          },
          _sum: {
            amount: true,
          },
        });

        const spentAmount = spent._sum.amount || 0;
        const remainingAmount = category.amount - spentAmount;

        return {
          id: category.id,
          name: category.name,
          budget: category.amount,
          spent: spentAmount,
          remaining: remainingAmount,
          percentageUsed: ((spentAmount / category.amount) * 100).toFixed(2),
          status: remainingAmount < 0 ? 'overspent' : remainingAmount < category.amount * 0.2 ? 'warning' : 'good',
        };
      })
    );

    res.json({
      data: categorySummaries,
      summary: {
        totalBudget: expenseCategories.reduce((sum, cat) => sum + cat.amount, 0),
        totalSpent: categorySummaries.reduce((sum, cat) => sum + cat.spent, 0),
      },
    });
  } catch (error: any) {
    console.error("Error fetching expense category summary:", error);
    res.status(500).json({ message: `Error fetching expense category summary: ${error.message}` });
  }
};