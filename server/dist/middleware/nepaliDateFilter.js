"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableNepaliFilters = exports.buildDateWhereClause = exports.parseNepaliDateFilter = void 0;
const nepaliCalendar_1 = require("../utils/nepaliCalendar");
/**
 * Middleware to parse Nepali year/month filters and convert to English date ranges
 */
const parseNepaliDateFilter = (req, res, next) => {
    try {
        const { nepaliYear, nepaliMonth, startDate, endDate } = req.query;
        // Store filter info on req for later use
        req.nepaliFilter = {
            nepaliYear: nepaliYear ? parseInt(nepaliYear) : undefined,
            nepaliMonth: nepaliMonth ? parseInt(nepaliMonth) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };
        // If Nepali year and month are provided, convert to English date range
        if (req.nepaliFilter.nepaliYear && req.nepaliFilter.nepaliMonth) {
            const year = req.nepaliFilter.nepaliYear;
            const month = req.nepaliFilter.nepaliMonth;
            const monthRange = (0, nepaliCalendar_1.getNepaliMonthRange)(year, month);
            if (!monthRange) {
                res.status(400).json({
                    message: `Invalid Nepali year ${year} or month ${month}. Available years: ${(0, nepaliCalendar_1.getAvailableNepaliYears)().join(', ')}`
                });
                return;
            }
            // Override startDate and endDate with Nepali month range
            req.nepaliFilter.startDate = monthRange.startDate;
            req.nepaliFilter.endDate = monthRange.endDate;
            req.nepaliFilter.nepaliMonthName = monthRange.nepaliMonthName;
        }
        next();
    }
    catch (error) {
        console.error("Error parsing Nepali date filter:", error);
        res.status(500).json({ message: `Error parsing date filter: ${error.message}` });
    }
};
exports.parseNepaliDateFilter = parseNepaliDateFilter;
/**
 * Helper function to build where clause for date filtering
 */
const buildDateWhereClause = (req) => {
    const nepaliFilter = req.nepaliFilter;
    const whereClause = {};
    if ((nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) && (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate)) {
        whereClause.date = {
            gte: nepaliFilter.startDate,
            lte: nepaliFilter.endDate,
        };
    }
    else if (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.startDate) {
        whereClause.date = { gte: nepaliFilter.startDate };
    }
    else if (nepaliFilter === null || nepaliFilter === void 0 ? void 0 : nepaliFilter.endDate) {
        whereClause.date = { lte: nepaliFilter.endDate };
    }
    return whereClause;
};
exports.buildDateWhereClause = buildDateWhereClause;
/**
 * Get available Nepali years and months for dropdowns
 */
const getAvailableNepaliFilters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const years = (0, nepaliCalendar_1.getAvailableNepaliYears)();
        const months = Object.entries(nepaliCalendar_1.NEPALI_MONTH_NAMES).map(([num, name]) => ({
            value: parseInt(num),
            label: name,
        }));
        res.json({
            years,
            months,
        });
    }
    catch (error) {
        console.error("Error getting available Nepali filters:", error);
        res.status(500).json({ message: `Error: ${error.message}` });
    }
});
exports.getAvailableNepaliFilters = getAvailableNepaliFilters;
