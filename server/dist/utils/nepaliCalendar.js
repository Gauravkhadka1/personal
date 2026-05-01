"use strict";
// server/src/utils/nepaliCalendar.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEPALI_MONTH_NAMES = void 0;
exports.getNepaliYearMonths = getNepaliYearMonths;
exports.getCurrentNepaliYear = getCurrentNepaliYear;
exports.formatDate = formatDate;
exports.getNepaliMonthRange = getNepaliMonthRange;
exports.isDateInNepaliMonth = isDateInNepaliMonth;
exports.getAvailableNepaliYears = getAvailableNepaliYears;
exports.getNepaliMonthFromDate = getNepaliMonthFromDate;
exports.getNepaliDateDetails = getNepaliDateDetails;
exports.formatNepaliDate = formatNepaliDate;
exports.batchGetNepaliDates = batchGetNepaliDates;
exports.hasCustomYearData = hasCustomYearData;
/**
 * Complete Nepali month data structure for years 2080-2083
 */
const NEPALI_YEAR_DATA = {
    2080: {
        1: { start: '2023-04-14', end: '2023-05-14' }, // Baisakh
        2: { start: '2023-05-15', end: '2023-06-15' }, // Jestha
        3: { start: '2023-06-16', end: '2023-07-16' }, // Ashadh
        4: { start: '2023-07-17', end: '2023-08-17' }, // Shrawan
        5: { start: '2023-08-18', end: '2023-09-17' }, // Bhadra
        6: { start: '2023-09-18', end: '2023-10-17' }, // Ashwin
        7: { start: '2023-10-18', end: '2023-11-16' }, // Kartik
        8: { start: '2023-11-17', end: '2023-12-16' }, // Mangsir
        9: { start: '2023-12-17', end: '2024-01-14' }, // Poush
        10: { start: '2024-01-15', end: '2024-02-12' }, // Magh
        11: { start: '2024-02-13', end: '2024-03-13' }, // Falgun
        12: { start: '2024-03-14', end: '2024-04-12' }, // Chaitra
    },
    2081: {
        1: { start: '2024-04-13', end: '2024-05-13' }, // Baisakh
        2: { start: '2024-05-14', end: '2024-06-14' }, // Jestha
        3: { start: '2024-06-15', end: '2024-07-15' }, // Ashadh
        4: { start: '2024-07-16', end: '2024-08-16' }, // Shrawan
        5: { start: '2024-08-17', end: '2024-09-16' }, // Bhadra
        6: { start: '2024-09-17', end: '2024-10-16' }, // Ashwin
        7: { start: '2024-10-17', end: '2024-11-15' }, // Kartik
        8: { start: '2024-11-16', end: '2024-12-15' }, // Mangsir
        9: { start: '2024-12-16', end: '2025-01-13' }, // Poush
        10: { start: '2025-01-14', end: '2025-02-12' }, // Magh
        11: { start: '2025-02-13', end: '2025-03-13' }, // Falgun
        12: { start: '2025-03-14', end: '2025-04-13' }, // Chaitra
    },
    2082: {
        1: { start: '2025-04-14', end: '2025-05-14' }, // Baisakh
        2: { start: '2025-05-15', end: '2025-06-14' }, // Jestha
        3: { start: '2025-06-15', end: '2025-07-16' }, // Ashadh
        4: { start: '2025-07-17', end: '2025-08-16' }, // Shrawan
        5: { start: '2025-08-17', end: '2025-09-16' }, // Bhadra
        6: { start: '2025-09-17', end: '2025-10-17' }, // Ashwin
        7: { start: '2025-10-18', end: '2025-11-16' }, // Kartik
        8: { start: '2025-11-17', end: '2025-12-15' }, // Mangsir
        9: { start: '2025-12-16', end: '2026-01-14' }, // Poush
        10: { start: '2026-01-15', end: '2026-02-13' }, // Magh
        11: { start: '2026-02-14', end: '2026-03-14' }, // Falgun
        12: { start: '2026-03-15', end: '2026-04-13' }, // Chaitra
    },
    2083: {
        1: { start: '2026-04-14', end: '2026-05-14' }, // Baisakh
        2: { start: '2026-05-15', end: '2026-06-14' }, // Jestha
        3: { start: '2026-06-15', end: '2026-07-16' }, // Ashadh
        4: { start: '2026-07-17', end: '2026-08-16' }, // Shrawan
        5: { start: '2026-08-17', end: '2026-09-16' }, // Bhadra
        6: { start: '2026-09-17', end: '2026-10-17' }, // Ashwin
        7: { start: '2026-10-18', end: '2026-11-16' }, // Kartik
        8: { start: '2026-11-17', end: '2026-12-15' }, // Mangsir
        9: { start: '2026-12-16', end: '2027-01-14' }, // Poush
        10: { start: '2027-01-15', end: '2027-02-12' }, // Magh
        11: { start: '2027-02-14', end: '2027-03-14' }, // Falgun
        12: { start: '2027-03-15', end: '2027-04-13' }, // Chaitra
    }
};
exports.NEPALI_MONTH_NAMES = {
    1: 'Baisakh',
    2: 'Jestha',
    3: 'Ashadh',
    4: 'Shrawan',
    5: 'Bhadra',
    6: 'Ashwin',
    7: 'Kartik',
    8: 'Mangsir',
    9: 'Poush',
    10: 'Magh',
    11: 'Falgun',
    12: 'Chaitra'
};
function getNepaliYearMonths(nepaliYear) {
    const yearData = NEPALI_YEAR_DATA[nepaliYear];
    if (!yearData) {
        throw new Error(`No data available for Nepali year ${nepaliYear}`);
    }
    const months = [];
    for (let month = 1; month <= 12; month++) {
        const monthData = yearData[month];
        months.push({
            nepaliMonth: month,
            nepaliMonthName: exports.NEPALI_MONTH_NAMES[month],
            startDate: new Date(monthData.start),
            endDate: new Date(monthData.end)
        });
    }
    return months;
}
function getCurrentNepaliYear() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    let nepaliYear = currentYear + 57;
    if (currentMonth < 3 || (currentMonth === 3 && currentDay < 14)) {
        nepaliYear--;
    }
    return nepaliYear;
}
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
function getNepaliMonthRange(nepaliYear, nepaliMonth) {
    const months = getNepaliYearMonths(nepaliYear);
    return months.find(month => month.nepaliMonth === nepaliMonth) || null;
}
function isDateInNepaliMonth(date, nepaliYear, nepaliMonth) {
    const monthRange = getNepaliMonthRange(nepaliYear, nepaliMonth);
    if (!monthRange)
        return false;
    return date >= monthRange.startDate && date <= monthRange.endDate;
}
function getAvailableNepaliYears() {
    return Object.keys(NEPALI_YEAR_DATA).map(Number).sort();
}
function getNepaliMonthFromDate(date) {
    const years = getAvailableNepaliYears();
    for (const year of years) {
        const months = getNepaliYearMonths(year);
        for (const month of months) {
            if (date >= month.startDate && date <= month.endDate) {
                return {
                    year,
                    month: month.nepaliMonth,
                    monthName: month.nepaliMonthName
                };
            }
        }
    }
    return null;
}
// NEW: Get detailed Nepali date including day number
function getNepaliDateDetails(englishDate) {
    const monthInfo = getNepaliMonthFromDate(englishDate);
    if (!monthInfo) {
        return null;
    }
    const monthRange = getNepaliMonthRange(monthInfo.year, monthInfo.month);
    if (!monthRange) {
        return null;
    }
    const dayDiff = Math.floor((englishDate.getTime() - monthRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const nepaliDay = dayDiff + 1;
    return {
        year: monthInfo.year,
        month: monthInfo.month,
        monthName: monthInfo.monthName,
        day: nepaliDay,
        englishDate: englishDate
    };
}
// NEW: Format Nepali date as string (e.g., "Baisakh 1, 2082")
function formatNepaliDate(englishDate) {
    const nepaliDate = getNepaliDateDetails(englishDate);
    if (!nepaliDate) {
        return englishDate.toLocaleDateString();
    }
    return `${nepaliDate.monthName} ${nepaliDate.day}, ${nepaliDate.year}`;
}
// NEW: Batch convert multiple dates to Nepali date objects
function batchGetNepaliDates(dates) {
    const dateMap = new Map();
    for (const date of dates) {
        const key = date.toISOString().split('T')[0];
        const nepaliDate = getNepaliDateDetails(date);
        if (nepaliDate) {
            dateMap.set(key, nepaliDate);
        }
    }
    return dateMap;
}
function hasCustomYearData(nepaliYear) {
    return NEPALI_YEAR_DATA[nepaliYear] !== undefined;
}
