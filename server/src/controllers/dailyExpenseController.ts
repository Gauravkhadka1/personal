// server/src/controllers/dailyExpenseController.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getNepaliDateDetails, formatNepaliDate } from "../utils/nepaliCalendar";

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
      res.status(400).json({ message: "Amount must be positive number" });
      return;
    }

    const expenseCategory = await prisma.expenseCategory.findFirst({
      where: { id: expenseCategoryId, userId: Number(userId) },
    });

    if (!expenseCategory) {
      res.status(404).json({ message: "Expense category not found" });
      return;
    }

    const totalDailyExpenses = await prisma.dailyExpense.aggregate({
      where: { expenseCategoryId, userId: Number(userId) },
      _sum: { amount: true },
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
      include: { expenseCategory: true },
    });

    // Add Nepali date to response
    const nepaliDate = getNepaliDateDetails(new Date(date));
    
    res.status(201).json({
      message: remaining < 0 
        ? `Warning: This expense exceeds the category budget by $${Math.abs(remaining).toFixed(2)}`
        : "Daily expense created successfully",
      data: {
        ...dailyExpense,
        nepaliDate: nepaliDate ? formatNepaliDate(new Date(date)) : null,
      },
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

// Enhanced getDailyExpenses with grouping by Nepali date and category filtering
export const getDailyExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 1000, expenseCategoryId } = req.query;
    
    const nepaliFilter = (req as any).nepaliFilter;
    const dateWhereClause: any = {};
    
    if (nepaliFilter?.startDate && nepaliFilter?.endDate) {
      dateWhereClause.date = {
        gte: nepaliFilter.startDate,
        lte: nepaliFilter.endDate,
      };
    } else if (nepaliFilter?.startDate) {
      dateWhereClause.date = { gte: nepaliFilter.startDate };
    } else if (nepaliFilter?.endDate) {
      dateWhereClause.date = { lte: nepaliFilter.endDate };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { 
      userId: Number(userId),
      ...dateWhereClause,
    };

    if (expenseCategoryId) {
      whereClause.expenseCategoryId = expenseCategoryId as string;
    }

    const [dailyExpenses, total] = await Promise.all([
      prisma.dailyExpense.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
        include: {
          expenseCategory: {
            select: { id: true, name: true, amount: true },
          },
        },
      }),
      prisma.dailyExpense.count({ where: whereClause }),
    ]);

    // Group expenses by Nepali date
    const groupedByNepaliDate: { [key: string]: { nepaliDate: string; englishDate: string; expenses: any[]; totalAmount: number } } = {};
    
    for (const expense of dailyExpenses) {
      const nepaliDateInfo = getNepaliDateDetails(expense.date);
      const nepaliDateKey = nepaliDateInfo 
        ? `${nepaliDateInfo.year}-${nepaliDateInfo.month}-${nepaliDateInfo.day}`
        : expense.date.toISOString().split('T')[0];
      
      const nepaliDateDisplay = nepaliDateInfo 
        ? formatNepaliDate(expense.date)
        : expense.date.toLocaleDateString();
      
      if (!groupedByNepaliDate[nepaliDateKey]) {
        groupedByNepaliDate[nepaliDateKey] = {
          nepaliDate: nepaliDateDisplay,
          englishDate: expense.date.toISOString().split('T')[0],
          expenses: [],
          totalAmount: 0,
        };
      }
      
      groupedByNepaliDate[nepaliDateKey].expenses.push(expense);
      groupedByNepaliDate[nepaliDateKey].totalAmount += expense.amount;
    }

    // Convert to array and sort by date (most recent first)
    const groupedExpenses = Object.values(groupedByNepaliDate).sort((a, b) => 
      new Date(b.englishDate).getTime() - new Date(a.englishDate).getTime()
    );

    // Calculate totals per category
    const expensesByCategory = await prisma.dailyExpense.groupBy({
      by: ['expenseCategoryId'],
      where: whereClause,
      _sum: { amount: true },
    });

    res.json({
      data: dailyExpenses,
      groupedByNepaliDate: groupedExpenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      categoryTotals: expensesByCategory,
      filter: {
        nepaliYear: nepaliFilter?.nepaliYear,
        nepaliMonth: nepaliFilter?.nepaliMonth,
        nepaliMonthName: nepaliFilter?.nepaliMonthName,
        dateRange: nepaliFilter?.startDate && nepaliFilter?.endDate ? {
          start: nepaliFilter.startDate,
          end: nepaliFilter.endDate,
        } : null,
      },
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
      where: { id, userId: Number(userId) },
      include: {
        expenseCategory: { select: { id: true, name: true, amount: true } },
      },
    });

    if (!dailyExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    const nepaliDate = getNepaliDateDetails(dailyExpense.date);
    
    res.json({ 
      data: {
        ...dailyExpense,
        nepaliDate: nepaliDate ? formatNepaliDate(dailyExpense.date) : null,
      } 
    });
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
      where: { id, userId: Number(userId) },
      include: { expenseCategory: true },
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
        where: { id: expenseCategoryId, userId: Number(userId) },
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
      include: { expenseCategory: true },
    });

    const nepaliDate = getNepaliDateDetails(updatedDailyExpense.date);

    res.json({
      message: "Daily expense updated successfully",
      data: {
        ...updatedDailyExpense,
        nepaliDate: nepaliDate ? formatNepaliDate(updatedDailyExpense.date) : null,
      },
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
      where: { id, userId: Number(userId) },
    });

    if (!existingDailyExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    await prisma.dailyExpense.delete({ where: { id } });
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
    const nepaliFilter = (req as any).nepaliFilter;
    
    const dateFilter: any = {};
    if (nepaliFilter?.startDate && nepaliFilter?.endDate) {
      dateFilter.date = {
        gte: nepaliFilter.startDate,
        lte: nepaliFilter.endDate,
      };
    } else if (nepaliFilter?.startDate) {
      dateFilter.date = { gte: nepaliFilter.startDate };
    } else if (nepaliFilter?.endDate) {
      dateFilter.date = { lte: nepaliFilter.endDate };
    }

    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { userId: Number(userId) },
    });

    const categorySummaries = await Promise.all(
      expenseCategories.map(async (category) => {
        const spent = await prisma.dailyExpense.aggregate({
          where: {
            expenseCategoryId: category.id,
            userId: Number(userId),
            ...dateFilter,
          },
          _sum: { amount: true },
        });

        const spentAmount = spent._sum.amount || 0;
        const remainingAmount = category.amount - spentAmount;
        const percentageUsed = category.amount > 0 ? (spentAmount / category.amount) * 100 : 0;

        let status: 'overspent' | 'warning' | 'good' = 'good';
        if (remainingAmount < 0) {
          status = 'overspent';
        } else if (percentageUsed >= 80) {
          status = 'warning';
        }

        return {
          id: category.id,
          name: category.name,
          budget: category.amount,
          spent: spentAmount,
          remaining: remainingAmount,
          percentageUsed: percentageUsed.toFixed(2),
          status: status,
        };
      })
    );

    const totalBudget = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalSpent = categorySummaries.reduce((sum, cat) => sum + cat.spent, 0);

    res.json({
      data: {
        data: categorySummaries,
        summary: { totalBudget, totalSpent },
      },
      filter: {
        nepaliYear: nepaliFilter?.nepaliYear,
        nepaliMonth: nepaliFilter?.nepaliMonth,
        nepaliMonthName: nepaliFilter?.nepaliMonthName,
        dateRange: nepaliFilter?.startDate && nepaliFilter?.endDate ? {
          start: nepaliFilter.startDate,
          end: nepaliFilter.endDate,
        } : null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching expense category summary:", error);
    res.status(500).json({ message: `Error fetching expense category summary: ${error.message}` });
  }
};