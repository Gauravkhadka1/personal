"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendarController_1 = __importDefault(require("../controllers/calendarController"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/calendar
 * @desc    Get all available Nepali calendar data (years, months, etc.)
 * @access  Public
 */
router.get('/', calendarController_1.default.getFullCalendar);
/**
 * @route   GET /api/calendar/current
 * @desc    Get current Nepali year data
 * @access  Public
 */
router.get('/current', calendarController_1.default.getCurrentYear);
/**
 * @route   GET /api/calendar/years
 * @desc    Get all available Nepali years with data
 * @access  Public
 */
router.get('/years', calendarController_1.default.getAvailableYears);
/**
 * @route   GET /api/calendar/years/multiple
 * @desc    Get multiple years data
 * @access  Public
 */
router.get('/years/multiple', calendarController_1.default.getMultipleYears);
/**
 * @route   GET /api/calendar/years/:year
 * @desc    Get all months for a specific Nepali year
 * @access  Public
 */
router.get('/years/:year', calendarController_1.default.getYearMonths);
/**
 * @route   GET /api/calendar/years/:year/months/:month
 * @desc    Get specific month range for a Nepali year
 * @access  Public
 */
router.get('/years/:year/months/:month', calendarController_1.default.getMonthRange);
exports.default = router;
