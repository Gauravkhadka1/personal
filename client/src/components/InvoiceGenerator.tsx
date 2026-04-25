"use client";

import React from "react";
import { Client } from "@/state/api";
import { saveAs } from "file-saver";
import { Packer } from "docx";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MenuItem } from "@mui/material";
import dynamic from "next/dynamic";

interface InvoiceGeneratorProps {
  client: Client;
  services: {
    type: string;
    expiry: string | Date | undefined;
    amount: number | undefined;
  }[];
  totalAmount: number;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  client,
  services,
  totalAmount,
}) => {
  // Helper function to format date
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to calculate service period (1 year before expiry)
  const getServicePeriod = (expiry: string | Date | undefined) => {
    if (!expiry) return "N/A";
    
    const expiryDate = new Date(expiry);
    const startDate = new Date(expiryDate);
    startDate.setFullYear(expiryDate.getFullYear() - 1);
    
    return `${formatDate(startDate)} - ${formatDate(expiryDate)}`;
  };

  // Helper function to convert number to words
  const numberToWords = (num: number): string => {
    const units = [
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
    ];
    const teens = [
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
      "Ten",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + units[num % 10] : "")
      );
    if (num < 1000)
      return (
        units[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " and " + numberToWords(num % 100) : "")
      );
    if (num < 100000)
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + numberToWords(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        numberToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + numberToWords(num % 100000) : "")
      );
    return (
      numberToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + numberToWords(num % 10000000) : "")
    );
  };

  // Calculate VAT if applicable (assuming VAT is 13%)
  const calculateVat = (amount: number) => {
    if (client.webDesignVatType === "inclusive") {
      // VAT is already included in the amount
      return (amount * 13) / 113;
    } else if (client.webDesignVatType === "exclusive") {
      // VAT needs to be added
      return amount * 0.13;
    }
    return 0; // non-vat
  };

  const vatAmount = calculateVat(totalAmount);
  const subtotal =
    client.webDesignVatType === "inclusive"
      ? totalAmount - vatAmount
      : totalAmount;
  const grandTotal =
    client.webDesignVatType === "exclusive"
      ? totalAmount + vatAmount
      : totalAmount;

  // Generate Word Invoice
  const generateWordInvoice = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Header
            new Paragraph({
              text: "Payment Details",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Company Info
            new Paragraph({
              children: [
                new TextRun({
                  text: "From:",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              text: "Webtech Nepal Pvt. Ltd",
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: "Lazimpat, Kathmandu, Nepal",
            }),
            new Paragraph({
              text: "01-4541620",
            }),
            new Paragraph({
              text: "info@webtechnepal.com",
              spacing: { after: 200 },
            }),

            // Client Info
            new Paragraph({
              children: [
                new TextRun({
                  text: "To:",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              text: client.companyName || "N/A",
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: client.companyAddress || "N/A",
            }),
            new Paragraph({
              text: client.companyPhone || "N/A",
            }),
            new Paragraph({
              text: client.companyEmail || "N/A",
              spacing: { after: 200 },
            }),

            // Invoice Details
            new Paragraph({
              children: [
                new TextRun({
                  text: "Invoice Details",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              text: `Invoice Date: ${formatDate(new Date())}`,
            }),
            new Paragraph({
              text: `PAN/VAT: ${client.pan_vat_num || "N/A"}`,
              spacing: { after: 200 },
            }),

            // Services Table
            new Paragraph({
              text: "Services",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),

            // Table simulation
            new Paragraph({
              children: [
                new TextRun({
                  text: "Description",
                  bold: true,
                }),
                new TextRun({
                  text: "\tService Period",
                  bold: true,
                }),
                new TextRun({
                  text: "\tAmount",
                  bold: true,
                }),
              ],
            }),
            ...services.flatMap((service) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${service.type}\nDomain: ${client.domainName || "N/A"}`,
                  }),
                  new TextRun({
                    text: `\t${getServicePeriod(service.expiry)}`,
                  }),
                  new TextRun({
                    text: `\tRs. ${service.amount?.toFixed(2) || "0.00"}`,
                  }),
                ],
                spacing: { after: 50 },
              }),
            ]),

            // Totals
            new Paragraph({
              text: "Subtotal:",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200 },
            }),
            new Paragraph({
              text: `Rs. ${subtotal.toFixed(2)}`,
            }),

            // Conditionally include VAT paragraphs
            ...(client.webDesignVatType !== "non-vat"
              ? [
                  new Paragraph({
                    text: `VAT (13%):`,
                    heading: HeadingLevel.HEADING_3,
                  }),
                  new Paragraph({
                    text: `Rs. ${vatAmount.toFixed(2)}`,
                  }),
                ]
              : []),

            new Paragraph({
              text: "Total:",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
              text: `Rs. ${grandTotal.toFixed(2)}`,
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Amount in words: ${numberToWords(Math.floor(grandTotal))} Rupees Only`,
                  italics: true,
                }),
              ],
            }),

            // Footer
            new Paragraph({
              text: "Thank you for your business!",
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    });

    // Generate the Word document
    const blob = await Packer.toBlob(doc);
    saveAs(
      blob,
      `Invoice_${client.companyName || client.domainName || "Client"}.docx`,
    );
  };

  // Generate PDF Invoice
  const generatePdfInvoice = () => {
    const doc = new jsPDF();

    // Add logo or header
    doc.setFontSize(20);
    doc.text("Invoice", 105, 20, { align: "center" });

    // Company Info
    doc.setFontSize(12);
    doc.text("From:", 14, 30);
    doc.text("Webtech Nepal Pvt. Ltd", 14, 36);
    doc.text("Lazimpat, Kathmandu, Nepal", 14, 42);
    doc.text("01-4541620", 14, 48);
    doc.text("info@webtechnepal.com", 14, 54);

    // Client Info
    doc.text("To:", 105, 30);
    doc.text(client.companyName || "N/A", 105, 36);
    doc.text(client.companyAddress || "N/A", 105, 42);
    doc.text(client.companyPhone || "N/A", 105, 48);
    doc.text(client.companyEmail || "N/A", 105, 54);

    // Invoice Details
    doc.text(`Invoice Date: ${formatDate(new Date())}`, 14, 66);
    doc.text(`PAN/VAT: ${client.pan_vat_num || "N/A"}`, 14, 72);

    // Services Table
    const serviceData = services.map((service) => [
      `${service.type} Service \n (${client.domainName || "N/A"})`,
      getServicePeriod(service.expiry),
      `Rs. ${service.amount?.toFixed(2) || "0.00"}`,
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Description", "Service Period", "Amount"]],
      body: serviceData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 80, valign: 'middle' },
        1: { cellWidth: 60, valign: 'middle' },
        2: { cellWidth: 30, valign: 'middle' }
      },
      styles: {
        minCellHeight: 20,
        lineColor: [41, 128, 185],
        lineWidth: 0.5
      }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 150, finalY);
    if (client.webDesignVatType !== "non-vat") {
      doc.text(`VAT (13%): Rs. ${vatAmount.toFixed(2)}`, 150, finalY + 6);
    }
    doc.setFont("helvetica", "bold");
    doc.text(`Total: Rs. ${grandTotal.toFixed(2)}`, 150, finalY + 12);
    doc.setFont("helvetica", "normal");

    // Amount in words
    doc.text(
      `Amount in words: ${numberToWords(Math.floor(grandTotal))} Rupees Only`,
      14,
      finalY + 24,
    );

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, finalY + 36, {
      align: "center",
    });

    // Save the PDF
    doc.save(
      `Invoice_${client.companyName || client.domainName || "Client"}.pdf`,
    );
  };

  return (
    <>
      {/* <MenuItem onClick={generateWordInvoice}>Download Word Invoice</MenuItem> */}
      <MenuItem onClick={generatePdfInvoice}>Download Invoice</MenuItem>
    </>
  );
};

export default InvoiceGenerator;