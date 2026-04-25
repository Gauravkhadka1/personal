import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== EARNED INCOME CONTROLLERS ====================

export const createEarnedIncome = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, amount } = req.body;

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
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [earnedIncomes, total] = await Promise.all([
      prisma.earnedIncome.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
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
    const { name, amount } = req.body;

    // Check if earned income exists and belongs to user
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

    // Check if earned income exists and belongs to user
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
    const { name, amount } = req.body;

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
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [passiveIncomes, total] = await Promise.all([
      prisma.passiveIncome.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
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
    const { name, amount } = req.body;

    // Check if passive income exists and belongs to user
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

    // Check if passive income exists and belongs to user
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

// ==================== EXPENSE CONTROLLERS ====================

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, amount } = req.body;

    if (!name || amount === undefined) {
      res.status(400).json({ message: "Name and amount are required" });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        name,
        amount,
        userId: Number(userId),
      },
    });

    res.status(201).json({
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error: any) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: `Error creating expense: ${error.message}` });
  }
};

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.count({
        where: { userId: Number(userId) },
      }),
    ]);

    res.json({
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: `Error fetching expenses: ${error.message}` });
  }
};

export const getExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    res.json({ data: expense });
  } catch (error: any) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ message: `Error fetching expense: ${error.message}` });
  }
};

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, amount } = req.body;

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingExpense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({ message: "Amount must be a positive number" });
      return;
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        name: name || existingExpense.name,
        amount: amount !== undefined ? amount : existingExpense.amount,
      },
    });

    res.json({
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error: any) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: `Error updating expense: ${error.message}` });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: Number(userId),
      },
    });

    if (!existingExpense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    await prisma.expense.delete({
      where: { id },
    });

    res.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: `Error deleting expense: ${error.message}` });
  }
};

// Add these after the Liability controllers

// ==================== ASSET CONTROLLERS ====================

export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, value } = req.body;

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
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
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
    const { name, value } = req.body;

    // Check if asset exists and belongs to user
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

    // Check if asset exists and belongs to user
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
    const { name, value } = req.body;

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
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [liabilities, total] = await Promise.all([
      prisma.liability.findMany({
        where: { userId: Number(userId) },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
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
    const { name, value } = req.body;

    // Check if liability exists and belongs to user
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

    // Check if liability exists and belongs to user
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

    const [earnedIncomes, passiveIncomes, expenses, assets, liabilities] = await Promise.all([
      prisma.earnedIncome.findMany({ where: { userId: Number(userId) } }),
      prisma.passiveIncome.findMany({ where: { userId: Number(userId) } }),
      prisma.expense.findMany({ where: { userId: Number(userId) } }),
      prisma.asset.findMany({ where: { userId: Number(userId) } }),
      prisma.liability.findMany({ where: { userId: Number(userId) } }),
    ]);

    const totalEarnedIncome = earnedIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalPassiveIncome = passiveIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
    
    const totalIncome = totalEarnedIncome + totalPassiveIncome;
    const netCashFlow = totalIncome - totalExpenses;
    const netWorth = totalAssets - totalLiabilities;

    res.json({
      summary: {
        totalEarnedIncome,
        totalPassiveIncome,
        totalIncome,
        totalExpenses,
        totalAssets,
        totalLiabilities,
        netCashFlow,
        netWorth,
      },
      details: {
        earnedIncomes,
        passiveIncomes,
        expenses,
        assets,
        liabilities,
      },
    });
  } catch (error: any) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({ message: `Error fetching financial summary: ${error.message}` });
  }
};