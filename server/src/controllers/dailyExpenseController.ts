import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get start and end of current month
const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startOfMonth, endOfMonth };
};

// Helper function to get date range for a specific month
const getMonthRange = (year: number, month: number) => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  return { startOfMonth, endOfMonth };
};

// ==================== DAILY EXPENSE CONTROLLERS ====================

// Create Daily Expense
export const createDailyExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, amount, category, date } = req.body;

    if (!name || !amount || !category) {
      res.status(400).json({ message: "Name, amount, and category are required" });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    // Verify category exists (optional - can also allow new categories)
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: { name: category, userId: Number(userId) }
    });

    if (!existingCategory) {
      // Optionally auto-create category or just proceed
      await prisma.expenseCategory.create({
        data: {
          name: category,
          userId: Number(userId)
        }
      });
    }

    const dailyExpense = await prisma.dailyExpense.create({
      data: {
        name,
        amount,
        category,
        date: date ? new Date(date) : new Date(),
        userId: Number(userId),
      },
    });

    // Calculate remaining amount for this category in current month
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const monthlyExpenses = await prisma.dailyExpense.aggregate({
      where: {
        userId: Number(userId),
        category: category,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get budget limit for this category
    const budgetSetting = await prisma.budgetSetting.findFirst({
      where: {
        userId: Number(userId),
        category: category,
      },
    });

    const totalSpent = monthlyExpenses._sum.amount || 0;
    const budgetLimit = budgetSetting?.budgetLimit || 0;
    const remaining = budgetLimit - totalSpent;

    res.status(201).json({
      message: "Daily expense created successfully",
      data: dailyExpense,
      remainingAmount: remaining,
      totalSpentThisMonth: totalSpent,
      budgetLimit: budgetLimit,
    });
  } catch (error: any) {
    console.error("Error creating daily expense:", error);
    res.status(500).json({ message: `Error creating daily expense: ${error.message}` });
  }
};

// Get All Daily Expenses with pagination and filtering
export const getDailyExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 10, category, startDate, endDate, month, year } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    let whereClause: any = { userId: Number(userId) };
    
    if (category) {
      whereClause.category = category as string;
    }
    
    // Date filtering
    if (month !== undefined && year !== undefined) {
      const { startOfMonth, endOfMonth } = getMonthRange(
        parseInt(year as string), 
        parseInt(month as string)
      );
      whereClause.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    const [dailyExpenses, total] = await Promise.all([
      prisma.dailyExpense.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
      }),
      prisma.dailyExpense.count({
        where: whereClause,
      }),
    ]);

    // Calculate remaining amounts for each category
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const categories = [...new Set(dailyExpenses.map(e => e.category))];
    
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const monthlyExpenses = await prisma.dailyExpense.aggregate({
          where: {
            userId: Number(userId),
            category: cat,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });
        
        const budgetSetting = await prisma.budgetSetting.findFirst({
          where: {
            userId: Number(userId),
            category: cat,
          },
        });
        
        const totalSpent = monthlyExpenses._sum.amount || 0;
        const budgetLimit = budgetSetting?.budgetLimit || 0;
        const remaining = budgetLimit - totalSpent;
        
        return {
          category: cat,
          totalSpent,
          budgetLimit,
          remaining,
        };
      })
    );

    res.json({
      data: dailyExpenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      categoryStats,
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
    });

    if (!dailyExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    // Get remaining amount for this category
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const monthlyExpenses = await prisma.dailyExpense.aggregate({
      where: {
        userId: Number(userId),
        category: dailyExpense.category,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    const budgetSetting = await prisma.budgetSetting.findFirst({
      where: {
        userId: Number(userId),
        category: dailyExpense.category,
      },
    });
    
    const totalSpent = monthlyExpenses._sum.amount || 0;
    const budgetLimit = budgetSetting?.budgetLimit || 0;
    const remaining = budgetLimit - totalSpent;

    res.json({ 
      data: dailyExpense,
      remainingAmount: remaining,
      totalSpentThisMonth: totalSpent,
      budgetLimit: budgetLimit,
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
    const { name, amount, category, date } = req.body;

    // Check if daily expense exists and belongs to user
    const existingExpense = await prisma.dailyExpense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const updatedExpense = await prisma.dailyExpense.update({
      where: { id },
      data: {
        name: name || existingExpense.name,
        amount: amount !== undefined ? amount : existingExpense.amount,
        category: category || existingExpense.category,
        date: date ? new Date(date) : existingExpense.date,
      },
    });

    // Calculate updated remaining amount
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const monthlyExpenses = await prisma.dailyExpense.aggregate({
      where: {
        userId: Number(userId),
        category: updatedExpense.category,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    const budgetSetting = await prisma.budgetSetting.findFirst({
      where: {
        userId: Number(userId),
        category: updatedExpense.category,
      },
    });
    
    const totalSpent = monthlyExpenses._sum.amount || 0;
    const budgetLimit = budgetSetting?.budgetLimit || 0;
    const remaining = budgetLimit - totalSpent;

    res.json({
      message: "Daily expense updated successfully",
      data: updatedExpense,
      remainingAmount: remaining,
      totalSpentThisMonth: totalSpent,
      budgetLimit: budgetLimit,
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

    // Check if daily expense exists and belongs to user
    const existingExpense = await prisma.dailyExpense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingExpense) {
      res.status(404).json({ message: "Daily expense not found" });
      return;
    }

    const category = existingExpense.category;
    
    await prisma.dailyExpense.delete({
      where: { id },
    });

    // Calculate remaining amount after deletion
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const monthlyExpenses = await prisma.dailyExpense.aggregate({
      where: {
        userId: Number(userId),
        category: category,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    const budgetSetting = await prisma.budgetSetting.findFirst({
      where: {
        userId: Number(userId),
        category: category,
      },
    });
    
    const totalSpent = monthlyExpenses._sum.amount || 0;
    const budgetLimit = budgetSetting?.budgetLimit || 0;
    const remaining = budgetLimit - totalSpent;

    res.json({ 
      message: "Daily expense deleted successfully",
      remainingAmount: remaining,
      totalSpentThisMonth: totalSpent,
      budgetLimit: budgetLimit,
    });
  } catch (error: any) {
    console.error("Error deleting daily expense:", error);
    res.status(500).json({ message: `Error deleting daily expense: ${error.message}` });
  }
};

// Get categories for dropdown (from Expense model)
export const getExpenseCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    
    // Get categories from Expense model
    const expenses = await prisma.expense.findMany({
      where: { userId: Number(userId) },
      select: { name: true, id: true },
      distinct: ['name'],
    });
    
    // Also get custom categories from ExpenseCategory model
    const customCategories = await prisma.expenseCategory.findMany({
      where: { 
        OR: [
          { userId: Number(userId) },
          { userId: null } // Global categories
        ]
      },
      select: { name: true, id: true, color: true, icon: true },
    });
    
    // Combine unique categories
    const allCategories = [
      ...expenses.map(e => ({ name: e.name, id: e.id, source: 'expense' })),
      ...customCategories.map(c => ({ name: c.name, id: c.id, source: 'custom', color: c.color, icon: c.icon }))
    ];
    
    // Remove duplicates by name
    const uniqueCategories = Array.from(
      new Map(allCategories.map(cat => [cat.name, cat])).values()
    );
    
    res.json({
      categories: uniqueCategories,
      total: uniqueCategories.length,
    });
  } catch (error: any) {
    console.error("Error fetching expense categories:", error);
    res.status(500).json({ message: `Error fetching expense categories: ${error.message}` });
  }
};

// Get remaining amount for a specific category
export const getRemainingAmount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { category } = req.params;
    const { month, year } = req.query;
    
    let startOfMonth: Date, endOfMonth: Date;
    
    if (month !== undefined && year !== undefined) {
      const result = getMonthRange(parseInt(year as string), parseInt(month as string));
      startOfMonth = result.startOfMonth;
      endOfMonth = result.endOfMonth;
    } else {
      const result = getCurrentMonthRange();
      startOfMonth = result.startOfMonth;
      endOfMonth = result.endOfMonth;
    }
    
    // Get total spent in this category for the month
    const monthlyExpenses = await prisma.dailyExpense.aggregate({
      where: {
        userId: Number(userId),
        category: category as string,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    // Get budget limit for this category
    const budgetSetting = await prisma.budgetSetting.findFirst({
      where: {
        userId: Number(userId),
        category: category as string,
      },
    });
    
    const totalSpent = monthlyExpenses._sum.amount || 0;
    const budgetLimit = budgetSetting?.budgetLimit || 0;
    const remaining = budgetLimit - totalSpent;
    const percentageUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
    
    res.json({
      category,
      totalSpent,
      budgetLimit,
      remaining,
      percentageUsed,
      startDate: startOfMonth,
      endDate: endOfMonth,
    });
  } catch (error: any) {
    console.error("Error fetching remaining amount:", error);
    res.status(500).json({ message: `Error fetching remaining amount: ${error.message}` });
  }
};

// Get summary for all categories (dashboard view)
export const getAllRemainingAmounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    
    // Get all unique categories from user's daily expenses and expense categories
    const dailyExpensesCategories = await prisma.dailyExpense.findMany({
      where: { userId: Number(userId) },
      select: { category: true },
      distinct: ['category'],
    });
    
    const expenseCategories = await prisma.expense.findMany({
      where: { userId: Number(userId) },
      select: { name: true },
      distinct: ['name'],
    });
    
    const customCategories = await prisma.expenseCategory.findMany({
      where: { 
        OR: [
          { userId: Number(userId) },
          { userId: null }
        ]
      },
      select: { name: true },
    });
    
    // Combine all unique categories
    const categoryNames = new Set<string>();
    dailyExpensesCategories.forEach(c => categoryNames.add(c.category));
    expenseCategories.forEach(c => categoryNames.add(c.name));
    customCategories.forEach(c => categoryNames.add(c.name));
    
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    
    // Get stats for each category
    const categoryStats = await Promise.all(
      Array.from(categoryNames).map(async (category) => {
        const monthlyExpenses = await prisma.dailyExpense.aggregate({
          where: {
            userId: Number(userId),
            category: category,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });
        
        const budgetSetting = await prisma.budgetSetting.findFirst({
          where: {
            userId: Number(userId),
            category: category,
          },
        });
        
        const totalSpent = monthlyExpenses._sum.amount || 0;
        const budgetLimit = budgetSetting?.budgetLimit || 0;
        const remaining = budgetLimit - totalSpent;
        const percentageUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
        
        // Get recent expenses for this category
        const recentExpenses = await prisma.dailyExpense.findMany({
          where: {
            userId: Number(userId),
            category: category,
          },
          orderBy: { date: 'desc' },
          take: 5,
        });
        
        return {
          category,
          totalSpent,
          budgetLimit,
          remaining,
          percentageUsed,
          recentExpenses,
        };
      })
    );
    
    // Calculate overall stats
    const totalBudget = categoryStats.reduce((sum, stat) => sum + stat.budgetLimit, 0);
    const totalSpent = categoryStats.reduce((sum, stat) => sum + stat.totalSpent, 0);
    const totalRemaining = totalBudget - totalSpent;
    
    res.json({
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        averagePercentageUsed: categoryStats.length > 0 
          ? categoryStats.reduce((sum, stat) => sum + stat.percentageUsed, 0) / categoryStats.length 
          : 0,
      },
      categories: categoryStats,
    });
  } catch (error: any) {
    console.error("Error fetching all remaining amounts:", error);
    res.status(500).json({ message: `Error fetching all remaining amounts: ${error.message}` });
  }
};

// ==================== BUDGET SETTINGS CONTROLLERS ====================

// Create or update budget setting
export const setBudgetLimit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { category, budgetLimit } = req.body;
    
    if (!category || budgetLimit === undefined) {
      res.status(400).json({ message: "Category and budget limit are required" });
      return;
    }
    
    if (typeof budgetLimit !== 'number' || budgetLimit < 0) {
      res.status(400).json({ message: "Budget limit must be a non-negative number" });
      return;
    }
    
    const budgetSetting = await prisma.budgetSetting.upsert({
      where: {
        category: category,
      },
      update: {
        budgetLimit,
      },
      create: {
        category,
        budgetLimit,
        userId: Number(userId),
      },
    });
    
    res.json({
      message: "Budget limit set successfully",
      data: budgetSetting,
    });
  } catch (error: any) {
    console.error("Error setting budget limit:", error);
    res.status(500).json({ message: `Error setting budget limit: ${error.message}` });
  }
};

// Get budget settings for user
export const getBudgetSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    
    const budgetSettings = await prisma.budgetSetting.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      data: budgetSettings,
      total: budgetSettings.length,
    });
  } catch (error: any) {
    console.error("Error fetching budget settings:", error);
    res.status(500).json({ message: `Error fetching budget settings: ${error.message}` });
  }
};

// Delete budget setting
export const deleteBudgetSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { category } = req.params;
    
    const budgetSetting = await prisma.budgetSetting.findFirst({
      where: {
        category,
        userId: Number(userId),
      },
    });
    
    if (!budgetSetting) {
      res.status(404).json({ message: "Budget setting not found" });
      return;
    }
    
    await prisma.budgetSetting.delete({
      where: { id: budgetSetting.id },
    });
    
    res.json({ message: "Budget setting deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting budget setting:", error);
    res.status(500).json({ message: `Error deleting budget setting: ${error.message}` });
  }
};