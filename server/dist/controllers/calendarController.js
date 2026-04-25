"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const nepaliCalendar_1 = require("../utils/nepaliCalendar");
class CalendarController {
    constructor() {
        /**
         * Get all months for a specific Nepali year
         *
         *
         */
        this.getFullCalendar = (req, res) => {
            try {
                const availableYears = (0, nepaliCalendar_1.getAvailableNepaliYears)();
                const currentNepaliYear = (0, nepaliCalendar_1.getCurrentNepaliYear)();
                // Get data for all available years
                const yearsData = availableYears.map(nepaliYear => {
                    const months = (0, nepaliCalendar_1.getNepaliYearMonths)(nepaliYear);
                    const hasCustomData = (0, nepaliCalendar_1.hasCustomYearData)(nepaliYear);
                    return {
                        nepaliYear,
                        hasCustomData,
                        isCurrentYear: nepaliYear === currentNepaliYear,
                        months: months.map(month => ({
                            nepaliMonth: month.nepaliMonth,
                            nepaliMonthName: month.nepaliMonthName,
                            startDate: (0, nepaliCalendar_1.formatDate)(month.startDate),
                            endDate: (0, nepaliCalendar_1.formatDate)(month.endDate),
                            days: Math.floor((month.endDate.getTime() - month.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        }))
                    };
                });
                // Create month reference for easy lookup
                const monthReference = Object.entries(nepaliCalendar_1.NEPALI_MONTH_NAMES).map(([key, name]) => ({
                    monthNumber: parseInt(key),
                    monthName: name,
                    monthNameNepali: name // You can add Nepali names here if needed
                }));
                res.json({
                    success: true,
                    data: {
                        summary: {
                            totalYears: availableYears.length,
                            currentNepaliYear,
                            availableYearRange: {
                                start: Math.min(...availableYears),
                                end: Math.max(...availableYears)
                            }
                        },
                        years: yearsData,
                        monthReference: monthReference,
                        // Also include the multiple years endpoint reference for convenience
                        endpoints: {
                            singleYear: '/api/calendar/years/{year}',
                            multipleYears: '/api/calendar/years/multiple?years={year1,year2,year3}',
                            specificMonth: '/api/calendar/years/{year}/months/{month}',
                            currentYear: '/api/calendar/current'
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error in getFullCalendar:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch complete calendar data'
                });
            }
        };
        this.getYearMonths = (req, res) => {
            try {
                const { year } = req.params;
                const nepaliYear = parseInt(year);
                if (isNaN(nepaliYear)) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid year parameter. Year must be a number.'
                    });
                    return;
                }
                const months = (0, nepaliCalendar_1.getNepaliYearMonths)(nepaliYear);
                const hasCustomData = (0, nepaliCalendar_1.hasCustomYearData)(nepaliYear);
                res.json({
                    success: true,
                    data: {
                        nepaliYear,
                        hasCustomData,
                        months: months.map(month => (Object.assign(Object.assign({}, month), { startDate: (0, nepaliCalendar_1.formatDate)(month.startDate), endDate: (0, nepaliCalendar_1.formatDate)(month.endDate) })))
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch year months data'
                });
            }
        };
        /**
         * Get specific month range for a Nepali year
         */
        this.getMonthRange = (req, res) => {
            try {
                const { year, month } = req.params;
                const nepaliYear = parseInt(year);
                const nepaliMonth = parseInt(month);
                if (isNaN(nepaliYear) || isNaN(nepaliMonth)) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid year or month parameters. Both must be numbers.'
                    });
                    return;
                }
                if (nepaliMonth < 1 || nepaliMonth > 12) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid month. Month must be between 1 and 12.'
                    });
                    return;
                }
                const monthRange = (0, nepaliCalendar_1.getNepaliMonthRange)(nepaliYear, nepaliMonth);
                if (!monthRange) {
                    res.status(404).json({
                        success: false,
                        error: 'Month data not found for the specified year and month.'
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: Object.assign(Object.assign({}, monthRange), { startDate: (0, nepaliCalendar_1.formatDate)(monthRange.startDate), endDate: (0, nepaliCalendar_1.formatDate)(monthRange.endDate) })
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch month range data'
                });
            }
        };
        /**
         * Get current Nepali year data
         */
        this.getCurrentYear = (req, res) => {
            try {
                const currentNepaliYear = (0, nepaliCalendar_1.getCurrentNepaliYear)();
                const months = (0, nepaliCalendar_1.getNepaliYearMonths)(currentNepaliYear);
                const hasCustomData = (0, nepaliCalendar_1.hasCustomYearData)(currentNepaliYear);
                res.json({
                    success: true,
                    data: {
                        nepaliYear: currentNepaliYear,
                        hasCustomData,
                        months: months.map(month => (Object.assign(Object.assign({}, month), { startDate: (0, nepaliCalendar_1.formatDate)(month.startDate), endDate: (0, nepaliCalendar_1.formatDate)(month.endDate) })))
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch current year data'
                });
            }
        };
        /**
         * Get available Nepali years with data
         */
        this.getAvailableYears = (req, res) => {
            try {
                const availableYears = (0, nepaliCalendar_1.getAvailableNepaliYears)();
                const currentNepaliYear = (0, nepaliCalendar_1.getCurrentNepaliYear)();
                const yearsWithData = availableYears.map(year => ({
                    year,
                    hasCustomData: (0, nepaliCalendar_1.hasCustomYearData)(year),
                    isCurrentYear: year === currentNepaliYear
                }));
                res.json({
                    success: true,
                    data: {
                        availableYears: yearsWithData,
                        totalYears: availableYears.length,
                        currentNepaliYear,
                        yearRange: {
                            start: Math.min(...availableYears),
                            end: Math.max(...availableYears)
                        }
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch available years'
                });
            }
        };
        /**
         * Get multiple years data at once
         */
        this.getMultipleYears = (req, res) => {
            try {
                const { years } = req.query;
                if (!years) {
                    res.status(400).json({
                        success: false,
                        error: 'Years parameter is required. Use comma-separated values: ?years=2080,2081,2082'
                    });
                    return;
                }
                const yearArray = years.split(',').map(y => parseInt(y.trim()));
                if (yearArray.some(isNaN)) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid years parameter. All values must be numbers.'
                    });
                    return;
                }
                const yearsData = yearArray.map(nepaliYear => {
                    const months = (0, nepaliCalendar_1.getNepaliYearMonths)(nepaliYear);
                    const hasCustomData = (0, nepaliCalendar_1.hasCustomYearData)(nepaliYear);
                    return {
                        nepaliYear,
                        hasCustomData,
                        months: months.map(month => (Object.assign(Object.assign({}, month), { startDate: (0, nepaliCalendar_1.formatDate)(month.startDate), endDate: (0, nepaliCalendar_1.formatDate)(month.endDate) })))
                    };
                });
                res.json({
                    success: true,
                    data: yearsData
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch multiple years data'
                });
            }
        };
    }
}
exports.CalendarController = CalendarController;
exports.default = new CalendarController();
