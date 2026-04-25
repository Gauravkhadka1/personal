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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.updatePayment = exports.createPayment = exports.getPaymentsByClient = exports.getPayments = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const nepaliCalendar_1 = require("../utils/nepaliCalendar");
const numberToWords_1 = require("../utils/numberToWords");
const index_1 = require("../index"); // Import io instance
const prisma = new client_1.PrismaClient();
const UPLOAD_DIR = path_1.default.join(process.cwd(), "/uploads");
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year, category } = req.query;
        const queryMonth = month;
        const queryYear = year;
        const queryCategory = category;
        const filters = {};
        if (queryCategory) {
            const categories = queryCategory.split(',').map(cat => cat.trim());
            if (categories.length === 1) {
                filters.category = categories[0];
            }
            else {
                filters.OR = categories.map(cat => ({
                    category: cat
                }));
            }
        }
        let nepaliMonth;
        if (queryMonth && queryYear) {
            const targetMonth = parseInt(queryMonth);
            const targetYear = parseInt(queryYear);
            if (isNaN(targetMonth) || isNaN(targetYear)) {
                res.status(400).json({ error: "Invalid month or year parameter" });
                return;
            }
            nepaliMonth = {
                year: targetYear,
                month: targetMonth,
                monthName: require("../utils/nepaliCalendar").NEPALI_MONTH_NAMES[targetMonth]
            };
        }
        else {
            const today = new Date();
            nepaliMonth = (0, nepaliCalendar_1.getNepaliMonthFromDate)(today);
            if (!nepaliMonth) {
                res.status(400).json({ error: "Unable to determine current Nepali month" });
                return;
            }
        }
        const { getNepaliYearMonths, getNepaliMonthRange, getNepaliDateDetails } = require("../utils/nepaliCalendar");
        const yearMonths = getNepaliYearMonths(nepaliMonth.year);
        const monthRange = getNepaliMonthRange(nepaliMonth.year, nepaliMonth.month);
        if (!monthRange) {
            res.status(400).json({
                error: `No data available for Nepali month ${nepaliMonth.month} in year ${nepaliMonth.year}`
            });
            return;
        }
        const startDate = (0, nepaliCalendar_1.formatDate)(monthRange.startDate);
        const endDate = (0, nepaliCalendar_1.formatDate)(monthRange.endDate);
        const yearStartDate = (0, nepaliCalendar_1.formatDate)(yearMonths[0].startDate);
        const yearEndDate = (0, nepaliCalendar_1.formatDate)(yearMonths[11].endDate);
        const baseWhereClause = {
            paidDate: {
                gte: new Date(yearStartDate),
                lte: new Date(yearEndDate)
            }
        };
        const finalWhereClause = queryCategory
            ? Object.assign(Object.assign({}, baseWhereClause), filters) : baseWhereClause;
        const allYearPayments = yield prisma.payment.findMany({
            where: finalWhereClause,
            select: {
                id: true,
                amount: true,
                paidDate: true,
                category: true,
                paymentType: true,
                receiptUrl: true,
                client: {
                    select: {
                        id: true,
                        domainName: true,
                        companyName: true,
                    }
                }
            },
            orderBy: {
                paidDate: "desc",
            },
        });
        const requestedMonthPayments = allYearPayments.filter(payment => {
            return payment.paidDate >= new Date(startDate) && payment.paidDate <= new Date(endDate);
        });
        const paymentsWithNepaliDate = requestedMonthPayments.map(payment => {
            const nepaliDate = getNepaliDateDetails(payment.paidDate);
            return Object.assign(Object.assign({}, payment), { paidNepaliDate: nepaliDate ? `${nepaliDate.nepaliMonthName} ${nepaliDate.nepaliDay}, ${nepaliDate.nepaliYear}` : null, nepaliDateDetails: nepaliDate });
        });
        const totalAmount = requestedMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
        let yearlyTotal = 0;
        const yearlySummary = yearMonths.map((monthData) => {
            const monthStart = monthData.startDate;
            const monthEnd = monthData.endDate;
            const monthPayments = allYearPayments.filter(payment => {
                return payment.paidDate >= monthStart && payment.paidDate <= monthEnd;
            });
            const monthTotal = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
            yearlyTotal += monthTotal;
            return {
                month: monthData.nepaliMonth,
                monthName: monthData.nepaliMonthName,
                totalAmount: monthTotal,
                totalAmountInWords: (0, numberToWords_1.numberToWords)(monthTotal),
                paymentCount: monthPayments.length,
                period: `${(0, nepaliCalendar_1.formatDate)(monthStart)} to ${(0, nepaliCalendar_1.formatDate)(monthEnd)}`
            };
        });
        const response = {
            payments: paymentsWithNepaliDate,
            summary: {
                nepaliMonth: nepaliMonth.month,
                nepaliMonthName: nepaliMonth.monthName,
                nepaliYear: nepaliMonth.year,
                period: `${startDate} to ${endDate}`,
                totalAmount: totalAmount,
                totalAmountInWords: (0, numberToWords_1.numberToWords)(totalAmount),
                paymentCount: requestedMonthPayments.length,
                filters: queryCategory ? {
                    category: queryCategory
                } : undefined
            },
            yearlySummary: {
                nepaliYear: nepaliMonth.year,
                totalYearlyAmount: yearlyTotal,
                totalYearlyAmountInWords: (0, numberToWords_1.numberToWords)(yearlyTotal),
                months: yearlySummary
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});
exports.getPayments = getPayments;
const getPaymentsByClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId } = req.params;
    try {
        const payments = yield prisma.payment.findMany({
            where: {
                clientId: parseInt(clientId),
            },
            include: {
                client: true,
            },
            orderBy: {
                paidDate: "desc",
            },
        });
        const { getNepaliDateDetails } = require("../utils/nepaliCalendar");
        const paymentsWithNepaliDate = payments.map(payment => {
            const nepaliDate = getNepaliDateDetails(payment.paidDate);
            return Object.assign(Object.assign({}, payment), { paidNepaliDate: nepaliDate ? `${nepaliDate.nepaliMonthName} ${nepaliDate.nepaliDay}, ${nepaliDate.nepaliYear}` : null, nepaliDateDetails: nepaliDate });
        });
        res.json(paymentsWithNepaliDate);
    }
    catch (error) {
        console.error("Error fetching client payments:", error);
        res.status(500).json({ error: "Failed to fetch client payments" });
    }
});
exports.getPaymentsByClient = getPaymentsByClient;
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { clientId, paymentType, category, amount, paidDate } = req.body;
    let receiptUrl = null;
    if (req.file) {
        receiptUrl = `uploads/${req.file.filename}`;
    }
    try {
        const payment = yield prisma.payment.create({
            data: {
                clientId: parseInt(clientId),
                paymentType,
                category,
                amount: parseFloat(amount),
                paidDate: new Date(paidDate),
                receiptUrl,
            },
            include: {
                client: true,
            },
        });
        // Emit real-time event for new payment
        index_1.io.emit("payment:created", {
            payment,
            message: `New payment of ${amount} received from ${((_a = payment.client) === null || _a === void 0 ? void 0 : _a.domainName) || ((_b = payment.client) === null || _b === void 0 ? void 0 : _b.companyName)}`,
        });
        res.status(201).json(payment);
    }
    catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({ error: "Failed to create payment" });
    }
});
exports.createPayment = createPayment;
const updatePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { clientId, paymentType, category, amount, paidDate, removeReceipt } = req.body;
    let receiptUrl = null;
    const oldPayment = yield prisma.payment.findUnique({
        where: { id: parseInt(id) },
        include: { client: true },
    });
    if (!oldPayment) {
        res.status(404).json({ error: "Payment not found" });
        return;
    }
    if (removeReceipt === "true") {
        if (oldPayment.receiptUrl) {
            const oldFilePath = path_1.default.join(UPLOAD_DIR, oldPayment.receiptUrl.replace("uploads/", ""));
            if (fs_1.default.existsSync(oldFilePath)) {
                fs_1.default.unlinkSync(oldFilePath);
            }
        }
        receiptUrl = null;
    }
    else if (req.file) {
        if (oldPayment.receiptUrl) {
            const oldFilePath = path_1.default.join(UPLOAD_DIR, oldPayment.receiptUrl.replace("uploads/", ""));
            if (fs_1.default.existsSync(oldFilePath)) {
                fs_1.default.unlinkSync(oldFilePath);
            }
        }
        receiptUrl = `uploads/${req.file.filename}`;
    }
    else {
        receiptUrl = oldPayment.receiptUrl;
    }
    try {
        const payment = yield prisma.payment.update({
            where: { id: parseInt(id) },
            data: {
                clientId: parseInt(clientId),
                paymentType,
                category,
                amount: parseFloat(amount),
                paidDate: new Date(paidDate),
                receiptUrl,
            },
            include: {
                client: true,
            },
        });
        // Emit real-time event for payment update
        index_1.io.emit("payment:updated", {
            payment,
            oldPayment,
            message: `Payment updated for ${((_a = payment.client) === null || _a === void 0 ? void 0 : _a.domainName) || ((_b = payment.client) === null || _b === void 0 ? void 0 : _b.companyName)}`,
        });
        res.json(payment);
    }
    catch (error) {
        console.error("Error updating payment:", error);
        res.status(500).json({ error: "Failed to update payment" });
    }
});
exports.updatePayment = updatePayment;
const deletePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { id } = req.params;
    try {
        const payment = yield prisma.payment.findUnique({
            where: { id: parseInt(id) },
            include: { client: true },
        });
        if (payment === null || payment === void 0 ? void 0 : payment.receiptUrl) {
            const filePath = path_1.default.join(UPLOAD_DIR, payment.receiptUrl.replace("uploads/", ""));
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        yield prisma.payment.delete({
            where: { id: parseInt(id) },
        });
        // Emit real-time event for payment deletion
        index_1.io.emit("payment:deleted", {
            paymentId: parseInt(id),
            clientName: ((_a = payment === null || payment === void 0 ? void 0 : payment.client) === null || _a === void 0 ? void 0 : _a.domainName) || ((_b = payment === null || payment === void 0 ? void 0 : payment.client) === null || _b === void 0 ? void 0 : _b.companyName),
            message: `Payment deleted for ${((_c = payment === null || payment === void 0 ? void 0 : payment.client) === null || _c === void 0 ? void 0 : _c.domainName) || ((_d = payment === null || payment === void 0 ? void 0 : payment.client) === null || _d === void 0 ? void 0 : _d.companyName)}`,
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting payment:", error);
        res.status(500).json({ error: "Failed to delete payment" });
    }
});
exports.deletePayment = deletePayment;
