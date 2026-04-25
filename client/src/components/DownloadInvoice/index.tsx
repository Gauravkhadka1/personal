import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ServiceExpiry {
  type: string;
  expiry?: string | Date | null | undefined;
  amount?: number | null | undefined;
  daysLeft?: number | string | null;
  vatType?: "inclusive" | "exclusive" | "non-vat" | null;
}
interface MicrosoftService {
  noOfAccounts: string;
  amount: number;
  activeDate: string;
  expiryDate: string;
  serviceType: string;
  microsoftVatType: string;
  purchaseOrder: File | null;
}

interface Client {
  companyName: string;
  contactPerson: string;
  companyAddress: string;
  companyPhone: string;
  domainName: string;
  microsoftServices?: MicrosoftService[];
}

interface DownloadInvoiceProps {
  client: Client;
  services: ServiceExpiry[];
}

export interface DownloadInvoiceHandle {
  generateInvoice: () => void;
}

const DownloadInvoice = forwardRef<DownloadInvoiceHandle, DownloadInvoiceProps>(
  ({ client, services }, ref) => {
    
    const calculateServiceAmounts = (amount: number, vatType?: "inclusive" | "exclusive" | "non-vat" | null) => {
      // Convert amount to number and handle invalid values
      const numericAmount = Number(amount) || 0;
      
      if (!numericAmount) return { subtotal: 0, vat: 0, total: 0 };
      
      switch (vatType) {
        case 'inclusive':
          const subtotalInclusive = numericAmount / 1.13;
          const vatInclusive = numericAmount - subtotalInclusive;
          return {
            subtotal: subtotalInclusive,
            vat: vatInclusive,
            total: numericAmount
          };
          
        case 'exclusive':
          const vatExclusive = numericAmount * 0.13;
          return {
            subtotal: numericAmount,
            vat: vatExclusive,
            total: numericAmount + vatExclusive
          };
          
        case 'non-vat':
        default:
          return {
            subtotal: numericAmount,
            vat: 0,
            total: numericAmount
          };
      }
    };

    const numberToWords = (num: number): string => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 
                    'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      if (num === 0) return 'Zero';
      
      let words = '';
      
      if (num >= 1000) {
        words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
      }
      
      if (num >= 100) {
        words += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num > 0) {
        if (num < 20) {
          words += ones[num];
        } else {
          words += tens[Math.floor(num / 10)];
          if (num % 10 > 0) {
            words += ' ' + ones[num % 10];
          }
        }
      }
      
      return words.trim();
    };

    const getAmountInWords = (amount: number): string => {
      const rupees = Math.floor(amount);
      const paisa = Math.round((amount - rupees) * 100);
      
      let words = numberToWords(rupees) + ' Rupees';
      
      if (paisa > 0) {
        words += ' and ' + numberToWords(paisa) + ' Paisa';
      }
      
      return words + ' Only';
    };

    const generateInvoice = () => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 25;
      
      // Set text color
      doc.setTextColor(80, 80, 80);
      
      // Invoice Title at center
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT DETAILS', pageWidth / 2, 25, { align: 'center' });
      
      // Company Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Webtech Nepal Pvt. Ltd.', pageWidth / 2, 35, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Hattigauda, Kathmandu, Nepal | Phone: +977-1-4541620', pageWidth / 2, 40, { align: 'center' });
      doc.text('Email: info@webtechnepal.com | www.webtechnepal.com', pageWidth / 2, 45, { align: 'center' });
      
      // Horizontal line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 50, pageWidth - margin, 50);
      
      // Invoice details
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 65, { align: 'right' });
      
      // Bill To section
      const toX = margin;
      doc.setFont('helvetica', 'bold');
      doc.text('To:', toX, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(client.companyName || '', toX, 75);
      doc.text(client.contactPerson || '', toX, 80);
      doc.text(client.companyAddress || '', toX, 85);
      doc.text(client.companyPhone || '', toX, 90);
      
      // Service Details Table
      const tableColumn = ['S.NO.', 'DESCRIPTION', 'AMOUNT (NPR)'];
      const tableRows: any[] = [];
      
      // Initialize totals as numbers
      let overallSubtotal = 0;
      let overallVat = 0;
      let overallTotal = 0;
      let serviceIndex = 1;
      
      // Regular service rows (domain, hosting, maintenance, etc.) - EXCLUDE Microsoft from here
      services.forEach((service) => {
        // Skip Microsoft services from the regular services array
        if (service.type.toLowerCase().includes('microsoft')) {
          return;
        }
        
        const amount = Number(service.amount) || 0;
        const serviceAmounts = calculateServiceAmounts(amount, service.vatType);
        
        // Add to totals with number conversion
        overallSubtotal += Number(serviceAmounts.subtotal) || 0;
        overallVat += Number(serviceAmounts.vat) || 0;
        overallTotal += Number(serviceAmounts.total) || 0;
        
        // Format service dates
        const expiryDate = service.expiry ? new Date(service.expiry) : null;
        const fromDate = expiryDate || new Date();
        const toDate = new Date(fromDate);
        toDate.setFullYear(toDate.getFullYear() + 1);
        
        const serviceType = service.type ? `${service.type} Service` : '';
        const fromDateStr = fromDate.toLocaleDateString();
        const toDateStr = toDate.toLocaleDateString();
        
        const serviceDescription = `${serviceType} (${client.domainName})\nPeriod: ${fromDateStr} to ${toDateStr}`;
        const displayAmount = Number(serviceAmounts.subtotal) || 0;
        
        tableRows.push([
          serviceIndex++,
          serviceDescription,
          `Rs. ${displayAmount.toFixed(2)}`
        ]);
      });
      
      // Microsoft service rows - handle ONLY Microsoft services here
      if (client.microsoftServices && client.microsoftServices.length > 0) {
        client.microsoftServices.forEach((microsoftService) => {
          const amount = Number(microsoftService.amount) || 0;
          const serviceAmounts = calculateServiceAmounts(amount, microsoftService.microsoftVatType as "inclusive" | "exclusive" | "non-vat" | null);
          
          // Add to totals with number conversion
          overallSubtotal += Number(serviceAmounts.subtotal) || 0;
          overallVat += Number(serviceAmounts.vat) || 0;
          overallTotal += Number(serviceAmounts.total) || 0;
          
          // Format Microsoft service dates
          const fromDate = microsoftService.activeDate ? new Date(microsoftService.activeDate) : new Date();
          const toDate = microsoftService.expiryDate ? new Date(microsoftService.expiryDate) : new Date();
          
          const fromDateStr = fromDate.toLocaleDateString();
          const toDateStr = toDate.toLocaleDateString();
          
          const serviceDescription = `Microsoft ${microsoftService.serviceType} (${microsoftService.noOfAccounts} accounts)\nPeriod: ${fromDateStr} to ${toDateStr}`;
          const displayAmount = Number(serviceAmounts.subtotal) || 0;
          
          tableRows.push([
            serviceIndex++,
            serviceDescription,
            `Rs. ${displayAmount.toFixed(2)}`
          ]);
        });
      }
      
      // Add summary rows with safe number conversion
      tableRows.push([
        { content: 'SUB TOTAL', colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${(Number(overallSubtotal) || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
      ]);
      
      if (overallVat > 0) {
        tableRows.push([
          { content: 'VAT 13%', colSpan: 2, styles: { fontStyle: 'bold' } },
          { content: `Rs. ${(Number(overallVat) || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
        ]);
      }
      
      tableRows.push([
        { content: 'GRAND TOTAL', colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${(Number(overallTotal) || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
      ]);

      // Add Amount in Words row with safe number conversion
      tableRows.push([
        { content: 'Amount in Words: ' + getAmountInWords(Number(overallTotal) || 0), colSpan: 3, styles: { fontStyle: 'bold' } }
      ]);
      
      // Generate table with simplified styling
      autoTable(doc, {
        startY: 105,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { 
          fontSize: 10,
          cellPadding: 3,
          lineColor: [255, 255, 255],
          textColor: [80, 80, 80],
          fillColor: [245, 246, 248]
        },
        headStyles: { 
          fillColor: [232, 233, 237],
          textColor: [80, 80, 80],
          fontStyle: 'bold',
          lineColor: [255, 255, 255]
        },
        columnStyles: {
          0: { 
            cellWidth: 20, 
            halign: 'center',
            lineWidth: 0.5
          },
          1: { 
            cellWidth: 'auto',
            lineWidth: 0.5
          },
          2: { 
            cellWidth: 40, 
            halign: 'right',
            lineWidth: 0.5
          }
        },
        margin: { left: margin, right: margin }
      });
      
      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      // Payment instructions and QR code
      const paymentInstructions = [
        { text: 'PAYMENT INSTRUCTION:', bold: true, spacing: 6 },
        { text: 'Payment can be made by depositing in:', bold: false, spacing: 6 },
        { text: '- Bank Name: NIC ASIA Bank Ltd.', bold: false, spacing: 4 },
        { text: '- Account Name: WEBTECH NEPAL PVT. LTD', bold: false, spacing: 4 },
        { text: '- Account Number: 6341498288524001', bold: false, spacing: 4 },
        { text: '- Branch: Lazimpat', bold: false, spacing: 4 },
        { text: '- SWIFT: NICENPKA', bold: false, spacing: 6 },
        { text: 'Note: Kindly ensure that you scan the deposit slip and email it', bold: false, spacing: 4 },
        { text: 'to info@webtechnepal.com for our records.', bold: false, spacing: 8 },
        { text: 'Thank you!', bold: false, spacing: 0 }
      ];
      
      // Add QR code section with text above it
      try {
        const qrCodeWidth = 40;
        const qrCodeHeight = 40;
        const qrCodeX = pageWidth - margin - qrCodeWidth;
        const qrCodeY = finalY;
        
        // Add "QR Code" text above the QR code
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('QR Code', qrCodeX + qrCodeWidth / 2, qrCodeY - 5, { align: 'center' });
        
        // Add the actual QR code image
        doc.addImage('/qr.png', 'PNG', qrCodeX, qrCodeY, qrCodeWidth, qrCodeHeight);
        
        // Add payment instructions to the left of QR code
        doc.setFontSize(9);
        let currentY = finalY;
        paymentInstructions.forEach((line) => {
          doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
          doc.text(line.text, margin, currentY);
          currentY += line.spacing;
        });
      } catch (error) {
        console.error('Error adding QR code:', error);
        // If QR code can't be loaded, just add payment instructions
        doc.setFontSize(9);
        let currentY = finalY;
        paymentInstructions.forEach((line) => {
          doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
          doc.text(line.text, margin, currentY);
          currentY += line.spacing;
        });
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });
      doc.text('Webtech Nepal Pvt. Ltd. | Kathmandu, Nepal | +977-1-4541620 | info@webtechnepal.com', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`${client.domainName || client.companyName || 'client'}-Payment Details-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    useImperativeHandle(ref, () => ({
      generateInvoice
    }));

    return null;
  }
);

DownloadInvoice.displayName = 'DownloadInvoice';

export default DownloadInvoice;