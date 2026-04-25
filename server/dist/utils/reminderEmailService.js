"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.sendReminderEmailWithInvoice = void 0;
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
const emailService_1 = require("./emailService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Signature_1 = require("../templates/Signature");
const sendReminderEmailWithInvoice = (client_1, services_1, ...args_1) => __awaiter(void 0, [client_1, services_1, ...args_1], void 0, function* (client, services, isPreview = false, ccEmails = [], recipientEmails = []) {
    try {
        if (recipientEmails.length === 0 && !client.contactPersonEmail) {
            throw new Error("No recipient email addresses provided");
        }
        // Generate invoice PDF
        const invoiceBuffer = yield generateInvoicePDF(client, services);
        // Format services information for email
        const servicesInfo = services
            .map((service) => {
            const serviceName = service.type || "Service";
            const expiryDate = service.expiry
                ? new Date(service.expiry).toLocaleDateString()
                : "N/A";
            const daysLeft = service.daysLeft || 0;
            return `This is a kind reminder that the ${serviceName} for isdf.org.np are set to expire on ${expiryDate} (${daysLeft} days left). We kindly request you to renew the services at your earliest convenience.`;
        })
            .join("\n\n");
        // Generate signature HTML
        const signatureHTML = (0, Signature_1.generateSignatureHTML)({
            name: "Webtech Nepal",
            title: "Renewal Notification",
            phone: "+977 1 4541620",
            email: "renewal@webtechnepal.com",
            website: "https://www.webtechnepal.com",
            address: "Lazimpat, Kathmandu, Nepal",
            showDisclaimer: true
        });
        // Generate services table rows dynamically
        const servicesTableRows = services
            .map((service, index) => {
            const expiryDate = service.expiry
                ? new Date(service.expiry).toLocaleDateString()
                : "N/A";
            const daysLeft = service.daysLeft || "N/A";
            return `
           <tr>
        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${index + 1}</td>
        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${service.type} for ${client.domainName || client.companyName}</td>
        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${expiryDate}</td>
        <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${daysLeft} days</td>
      </tr>
        `;
        })
            .join("");
        // Email content
        const subject = isPreview
            ? `PREVIEW: ${client.domainName}- Service Renewal Reminder`
            : `${client.domainName} Service Renewal Reminder`;
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; color: #333;">
    <p>Dear Sir/Madam,</p>

    <p>I hope this email finds you well.</p>

    <p>This is a gentle reminder that the following services for ${client.domainName || client.companyName} are set to expire soon:</p>

    <table style="border-collapse: collapse; width: 70%; margin: 15px 0; font-family: Arial, sans-serif;">
        <thead>
            <tr>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2; font-weight: bold;">S.No.</th>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2; font-weight: bold;">Description</th>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2; font-weight: bold;">Due Date</th>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2; font-weight: bold;">Time Left</th>
            </tr>
        </thead>
        <tbody>
            ${servicesTableRows}
        </tbody>
    </table>

 <p>To avoid any service interruptions, we kindly request you to proceed with the renewal at your earliest convenience.</p>

<p>Please find the payment details attached to this email. If you have any questions or require assistance, please feel free to reach out to us.</p>

<p>Thank you for your continued trust in our services.</p>

    <p>Best regards,</p>
    
    ${signatureHTML}
</body>
</html>
`;
        // Send email with attachment and embedded image
        for (const recipientEmail of recipientEmails) {
            yield (0, emailService_1.sendEmailWithAttachment)({
                to: recipientEmail, // Send to each recipient individually
                subject,
                html,
                cc: ccEmails,
                attachments: [
                    {
                        filename: `Payment Details-${client.domainName || client.companyName}-${new Date().toISOString().split("T")[0]}.pdf`,
                        content: invoiceBuffer,
                    },
                    {
                        filename: "qr-code.png",
                        path: path.join(process.cwd(), "src", "assets", "qr-code.png"),
                        cid: "qr-code", // same cid value as in the html img src
                    },
                ],
            });
            console.log(`Reminder email sent successfully to ${recipientEmail}`);
        }
    }
    catch (error) {
        console.error("Error sending reminder email:", error);
        throw new Error("Failed to send reminder email");
    }
});
exports.sendReminderEmailWithInvoice = sendReminderEmailWithInvoice;
const generateInvoicePDF = (client, services) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        try {
            const doc = new jspdf_1.jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 25;
            // Set text color
            doc.setTextColor(80, 80, 80);
            // Invoice Title at center
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("PAYMENT DETAILS", pageWidth / 2, 25, { align: "center" });
            // Company Information
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text("Webtech Nepal Pvt. Ltd.", pageWidth / 2, 35, { align: "center" });
            doc.setFontSize(10);
            doc.text("Lazimpat, Kathmandu, Nepal | Phone: +977-1-4541620", pageWidth / 2, 40, { align: "center" });
            doc.text("Email: info@webtechnepal.com | www.webtechnepal.com", pageWidth / 2, 45, { align: "center" });
            // Horizontal line separator
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, 50, pageWidth - margin, 50);
            // Invoice details
            doc.setFontSize(10);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 65, { align: "right" });
            // Bill To section
            const toX = margin;
            doc.setFont("helvetica", "bold");
            doc.text("To:", toX, 70);
            doc.setFont("helvetica", "normal");
            doc.text(client.companyName || "", toX, 75);
            doc.text(client.contactPerson || "", toX, 80);
            doc.text(client.companyAddress || "", toX, 85);
            doc.text(client.companyPhone || "", toX, 90);
            // Service Details Table - Simplified structure
            const tableColumn = ["S.NO.", "DESCRIPTION", "AMOUNT (NPR)"];
            const tableRows = [];
            let overallSubtotal = 0;
            let overallVat = 0;
            let overallTotal = 0;
            // Service rows
            services.forEach((service, index) => {
                const amount = service.amount || 0;
                const serviceAmounts = calculateServiceAmounts(amount, service.vatType);
                overallSubtotal += serviceAmounts.subtotal;
                overallVat += serviceAmounts.vat;
                overallTotal += serviceAmounts.total;
                // Format service dates
                const expiryDate = service.expiry ? new Date(service.expiry) : null;
                const fromDate = expiryDate || new Date();
                const toDate = new Date(fromDate);
                toDate.setFullYear(toDate.getFullYear() + 1);
                const serviceType = service.type ? `${service.type} Service` : "";
                const fromDateStr = fromDate.toLocaleDateString();
                const toDateStr = toDate.toLocaleDateString();
                const serviceDescription = `${serviceType} (${client.domainName})\nPeriod: ${fromDateStr} to ${toDateStr}`;
                const displayAmount = serviceAmounts.subtotal;
                // Simplified row structure with styling
                tableRows.push([
                    index + 1,
                    serviceDescription,
                    `Rs. ${displayAmount.toFixed(2)}`
                ]);
            });
            // Add summary rows
            tableRows.push([
                { content: "SUB TOTAL", colSpan: 2, styles: { fontStyle: "bold" } },
                { content: `Rs. ${overallSubtotal.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold" } }
            ]);
            if (overallVat > 0) {
                tableRows.push([
                    { content: "VAT 13%", colSpan: 2, styles: { fontStyle: "bold" } },
                    { content: `Rs. ${overallVat.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold" } }
                ]);
            }
            tableRows.push([
                { content: "GRAND TOTAL", colSpan: 2, styles: { fontStyle: "bold" } },
                { content: `Rs. ${overallTotal.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold" } }
            ]);
            // Add Amount in Words row
            tableRows.push([
                { content: "Amount in Words: " + getAmountInWords(overallTotal), colSpan: 3, styles: { fontStyle: "bold" } }
            ]);
            // Generate table with simplified styling to match client component
            (0, jspdf_autotable_1.default)(doc, {
                startY: 105,
                head: [tableColumn],
                body: tableRows,
                theme: "grid",
                styles: {
                    fontSize: 10,
                    cellPadding: 3,
                    lineColor: [255, 255, 255], // White borders
                    textColor: [80, 80, 80],
                    fillColor: [245, 246, 248] // #F5F6F8 background to match client
                },
                headStyles: {
                    fillColor: [232, 233, 237], // #E8E9ED for header to match client
                    textColor: [80, 80, 80],
                    fontStyle: "bold",
                    lineColor: [255, 255, 255] // White borders
                },
                columnStyles: {
                    0: {
                        cellWidth: 20,
                        halign: "center",
                        lineWidth: 0.5 // Increased border width for this column
                    },
                    1: {
                        cellWidth: "auto",
                        lineWidth: 0.5 // Increased border width for this column
                    },
                    2: {
                        cellWidth: 40,
                        halign: "right",
                        lineWidth: 0.5 // Increased border width for this column
                    }
                },
                margin: { left: margin, right: margin }
            });
            // Get the final Y position after the table
            const finalY = doc.lastAutoTable.finalY + 20;
            // Payment instructions and QR code
            const paymentInstructions = [
                { text: "PAYMENT INSTRUCTION:", bold: true, spacing: 6 },
                { text: "Payment can be made by depositing in:", bold: false, spacing: 6 },
                { text: "- Bank Name: NIC ASIA Bank Ltd.", bold: false, spacing: 4 },
                { text: "- Account Name: WEBTECH NEPAL PVT. LTD", bold: false, spacing: 4 },
                { text: "- Account Number: 6341498288524001", bold: false, spacing: 4 },
                { text: "- Branch: Lazimpat", bold: false, spacing: 4 },
                { text: "- SWIFT: NICENPKA", bold: false, spacing: 6 },
                { text: "Note: Kindly ensure that you scan the deposit slip and email it", bold: false, spacing: 4 },
                { text: "to info@webtechnepal.com for our records.", bold: false, spacing: 8 },
                { text: "Thank you!", bold: false, spacing: 0 }
            ];
            // Add QR code section with text above it
            try {
                const getQRCodePath = () => {
                    const possiblePaths = [
                        path.join(process.cwd(), "src", "assets", "qr.png"),
                        path.join(process.cwd(), "assets", "qr.png"),
                        path.join(__dirname, "..", "..", "assets", "qr.png"),
                        path.join(__dirname, "..", "..", "src", "assets", "qr.png"),
                    ];
                    for (const possiblePath of possiblePaths) {
                        if (fs.existsSync(possiblePath)) {
                            return possiblePath;
                        }
                    }
                    throw new Error("QR code not found in any of the expected locations");
                };
                const qrCodePath = getQRCodePath();
                console.log("Using QR code at:", qrCodePath);
                const qrCodeData = fs.readFileSync(qrCodePath);
                const qrCodeBase64 = qrCodeData.toString("base64");
                const qrCodeWidth = 40;
                const qrCodeHeight = 40;
                const qrCodeX = pageWidth - margin - qrCodeWidth;
                const qrCodeY = finalY;
                // Add "QR Code" text above the QR code
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text("QR Code", qrCodeX + qrCodeWidth / 2, qrCodeY - 5, { align: "center" });
                // Add the actual QR code image
                doc.addImage(`data:image/png;base64,${qrCodeBase64}`, "PNG", qrCodeX, qrCodeY, qrCodeWidth, qrCodeHeight);
                // Add payment instructions to the left of QR code
                doc.setFontSize(9);
                let currentY = finalY;
                paymentInstructions.forEach((line) => {
                    doc.setFont("helvetica", line.bold ? "bold" : "normal");
                    doc.text(line.text, margin, currentY);
                    currentY += line.spacing;
                });
            }
            catch (error) {
                console.error("Error adding QR code:", error);
                // If QR code can't be loaded, just add payment instructions
                doc.setFontSize(9);
                let currentY = finalY;
                paymentInstructions.forEach((line) => {
                    doc.setFont("helvetica", line.bold ? "bold" : "normal");
                    doc.text(line.text, margin, currentY);
                    currentY += line.spacing;
                });
            }
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.height - 15, { align: "center" });
            doc.text("Webtech Nepal Pvt. Ltd. | Kathmandu, Nepal | info@webtechnepal.com", pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });
            // Convert to buffer
            const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
            resolve(pdfBuffer);
        }
        catch (error) {
            reject(error);
        }
    });
});
const calculateServiceAmounts = (amount, vatType) => {
    if (!amount)
        return { subtotal: 0, vat: 0, total: 0 };
    switch (vatType) {
        case "inclusive":
            const subtotalInclusive = amount / 1.13;
            const vatInclusive = amount - subtotalInclusive;
            return {
                subtotal: subtotalInclusive,
                vat: vatInclusive,
                total: amount,
            };
        case "exclusive":
            const vatExclusive = amount * 0.13;
            return {
                subtotal: amount,
                vat: vatExclusive,
                total: amount + vatExclusive,
            };
        case "non-vat":
        default:
            return {
                subtotal: amount,
                vat: 0,
                total: amount,
            };
    }
};
const numberToWords = (num) => {
    const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
    ];
    const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
    ];
    if (num === 0)
        return "Zero";
    let words = "";
    // Handle thousands
    if (num >= 1000) {
        words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
        num %= 1000;
    }
    // Handle hundreds
    if (num >= 100) {
        words += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
    }
    // Handle tens and ones
    if (num > 0) {
        if (num < 20) {
            words += ones[num];
        }
        else {
            words += tens[Math.floor(num / 10)];
            if (num % 10 > 0) {
                words += " " + ones[num % 10];
            }
        }
    }
    return words.trim();
};
const getAmountInWords = (amount) => {
    const rupees = Math.floor(amount);
    const paisa = Math.round((amount - rupees) * 100);
    let words = numberToWords(rupees) + " Rupees";
    if (paisa > 0) {
        words += " and " + numberToWords(paisa) + " Paisa";
    }
    return words + " Only";
};
