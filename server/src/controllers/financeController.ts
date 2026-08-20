// server/src/controllers/financeController.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== EARNED INCOME CONTROLLERS ====================

export const createEarnedIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, amount, date } = req.body;

    if (!name || amount === undefined) {
      res.status(400).json({ message: "Name and amount are required" });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const earnedIncome = await prisma.earnedIncome.create({
      data: {
        name,
        amount,
        userId: Number(userId),
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json({
      message: "Earned income created successfully",
      data: earnedIncome,
    });
  } catch (error: any) {
    console.error("Error creating earned income:", error);
    res.status(500).json({ message: `Error creating earned income: ${error.message}` });
  }
};

export const getEarnedIncomes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 100 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [earnedIncomes, total] = await Promise.all([
      prisma.earnedIncome.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
      }),
      prisma.earnedIncome.count({
        where: { userId: Number(userId) },
      }),
    ]);

    res.json({
      data: earnedIncomes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching earned incomes:", error);
    res.status(500).json({ message: `Error fetching earned incomes: ${error.message}` });
  }
};

export const getEarnedIncomeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const earnedIncome = await prisma.earnedIncome.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!earnedIncome) {
      res.status(404).json({ message: "Earned income not found" });
      return;
    }

    res.json({ data: earnedIncome });
  } catch (error: any) {
    console.error("Error fetching earned income:", error);
    res.status(500).json({ message: `Error fetching earned income: ${error.message}` });
  }
};

export const updateEarnedIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, amount, date } = req.body;

    const existingIncome = await prisma.earnedIncome.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingIncome) {
      res.status(404).json({ message: "Earned income not found" });
      return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const updatedIncome = await prisma.earnedIncome.update({
      where: { id },
      data: {
        name: name || existingIncome.name,
        amount: amount !== undefined ? amount : existingIncome.amount,
        date: date ? new Date(date) : existingIncome.date,
      },
    });

    res.json({
      message: "Earned income updated successfully",
      data: updatedIncome,
    });
  } catch (error: any) {
    console.error("Error updating earned income:", error);
    res.status(500).json({ message: `Error updating earned income: ${error.message}` });
  }
};

export const deleteEarnedIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existingIncome = await prisma.earnedIncome.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingIncome) {
      res.status(404).json({ message: "Earned income not found" });
      return;
    }

    await prisma.earnedIncome.delete({
      where: { id },
    });

    res.json({ message: "Earned income deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting earned income:", error);
    res.status(500).json({ message: `Error deleting earned income: ${error.message}` });
  }
};

// ==================== PASSIVE INCOME CONTROLLERS ====================

export const createPassiveIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, amount, date } = req.body;

    if (!name || amount === undefined) {
      res.status(400).json({ message: "Name and amount are required" });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const passiveIncome = await prisma.passiveIncome.create({
      data: {
        name,
        amount,
        userId: Number(userId),
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json({
      message: "Passive income created successfully",
      data: passiveIncome,
    });
  } catch (error: any) {
    console.error("Error creating passive income:", error);
    res.status(500).json({ message: `Error creating passive income: ${error.message}` });
  }
};

export const getPassiveIncomes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 100 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [passiveIncomes, total] = await Promise.all([
      prisma.passiveIncome.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
      }),
      prisma.passiveIncome.count({
        where: { userId: Number(userId) },
      }),
    ]);

    res.json({
      data: passiveIncomes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching passive incomes:", error);
    res.status(500).json({ message: `Error fetching passive incomes: ${error.message}` });
  }
};

export const getPassiveIncomeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const passiveIncome = await prisma.passiveIncome.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!passiveIncome) {
      res.status(404).json({ message: "Passive income not found" });
      return;
    }

    res.json({ data: passiveIncome });
  } catch (error: any) {
    console.error("Error fetching passive income:", error);
    res.status(500).json({ message: `Error fetching passive income: ${error.message}` });
  }
};

export const updatePassiveIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, amount, date } = req.body;

    const existingIncome = await prisma.passiveIncome.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingIncome) {
      res.status(404).json({ message: "Passive income not found" });
      return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const updatedIncome = await prisma.passiveIncome.update({
      where: { id },
      data: {
        name: name || existingIncome.name,
        amount: amount !== undefined ? amount : existingIncome.amount,
        date: date ? new Date(date) : existingIncome.date,
      },
    });

    res.json({
      message: "Passive income updated successfully",
      data: updatedIncome,
    });
  } catch (error: any) {
    console.error("Error updating passive income:", error);
    res.status(500).json({ message: `Error updating passive income: ${error.message}` });
  }
};

export const deletePassiveIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existingIncome = await prisma.passiveIncome.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingIncome) {
      res.status(404).json({ message: "Passive income not found" });
      return;
    }

    await prisma.passiveIncome.delete({
      where: { id },
    });

    res.json({ message: "Passive income deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting passive income:", error);
    res.status(500).json({ message: `Error deleting passive income: ${error.message}` });
  }
};

// ==================== EXPENSE CATEGORY CONTROLLERS ====================

export const createExpenseCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, amount, date } = req.body;

    if (!name || amount === undefined) {
      res.status(400).json({ message: "Name and amount are required" });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const expenseCategory = await prisma.expenseCategory.create({
      data: {
        name,
        amount,
        userId: Number(userId),
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json({
      message: "Expense category created successfully",
      data: expenseCategory,
    });
  } catch (error: any) {
    console.error("Error creating expense category:", error);
    res.status(500).json({ message: `Error creating expense category: ${error.message}` });
  }
};

// Replace your existing getExpenseCategories with this enhanced version
export const getExpenseCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 100 } = req.query;
    
    // Get date filter from middleware
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

    // Get expense categories with their daily expenses
    const expenseCategories = await prisma.expenseCategory.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { amount: 'desc' },
      include: {
        dailyExpenses: {
          where: {
            userId: Number(userId),
            ...dateWhereClause,
          },
          select: {
            amount: true,
          },
        },
      },
    });

    const total = await prisma.expenseCategory.count({ where: whereClause });

    // Calculate spent and remaining for each category
    const categoriesWithBudget = expenseCategories.map(category => {
      const spent = category.dailyExpenses.reduce((sum, de) => sum + de.amount, 0);
      const remaining = category.amount - spent;
      const percentageUsed = category.amount > 0 ? (spent / category.amount) * 100 : 0;
      
      let status: 'overspent' | 'warning' | 'good' = 'good';
      if (remaining < 0) {
        status = 'overspent';
      } else if (percentageUsed >= 80) {
        status = 'warning';
      }

      return {
        id: category.id,
        name: category.name,
        budget: category.amount,
        spent,
        remaining,
        percentageUsed: parseFloat(percentageUsed.toFixed(2)),
        status,
        date: category.date,
      };
    });

    res.json({
      data: categoriesWithBudget,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
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
    console.error("Error fetching expense categories:", error);
    res.status(500).json({ message: `Error fetching expense categories: ${error.message}` });
  }
};

export const getExpenseCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const expenseCategory = await prisma.expenseCategory.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!expenseCategory) {
      res.status(404).json({ message: "Expense category not found" });
      return;
    }

    res.json({ data: expenseCategory });
  } catch (error: any) {
    console.error("Error fetching expense category:", error);
    res.status(500).json({ message: `Error fetching expense category: ${error.message}` });
  }
};

export const updateExpenseCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, amount, date } = req.body;

    const existingExpenseCategory = await prisma.expenseCategory.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingExpenseCategory) {
      res.status(404).json({ message: "Expense category not found" });
      return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const updatedExpenseCategory = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name || existingExpenseCategory.name,
        amount: amount !== undefined ? amount : existingExpenseCategory.amount,
        date: date ? new Date(date) : existingExpenseCategory.date,
      },
    });

    res.json({
      message: "Expense category updated successfully",
      data: updatedExpenseCategory,
    });
  } catch (error: any) {
    console.error("Error updating expense category:", error);
    res.status(500).json({ message: `Error updating expense category: ${error.message}` });
  }
};

export const deleteExpenseCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existingExpenseCategory = await prisma.expenseCategory.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingExpenseCategory) {
      res.status(404).json({ message: "Expense category not found" });
      return;
    }

    await prisma.expenseCategory.delete({
      where: { id },
    });

    res.json({ message: "Expense category deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting expense category:", error);
    res.status(500).json({ message: `Error deleting expense category: ${error.message}` });
  }
};

// ==================== ASSET CONTROLLERS ====================

export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, value, date } = req.body;

    if (!name || value === undefined) {
      res.status(400).json({ message: "Name and value are required" });
      return;
    }

    if (typeof value !== 'number' || value <= 0) {
      res.status(400).json({ message: "Value must be a positive number" });
      return;
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        value,
        userId: Number(userId),
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json({
      message: "Asset created successfully",
      data: asset,
    });
  } catch (error: any) {
    console.error("Error creating asset:", error);
    res.status(500).json({ message: `Error creating asset: ${error.message}` });
  }
};

export const getAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 100 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
      }),
      prisma.asset.count({
        where: { userId: Number(userId) },
      }),
    ]);

    res.json({
      data: assets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: `Error fetching assets: ${error.message}` });
  }
};

export const getAssetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!asset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    res.json({ data: asset });
  } catch (error: any) {
    console.error("Error fetching asset:", error);
    res.status(500).json({ message: `Error fetching asset: ${error.message}` });
  }
};

export const updateAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, value, date } = req.body;

    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingAsset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
      res.status(400).json({ message: "Value must be a positive number" });
      return;
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: name || existingAsset.name,
        value: value !== undefined ? value : existingAsset.value,
        date: date ? new Date(date) : existingAsset.date,
      },
    });

    res.json({
      message: "Asset updated successfully",
      data: updatedAsset,
    });
  } catch (error: any) {
    console.error("Error updating asset:", error);
    res.status(500).json({ message: `Error updating asset: ${error.message}` });
  }
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingAsset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    await prisma.asset.delete({
      where: { id },
    });

    res.json({ message: "Asset deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ message: `Error deleting asset: ${error.message}` });
  }
};

// ==================== LIABILITY CONTROLLERS ====================

export const createLiability = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, value, date } = req.body;

    if (!name || value === undefined) {
      res.status(400).json({ message: "Name and value are required" });
      return;
    }

    if (typeof value !== 'number' || value <= 0) {
      res.status(400).json({ message: "Value must be a positive number" });
      return;
    }

    const liability = await prisma.liability.create({
      data: {
        name,
        value,
        userId: Number(userId),
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json({
      message: "Liability created successfully",
      data: liability,
    });
  } catch (error: any) {
    console.error("Error creating liability:", error);
    res.status(500).json({ message: `Error creating liability: ${error.message}` });
  }
};

export const getLiabilities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 100 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [liabilities, total] = await Promise.all([
      prisma.liability.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
      }),
      prisma.liability.count({
        where: { userId: Number(userId) },
      }),
    ]);

    res.json({
      data: liabilities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching liabilities:", error);
    res.status(500).json({ message: `Error fetching liabilities: ${error.message}` });
  }
};

export const getLiabilityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const liability = await prisma.liability.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!liability) {
      res.status(404).json({ message: "Liability not found" });
      return;
    }

    res.json({ data: liability });
  } catch (error: any) {
    console.error("Error fetching liability:", error);
    res.status(500).json({ message: `Error fetching liability: ${error.message}` });
  }
};

export const updateLiability = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, value, date } = req.body;

    const existingLiability = await prisma.liability.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingLiability) {
      res.status(404).json({ message: "Liability not found" });
      return;
    }

    if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
      res.status(400).json({ message: "Value must be a positive number" });
      return;
    }

    const updatedLiability = await prisma.liability.update({
      where: { id },
      data: {
        name: name || existingLiability.name,
        value: value !== undefined ? value : existingLiability.value,
        date: date ? new Date(date) : existingLiability.date,
      },
    });

    res.json({
      message: "Liability updated successfully",
      data: updatedLiability,
    });
  } catch (error: any) {
    console.error("Error updating liability:", error);
    res.status(500).json({ message: `Error updating liability: ${error.message}` });
  }
};

export const deleteLiability = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existingLiability = await prisma.liability.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingLiability) {
      res.status(404).json({ message: "Liability not found" });
      return;
    }

    await prisma.liability.delete({
      where: { id },
    });

    res.json({ message: "Liability deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting liability:", error);
    res.status(500).json({ message: `Error deleting liability: ${error.message}` });
  }
};

// ==================== SUMMARY CONTROLLER ====================




export const getFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const nepaliFilter = (req as any).nepaliFilter;
    
    // Build date filter using the 'date' field
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

    // Get all financial data
    const [earnedIncomes, passiveIncomes, expenseCategories, assets, liabilities, dailyExpenses] = await Promise.all([
      prisma.earnedIncome.findMany({ 
        where: { 
          userId: Number(userId),
          ...dateWhereClause,
        } 
      }),
      prisma.passiveIncome.findMany({ 
        where: { 
          userId: Number(userId),
          ...dateWhereClause,
        } 
      }),
      prisma.expenseCategory.findMany({ 
        where: { 
          userId: Number(userId),
          ...dateWhereClause,
        } 
      }),
      prisma.asset.findMany({ 
        where: { 
          userId: Number(userId),
          ...dateWhereClause,
        } 
      }),
      prisma.liability.findMany({ 
        where: { 
          userId: Number(userId),
          ...dateWhereClause,
        } 
      }),
      // Add daily expenses to calculate actual spent amount
      prisma.dailyExpense.findMany({
        where: {
          userId: Number(userId),
          ...dateWhereClause,
        },
        select: {
          amount: true,
        }
      }),
    ]);

    const totalEarnedIncome = earnedIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalPassiveIncome = passiveIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseCategories.reduce((sum, item) => sum + item.amount, 0);
    const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
    
    const totalIncome = totalEarnedIncome + totalPassiveIncome;
    const netCashFlow = totalIncome - totalExpenses;
    const netWorth = totalAssets - totalLiabilities;

    // Calculate total daily expenses (actual spent money)
    const totalDailyExpenses = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate current cash (Total Income - Actual Daily Expenses)
    const currentCash = totalIncome - totalDailyExpenses;

    res.json({
      data: {
        filter: {
          nepaliYear: nepaliFilter?.nepaliYear,
          nepaliMonth: nepaliFilter?.nepaliMonth,
          nepaliMonthName: nepaliFilter?.nepaliMonthName,
          dateRange: nepaliFilter?.startDate && nepaliFilter?.endDate ? {
            start: nepaliFilter.startDate,
            end: nepaliFilter.endDate,
          } : null,
        },
        summary: {
          totalEarnedIncome,
          totalPassiveIncome,
          totalIncome,
          totalExpenses, // This is category budgets
          totalAssets,
          totalLiabilities,
          netCashFlow,
          netWorth,
          currentCash, // This is income - actual daily expenses
          totalDailyExpenses, // Add this to show actual spent amount
        },
        details: {
          earnedIncomes,
          passiveIncomes,
          expenseCategories,
          assets,
          liabilities,
        },
      }
    });
  } catch (error: any) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({ message: `Error fetching financial summary: ${error.message}` });
  }
};