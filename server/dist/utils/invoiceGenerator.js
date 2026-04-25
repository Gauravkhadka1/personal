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
exports.generateInvoicePDF = void 0;
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
const generateInvoicePDF = (client, serviceType) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        try {
            const doc = new jspdf_1.jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            // Invoice Title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Renewal Invoice', pageWidth / 2, 25, { align: 'center' });
            // Company Information
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Webtech Nepal Pvt. Ltd.', pageWidth / 2, 35, { align: 'center' });
            doc.setFontSize(10);
            doc.text('Hattigauda, Kathmandu, Nepal | Phone: +977-1-4541620', pageWidth / 2, 40, { align: 'center' });
            // Client Information
            doc.setFont('helvetica', 'bold');
            doc.text('Bill To:', margin, 60);
            doc.setFont('helvetica', 'normal');
            doc.text(client.companyName || '', margin, 65);
            doc.text(client.contactPerson || '', margin, 70);
            doc.text(client.companyAddress || '', margin, 75);
            // Service Details
            const tableColumn = ['Description', 'Amount (Rs.)'];
            const tableRows = [
                [`${serviceType} Renewal`, `Rs. ${getServiceAmount(client, serviceType).toFixed(2)}`]
            ];
            (0, jspdf_autotable_1.default)(doc, {
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [150, 150, 150] }
            });
            // Convert to buffer
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            resolve(pdfBuffer);
        }
        catch (error) {
            reject(error);
        }
    });
});
exports.generateInvoicePDF = generateInvoicePDF;
const getServiceAmount = (client, serviceType) => {
    // Implement logic to get the appropriate amount based on service type
    // This is a simplified example
    if (serviceType.includes('Domain'))
        return client.domainAmount || 0;
    if (serviceType.includes('Hosting'))
        return client.hostingAmount || 0;
    if (serviceType.includes('Microsoft'))
        return 5000; // Example amount
    return 0;
};
