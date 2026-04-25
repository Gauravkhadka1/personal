"use client";

import React, { useState } from "react";
import { useGetClientsQuery, useGetClientByIdQuery } from "@/state/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import RichTextEditor from "@/components/RichTextEditor";
import Select from "react-select";

interface ServiceItem {
  id: string;
  description: string;
  amount: number;
}

interface CustomRow {
  id: string;
  description: string;
  percentage: number | null;
  amount: number;
  operation: "add" | "subtract";
}

const CreateInvoice = () => {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", description: "", amount: 0 },
  ]);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [vatType, setVatType] = useState<"non-vat" | "vat">("vat");
  const [notes, setNotes] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customRows, setCustomRows] = useState<CustomRow[]>([]);

  const { data: clients, isLoading: clientsLoading } = useGetClientsQuery();
  const { data: selectedClient, isLoading: clientLoading } =
    useGetClientByIdQuery(selectedClientId as any, { skip: !selectedClientId });

  // Create client options that include domainName for searchability
  // Show domainName in search results if available, otherwise company name
  const clientOptions = clients
    ?.map((client: any) => ({
      value: client.id.toString(),
      // For display in dropdown: show domainName if available, otherwise company name
      label: (client.domainName && client.domainName.trim() !== "") 
        ? client.domainName 
        : (client.companyName || "Unnamed Client"),
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      companyAddress: client.companyAddress,
      companyPhone: client.companyPhone,
      contactPersonEmail: client.contactPersonEmail,
      domainName: client.domainName,
      searchableString: `${client.companyName} ${client.domainName} ${client.contactPerson}`.toLowerCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const calculateTotals = () => {
    const subtotal = services.reduce(
      (sum, service) => sum + (service.amount || 0),
      0,
    );

    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === "percentage") {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }

    const afterDiscount = subtotal - discountAmount;
    const vatAmount = vatType === "vat" ? afterDiscount * 0.13 : 0;
    const total = afterDiscount + vatAmount;

    // Calculate custom rows amounts based on percentage of total
    // Each row independently adds or subtracts based on its own operation
    const updatedCustomRows = customRows.map(row => {
      let amount = 0;
      if (row.percentage !== null && row.percentage !== 0) {
        amount = (total * Math.abs(row.percentage)) / 100;
        // If subtract operation, make amount negative
        if (row.operation === "subtract") {
          amount = -amount;
        }
      }
      return { ...row, amount };
    });

    // Calculate final amount: total plus/minus all custom adjustments
    const totalAdjustment = updatedCustomRows.reduce((sum, row) => sum + row.amount, 0);
    const finalAmount = total + totalAdjustment;

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      vatAmount,
      total,
      customRows: updatedCustomRows,
      finalAmount,
    };
  };

  const totals = calculateTotals();

  const addServiceRow = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), description: "", amount: 0 },
    ]);
  };

  const removeServiceRow = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter((service) => service.id !== id));
    }
  };

  const updateServiceAmount = (id: string, amount: number) => {
    setServices(
      services.map((service) =>
        service.id === id ? { ...service, amount } : service,
      ),
    );
  };

  const updateServiceDescription = (id: string, description: string) => {
    setServices(
      services.map((service) =>
        service.id === id ? { ...service, description } : service,
      ),
    );
  };

  // Custom row functions
  const addCustomRow = () => {
    setCustomRows([
      ...customRows,
      { id: Date.now().toString(), description: "", percentage: null, amount: 0, operation: "subtract" },
    ]);
  };

  const removeCustomRow = (id: string) => {
    setCustomRows(customRows.filter((row) => row.id !== id));
  };

  const updateCustomRowDescription = (id: string, description: string) => {
    setCustomRows(
      customRows.map((row) =>
        row.id === id ? { ...row, description } : row,
      ),
    );
  };

  const updateCustomRowPercentage = (id: string, percentage: number) => {
    setCustomRows(
      customRows.map((row) => {
        if (row.id === id) {
          let amount = 0;
          if (percentage !== null && percentage !== 0) {
            amount = (totals.total * Math.abs(percentage)) / 100;
            if (row.operation === "subtract") {
              amount = -amount;
            }
          }
          return { ...row, percentage, amount };
        }
        return row;
      }),
    );
  };

  const updateCustomRowOperation = (id: string, operation: "add" | "subtract") => {
    setCustomRows(
      customRows.map((row) => {
        // Only update the specific row that matches the id
        if (row.id === id) {
          let amount = 0;
          if (row.percentage !== null && row.percentage !== 0) {
            amount = (totals.total * Math.abs(row.percentage)) / 100;
            if (operation === "subtract") {
              amount = -amount;
            }
          }
          return { ...row, operation, amount };
        }
        // Keep other rows unchanged - they keep their own operation
        return row;
      }),
    );
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const generatePDF = async () => {
    if (!selectedClient) {
      alert("Please select a client");
      return;
    }

    if (
      services.some(
        (s) => !s.description || s.description === "<p></p>" || s.amount <= 0,
      )
    ) {
      alert("Please fill in all service descriptions and amounts");
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 25;

      doc.setTextColor(80, 80, 80);

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("PAYMENT DETAILS", pageWidth / 2, 25, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Webtech Nepal Pvt. Ltd.", pageWidth / 2, 35, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text(
        "Hattigauda, Kathmandu, Nepal | Phone: +977-1-4541620",
        pageWidth / 2,
        40,
        { align: "center" },
      );
      doc.text(
        "Email: info@webtechnepal.com | www.webtechnepal.com",
        pageWidth / 2,
        45,
        { align: "center" },
      );

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 50, pageWidth - margin, 50);

      doc.setFontSize(10);
      doc.text(
        `Invoice Date: ${new Date().toLocaleDateString()}`,
        pageWidth - margin,
        65,
        { align: "right" },
      );

      const toX = margin;
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", toX, 70);
      doc.setFont("helvetica", "normal");
      // Show company name in bill
      doc.text(selectedClient.companyName || "", toX, 75);
      doc.text(selectedClient.contactPerson || "", toX, 80);
      doc.text(selectedClient.companyAddress || "", toX, 85);
      if (selectedClient.companyPhone) {
        doc.text(`${selectedClient.companyPhone}`, toX, 90);
      }
      if (selectedClient.contactPersonEmail) {
        doc.text(`${selectedClient.contactPersonEmail}`, toX, 95);
      }

      const tableColumn = ["S.NO.", "DESCRIPTION", "AMOUNT (NPR)"];
      const tableRows: any[] = [];

      services.forEach((service, index) => {
        const plainTextDescription = stripHtml(service.description);
        tableRows.push([
          index + 1,
          plainTextDescription,
          `Rs. ${service.amount.toFixed(2)}`,
        ]);
      });

      // Subtotal
      tableRows.push([
        { content: "Subtotal", colSpan: 2, styles: { fontStyle: "bold", halign: "center" } },
        { content: `Rs. ${totals.subtotal.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold" } },
      ]);

      // Discount (if applied)
      if (discountValue > 0) {
        const discountText = discountType === "percentage"
          ? `Discount (${discountValue}%)`
          : "Discount";
        tableRows.push([
          { content: discountText, colSpan: 2, styles: { fontStyle: "bold", halign: "center", textColor: [220, 38, 38] } },
          { content: `-Rs. ${totals.discountAmount.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold", textColor: [220, 38, 38] } },
        ]);
      }

      // After Discount
      if (discountValue > 0) {
        tableRows.push([
          { content: "After Discount", colSpan: 2, styles: { fontStyle: "bold", halign: "center" } },
          { content: `Rs. ${totals.afterDiscount.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold" } },
        ]);
      }

      // VAT
      if (vatType === "vat" && totals.vatAmount > 0) {
        tableRows.push([
          { content: "VAT (13%)", colSpan: 2, styles: { fontStyle: "bold", halign: "center" } },
          { content: `Rs. ${totals.vatAmount.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold" } },
        ]);
      }

      // TOTAL
      tableRows.push([
        { content: "TOTAL", colSpan: 2, styles: { fontStyle: "bold", halign: "center", fillColor: [232, 233, 237] } },
        { content: `Rs. ${totals.total.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold", fillColor: [232, 233, 237] } },
      ]);

      // Add custom rows after Total - each row independent
      for (const row of totals.customRows) {
        if (row.description && row.percentage !== null && row.percentage !== 0) {
          const displayText = row.operation === "subtract"
            ? `${row.description} (${row.percentage}% Paid)`
            : `${row.description} (${row.percentage}% Due)`;
          const amountValue = Math.abs(row.amount);
          // Red for Paid (subtract), Green for Due (add)
          const amountColor = row.operation === "subtract" ? [220, 38, 38] : [34, 197, 94];
          
          tableRows.push([
            { content: displayText, colSpan: 2, styles: { fontStyle: "bold", halign: "center", textColor: amountColor } },
            { content: `${row.operation === "subtract" ? "-" : "+"} Rs. ${amountValue.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold", textColor: amountColor } },
          ]);
        }
      }

      // Show final amount - this is the actual amount due/remaining
      if (totals.customRows.length > 0 && totals.finalAmount !== totals.total) {
        const finalAmountValue = Math.abs(totals.finalAmount);
        // Determine color: if final amount is less than total (meaning paid some), show green? 
        // Actually final due should be red if positive amount needs to be paid
        const finalColor = totals.finalAmount > 0 ? [220, 38, 38] : [34, 197, 94];
        const labelText = totals.finalAmount > 0 ? "TOTAL DUE" : "CREDIT BALANCE";
        
        tableRows.push([
          { content: labelText, colSpan: 2, styles: { fontStyle: "bold", halign: "center", fillColor: [254, 242, 242], textColor: finalColor } },
          { content: `Rs. ${finalAmountValue.toFixed(2)}`, styles: { halign: "right", fontStyle: "bold", fillColor: [254, 242, 242], textColor: finalColor } },
        ]);
      }

      autoTable(doc, {
        startY: 105,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [255, 255, 255],
          textColor: [80, 80, 80],
          fillColor: [245, 246, 248],
        },
        headStyles: {
          fillColor: [232, 233, 237],
          textColor: [80, 80, 80],
          fontStyle: "bold",
          lineColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 20, halign: "center", lineWidth: 0.5 },
          1: { cellWidth: "auto", lineWidth: 0.5 },
          2: { cellWidth: 45, halign: "right", lineWidth: 0.5 },
        },
        margin: { left: margin, right: margin },
      });

      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      
      // Show amount in words for FINAL AMOUNT (the actual due/remaining balance)
      const amountForWords = totals.customRows.length > 0 && totals.finalAmount !== totals.total 
        ? Math.abs(totals.finalAmount)
        : totals.total;
      
      // Determine the text prefix for amount in words
      const amountPrefix = (totals.customRows.length > 0 && totals.finalAmount !== totals.total && totals.finalAmount > 0) 
        ? "Total Due in Words: " 
        : "Amount in Words: ";
      
      doc.text(
        `${amountPrefix}${getAmountInWords(amountForWords)}`,
        margin,
        finalY,
      );

      finalY += 10;

      if (notes && notes !== "<p></p>") {
        const plainTextNotes = stripHtml(notes);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Notes:", margin, finalY + 15);
        doc.setFont("helvetica", "normal");
        const splitNotes = doc.splitTextToSize(
          plainTextNotes,
          pageWidth - margin * 2,
        );
        doc.text(splitNotes, margin, finalY + 20);
        finalY += 35;
      }

      const paymentY = finalY + 10;

      try {
        const qrCodePath = "/qr.png";
        const qrCodeResponse = await fetch(qrCodePath);
        const qrCodeBlob = await qrCodeResponse.blob();
        const qrCodeBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(qrCodeBlob);
        });

        const qrCodeWidth = 40;
        const qrCodeHeight = 40;
        const qrCodeX = pageWidth - margin - qrCodeWidth;
        const qrCodeY = paymentY;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Scan to Pay", qrCodeX + qrCodeWidth / 2, qrCodeY - 5, {
          align: "center",
        });

        doc.addImage(
          qrCodeBase64,
          "PNG",
          qrCodeX,
          qrCodeY,
          qrCodeWidth,
          qrCodeHeight,
        );
      } catch (error) {
        console.error("Error loading QR code:", error);
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Instructions:", margin, paymentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      let currentY = paymentY + 6;
      doc.text("Please find bank details below for payment:", margin, currentY);
      currentY += 5;
      doc.text("- Bank: NIC ASIA Bank Ltd.", margin, currentY);
      currentY += 5;
      doc.text("- Account Name: WEBTECH NEPAL PVT. LTD", margin, currentY);
      currentY += 5;
      doc.text("- Account Number: 6341498288524001", margin, currentY);
      currentY += 5;
      doc.text("- Branch: Lazimpat", margin, currentY);
      currentY += 5;
      doc.text("- SWIFT: NICENPKA", margin, currentY);
      currentY += 8;

      doc.setFont("helvetica", "italic");
      doc.text(
        "Note: Kindly ensure that you scan the deposit slip and email it",
        margin,
        currentY,
      );
      currentY += 5;
      doc.text(
        "to business@webtechnepal.com for our records.",
        margin,
        currentY,
      );
      currentY += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Thank you!", margin, currentY);

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Thank you for your business!",
        pageWidth / 2,
        doc.internal.pageSize.height - 15,
        { align: "center" },
      );
      doc.text(
        "Webtech Nepal Pvt. Ltd. | Hattigauda, Kathmandu, Nepal | info@webtechnepal.com",
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" },
      );

      doc.save(`${selectedClient.companyName}- Payment Details.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setServices([{ id: "1", description: "", amount: 0 }]);
    setDiscountType("percentage");
    setDiscountValue(0);
    setVatType("vat");
    setNotes("");
    setCustomRows([]);
  };

  // Custom filter function to search by companyName or domainName
  const customFilter = (option: any, inputValue: string) => {
    const searchTerm = inputValue.toLowerCase();
    return option.data.searchableString.includes(searchTerm);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-[#0a0a0a]">
              Create Invoice
            </h1>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left Column - Form */}
              <div>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Client (search by name, domain, or contact) *
                  </label>
                  <Select
                    options={clientOptions}
                    value={
                      clientOptions?.find(
                        (option) => option.value === selectedClientId,
                      ) || null
                    }
                    onChange={(selectedOption) => {
                      setSelectedClientId(selectedOption?.value || "");
                    }}
                    placeholder="Search and select client..."
                    isSearchable
                    isClearable
                    isLoading={clientsLoading}
                    filterOption={customFilter}
                    noOptionsMessage={() => "No clients found"}
                    styles={{
                      control: (base, { isFocused }) => ({
                        ...base,
                        backgroundColor: "white",
                        borderColor: isFocused ? "#3b82f6" : "#d1d5db",
                        borderWidth: "1px",
                        borderRadius: "0.5rem",
                        boxShadow: isFocused ? "0 0 0 1px #3b82f6" : "none",
                        "&:hover": {
                          borderColor: "#3b82f6",
                        },
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: "white",
                        borderColor: "#e5e7eb",
                        borderWidth: "1px",
                        borderRadius: "0.5rem",
                        marginTop: "4px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        zIndex: 9999,
                      }),
                      menuList: (base) => ({
                        ...base,
                        padding: 0,
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "#eff6ff"
                          : isFocused
                            ? "#f3f4f6"
                            : "transparent",
                        color: "#111827",
                        cursor: "pointer",
                        "&:active": {
                          backgroundColor: "#e5e7eb",
                        },
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "#111827",
                      }),
                      input: (base) => ({
                        ...base,
                        color: "#111827",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#9ca3af",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        color: "#6b7280",
                        "&:hover": {
                          color: "#374151",
                        },
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        color: "#6b7280",
                        "&:hover": {
                          color: "#374151",
                        },
                      }),
                      indicatorSeparator: (base) => ({
                        ...base,
                        backgroundColor: "#e5e7eb",
                      }),
                    }}
                  />
                </div>

                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Services *
                    </label>
                    <button
                      type="button"
                      onClick={addServiceRow}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      + Add Service
                    </button>
                  </div>

                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="mb-3 flex items-start gap-3">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Service Description *
                            </label>
                            <RichTextEditor
                              content={service.description}
                              onContentChange={(content) =>
                                updateServiceDescription(service.id, content)
                              }
                              placeholder="Enter service description... (Press Enter for new line)"
                              className="min-h-[30px]"
                            />
                          </div>
                          <div className="w-36">
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Amount (NPR) *
                            </label>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={service.amount || ""}
                              onChange={(e) =>
                                updateServiceAmount(
                                  service.id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeServiceRow(service.id)}
                              className="mt-6 px-2 py-2 text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount Section */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Discount Type
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={discountType}
                      onChange={(e) =>
                        setDiscountType(
                          e.target.value as "percentage" | "fixed",
                        )
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (NPR)</option>
                    </select>
                    <input
                      type="number"
                      placeholder={
                        discountType === "percentage"
                          ? "Discount %"
                          : "Discount Amount"
                      }
                      value={discountValue || ""}
                      onChange={(e) =>
                        setDiscountValue(parseFloat(e.target.value) || 0)
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    VAT Status
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="vat"
                        checked={vatType === "vat"}
                        onChange={() => setVatType("vat")}
                        className="text-blue-600"
                      />
                      <span>VAT (13%)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="non-vat"
                        checked={vatType === "non-vat"}
                        onChange={() => setVatType("non-vat")}
                        className="text-blue-600"
                      />
                      <span>Non-VAT</span>
                    </label>
                  </div>
                </div>

                {/* Custom Percentage Rows Section - After VAT and before Notes */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Adjustments (e.g., Advance Paid, Due Amount)
                    </label>
                    <button
                      type="button"
                      onClick={addCustomRow}
                      className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                    >
                      + Add Row
                    </button>
                  </div>
                  <div className="space-y-3">
                    {customRows.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Description
                            </label>
                            <input
                              type="text"
                              placeholder={row.operation === "subtract" ? "e.g., Advance Paid" : "e.g., Due Amount"}
                              value={row.description}
                              onChange={(e) =>
                                updateCustomRowDescription(row.id, e.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="w-28">
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Type
                            </label>
                            <select
                              value={row.operation}
                              onChange={(e) =>
                                updateCustomRowOperation(row.id, e.target.value as "add" | "subtract")
                              }
                              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="subtract" className="text-red-600">Paid (Red)</option>
                              <option value="add" className="text-green-600">Due (Green)</option>
                            </select>
                          </div>
                          <div className="w-28">
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Percentage (%)
                            </label>
                            <input
                              type="number"
                              placeholder="%"
                              value={row.percentage || ""}
                              onChange={(e) =>
                                updateCustomRowPercentage(
                                  row.id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="w-36">
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Amount
                            </label>
                            <input
                              type="text"
                              value={`${row.operation === "subtract" ? "-" : "+"} Rs. ${Math.abs(row.amount).toFixed(2)}`}
                              readOnly
                              className={`w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 ${
                                row.operation === "subtract" ? "text-red-600" : "text-green-600"
                              }`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomRow(row.id)}
                            className="mt-6 px-2 py-2 text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {row.operation === "subtract" 
                            ? `Subtract ${row.percentage || 0}% from total` 
                            : `Add ${row.percentage || 0}% to total`}
                        </p>
                      </div>
                    ))}
                    {customRows.length === 0 && (
                      <p className="text-sm text-gray-400 italic">
                        Add rows for advance payments (subtract/red) or additional dues (add/green).
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <RichTextEditor
                    content={notes}
                    onContentChange={setNotes}
                    placeholder="Additional notes or payment terms... (Press Enter for new line)"
                    className="min-h-[30px]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={generatePDF}
                    disabled={
                      isGenerating ||
                      !selectedClientId ||
                      services.some(
                        (s) =>
                          !s.description ||
                          s.description === "<p></p>" ||
                          s.amount <= 0,
                      )
                    }
                    className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isGenerating ? "Downloading..." : "Download Invoice"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Invoice Preview
                </h3>

                {selectedClient ? (
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <p className="text-sm text-gray-600">Bill To:</p>
                      <p className="font-medium">
                        {selectedClient.companyName || selectedClient.domainName}
                      </p>
                      <p className="text-sm">{selectedClient.contactPerson}</p>
                      <p className="text-sm">{selectedClient.companyAddress}</p>
                      {selectedClient.companyPhone && (
                        <p className="text-sm">{selectedClient.companyPhone}</p>
                      )}
                      {selectedClient.contactPersonEmail && (
                        <p className="text-sm">
                          {selectedClient.contactPersonEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 text-left">Description</th>
                            <th className="py-2 text-right">Amount (NPR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((service, idx) => (
                            <tr key={service.id} className="border-b">
                              <td className="py-2">
                                <div
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: service.description || "-",
                                  }}
                                />
                              </td>
                              <td className="py-2 text-right">
                                {service.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t pt-2">
                            <td className="py-2 text-center font-medium">Subtotal</td>
                            <td className="py-2 text-right">
                              {totals.subtotal.toFixed(2)}
                            </td>
                          </tr>
                          {discountValue > 0 && (
                            <tr>
                              <td className="py-2 text-center text-red-600">
                                Discount (
                                {discountType === "percentage"
                                  ? `${discountValue}%`
                                  : ""}
                                )
                              </td>
                              <td className="py-2 text-right text-red-600">
                                -{totals.discountAmount.toFixed(2)}
                              </td>
                            </tr>
                          )}
                          {discountValue > 0 && (
                            <tr>
                              <td className="py-2 text-center">After Discount</td>
                              <td className="py-2 text-right">
                                {totals.afterDiscount.toFixed(2)}
                              </td>
                            </tr>
                          )}
                          {vatType === "vat" && totals.vatAmount > 0 && (
                            <tr>
                              <td className="py-2 text-center">VAT (13%)</td>
                              <td className="py-2 text-right">
                                {totals.vatAmount.toFixed(2)}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-gray-100">
                            <td className="py-2 text-center font-bold">TOTAL</td>
                            <td className="py-2 text-right text-lg font-bold">
                              Rs. {totals.total.toFixed(2)}
                            </td>
                          </tr>
                          {/* Custom rows in preview - each row independent */}
                          {totals.customRows.map((row) => (
                            <tr key={row.id} className={row.operation === "subtract" ? "border-t border-red-200 bg-red-50" : "border-t border-green-200 bg-green-50"}>
                              <td className={`py-2 text-center font-medium ${row.operation === "subtract" ? "text-red-700" : "text-green-700"}`}>
                                {row.description} 
                                {row.percentage !== null && ` (${row.percentage}${row.operation === "subtract" ? "% Paid)" : "% Due)"}`}
                              </td>
                              <td className={`py-2 text-right font-medium ${row.operation === "subtract" ? "text-red-700" : "text-green-700"}`}>
                                {row.operation === "subtract" ? "-" : "+"} Rs. {Math.abs(row.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {/* Final Amount row - shows actual due/remaining */}
                          {totals.customRows.length > 0 && totals.finalAmount !== totals.total && (
                            <tr className="bg-blue-50">
                              <td className={`py-2 text-center font-bold ${totals.finalAmount > 0 ? "text-red-700" : "text-green-700"}`}>
                                {totals.finalAmount > 0 ? "TOTAL DUE" : "CREDIT BALANCE"}
                              </td>
                              <td className={`py-2 text-right font-bold ${totals.finalAmount > 0 ? "text-red-700" : "text-green-700"}`}>
                                Rs. {Math.abs(totals.finalAmount).toFixed(2)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Amount in Words preview for final amount (actual due) */}
                    {totals.customRows.length > 0 && totals.finalAmount !== totals.total ? (
                      <div className={`mt-2 text-sm italic ${totals.finalAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {totals.finalAmount > 0 ? "Total Due in Words:" : "Credit Balance in Words:"} {getAmountInWords(Math.abs(totals.finalAmount))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        Amount in Words: {getAmountInWords(totals.total)}
                      </div>
                    )}

                    {notes && notes !== "<p></p>" && (
                      <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3">
                        <p className="mb-1 text-sm font-medium text-gray-700">
                          Notes:
                        </p>
                        <div
                          className="prose prose-sm max-w-none text-sm text-gray-700"
                          dangerouslySetInnerHTML={{ __html: notes }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    Select a client to see invoice preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const numberToWords = (num: number): string => {
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

  if (num === 0) return "Zero";

  let words = "";

  if (num >= 1000) {
    words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }

  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }

  if (num > 0) {
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += " " + ones[num % 10];
      }
    }
  }

  return words.trim();
};

const getAmountInWords = (amount: number): string => {
  const rupees = Math.floor(amount);
  const paisa = Math.round((amount - rupees) * 100);

  let words = numberToWords(rupees) + " Rupees";

  if (paisa > 0) {
    words += " and " + numberToWords(paisa) + " Paisa";
  }

  return words + " Only";
};

export default CreateInvoice;