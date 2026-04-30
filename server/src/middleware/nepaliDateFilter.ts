import { Request, Response, NextFunction } from "express";
import { 
  getNepaliMonthRange, 
  getAvailableNepaliYears,
  NEPALI_MONTH_NAMES 
} from "../utils/nepaliCalendar";

export interface NepaliFilterQuery {
  nepaliYear?: number;
  nepaliMonth?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Middleware to parse Nepali year/month filters and convert to English date ranges
 */
export const parseNepaliDateFilter = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nepaliYear, nepaliMonth, startDate, endDate } = req.query;
    
    // Store filter info on req for later use
    (req as any).nepaliFilter = {
      nepaliYear: nepaliYear ? parseInt(nepaliYear as string) : undefined,
      nepaliMonth: nepaliMonth ? parseInt(nepaliMonth as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };
    
    // If Nepali year and month are provided, convert to English date range
    if ((req as any).nepaliFilter.nepaliYear && (req as any).nepaliFilter.nepaliMonth) {
      const year = (req as any).nepaliFilter.nepaliYear;
      const month = (req as any).nepaliFilter.nepaliMonth;
      
      const monthRange = getNepaliMonthRange(year, month);
      
      if (!monthRange) {
        res.status(400).json({ 
          message: `Invalid Nepali year ${year} or month ${month}. Available years: ${getAvailableNepaliYears().join(', ')}` 
        });
        return;
      }
      
      // Override startDate and endDate with Nepali month range
      (req as any).nepaliFilter.startDate = monthRange.startDate;
      (req as any).nepaliFilter.endDate = monthRange.endDate;
      (req as any).nepaliFilter.nepaliMonthName = monthRange.nepaliMonthName;
    }
    
    next();
  } catch (error: any) {
    console.error("Error parsing Nepali date filter:", error);
    res.status(500).json({ message: `Error parsing date filter: ${error.message}` });
  }
};

/**
 * Helper function to build where clause for date filtering
 */
export const buildDateWhereClause = (req: Request): any => {
  const nepaliFilter = (req as any).nepaliFilter;
  const whereClause: any = {};
  
  if (nepaliFilter?.startDate && nepaliFilter?.endDate) {
    whereClause.date = {
      gte: nepaliFilter.startDate,
      lte: nepaliFilter.endDate,
    };
  } else if (nepaliFilter?.startDate) {
    whereClause.date = { gte: nepaliFilter.startDate };
  } else if (nepaliFilter?.endDate) {
    whereClause.date = { lte: nepaliFilter.endDate };
  }
  
  return whereClause;
};

/**
 * Get available Nepali years and months for dropdowns
 */
export const getAvailableNepaliFilters = async (req: Request, res: Response) => {
  try {
    const years = getAvailableNepaliYears();
    const months = Object.entries(NEPALI_MONTH_NAMES).map(([num, name]) => ({
      value: parseInt(num),
      label: name,
    }));
    
    res.json({
      years,
      months,
    });
  } catch (error: any) {
    console.error("Error getting available Nepali filters:", error);
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};