"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareClientFields = void 0;
const compareClientFields = (existingClient, updatedData) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const changes = [];
    const formatValue = (value) => {
        if (value === null || value === undefined)
            return 'N/A';
        if (value instanceof Date)
            return value.toISOString().split('T')[0];
        if (typeof value === 'object')
            return JSON.stringify(value);
        return String(value);
    };
    // Helper function to add changes
    const addChange = (field, oldVal, newVal) => {
        const formattedOld = formatValue(oldVal);
        const formattedNew = formatValue(newVal);
        if (formattedOld !== formattedNew) {
            changes.push({
                field,
                oldValue: formattedOld,
                newValue: formattedNew
            });
        }
    };
    // Basic Info Fields
    addChange('Company Name', existingClient.companyName, updatedData.companyName);
    addChange('Domain Name', existingClient.domainName, updatedData.domainName);
    addChange('Company Email', existingClient.companyEmail, updatedData.companyEmail);
    addChange('Company Phone', existingClient.companyPhone, updatedData.companyPhone);
    addChange('Company Address', existingClient.companyAddress, updatedData.companyAddress);
    addChange('Status', existingClient.status, updatedData.status);
    // Contact Person Fields
    addChange('Contact Person', existingClient.contactPerson, updatedData.contactPerson);
    addChange('Contact Email', existingClient.contactPersonEmail, updatedData.contactPersonEmail);
    addChange('Contact Phone', existingClient.contactPersonPhone, updatedData.contactPersonPhone);
    // Web Design Fields
    addChange('Web Design Category', existingClient.webDesignCategories, updatedData.webDesignCategories);
    addChange('Tech Stack', existingClient.webDesignTechStack, updatedData.webDesignTechStack);
    addChange('Total Amount', existingClient.webDesignTotalAmount, updatedData.webDesignTotalAmount);
    addChange('Rating', existingClient.webDesignRating, updatedData.webDesignRating);
    addChange('VAT Type', existingClient.webDesignVatType, updatedData.webDesignVatType);
    // Domain Fields
    addChange('Domain Amount', existingClient.domainAmount, updatedData.domainAmount);
    addChange('Domain Type', existingClient.domainType, updatedData.domainType);
    addChange('Domain Active Date', existingClient.domainActiveDate, updatedData.domainActiveDate);
    addChange('Domain Expiry Date', existingClient.domainExpiryDate, updatedData.domainExpiryDate);
    // Hosting Fields
    addChange('Hosting Space', existingClient.hostingSpace, updatedData.hostingSpace);
    addChange('Hosting Type', existingClient.hostingType, updatedData.hostingType);
    addChange('Hosting Amount', existingClient.hostingAmount, updatedData.hostingAmount);
    addChange('Hosting Active Date', existingClient.hostingActiveDate, updatedData.hostingActiveDate);
    addChange('Hosting Expiry Date', existingClient.hostingExpiryDate, updatedData.hostingExpiryDate);
    // Maintenance Fields
    addChange('Maintenance Type', existingClient.maintenanceType, updatedData.maintenanceType);
    addChange('Maintenance Amount', existingClient.maintenanceAmount, updatedData.maintenanceAmount);
    addChange('Maintenance Active Date', existingClient.maintenanceActiveDate, updatedData.maintenanceActiveDate);
    addChange('Maintenance Expiry Date', existingClient.maintenanceExpiryDate, updatedData.maintenanceExpiryDate);
    const existingMicrosoftServices = existingClient.microsoftServices
        ? typeof existingClient.microsoftServices === 'string'
            ? JSON.parse(existingClient.microsoftServices)
            : existingClient.microsoftServices
        : [];
    const updatedMicrosoftServices = updatedData.microsoftServices
        ? typeof updatedData.microsoftServices === 'string'
            ? JSON.parse(updatedData.microsoftServices)
            : updatedData.microsoftServices
        : [];
    // Compare Microsoft services array length
    if (existingMicrosoftServices.length !== updatedMicrosoftServices.length) {
        changes.push({
            field: 'Microsoft Services Count',
            oldValue: existingMicrosoftServices.length.toString(),
            newValue: updatedMicrosoftServices.length.toString()
        });
    }
    else {
        // Compare individual service details if count is same
        for (let i = 0; i < existingMicrosoftServices.length; i++) {
            const prefix = `Microsoft Service ${i + 1}`;
            addChange(`${prefix} - Accounts`, (_a = existingMicrosoftServices[i]) === null || _a === void 0 ? void 0 : _a.noOfAccounts, (_b = updatedMicrosoftServices[i]) === null || _b === void 0 ? void 0 : _b.noOfAccounts);
            addChange(`${prefix} - Amount`, (_c = existingMicrosoftServices[i]) === null || _c === void 0 ? void 0 : _c.amount, (_d = updatedMicrosoftServices[i]) === null || _d === void 0 ? void 0 : _d.amount);
            addChange(`${prefix} - Service Type`, (_e = existingMicrosoftServices[i]) === null || _e === void 0 ? void 0 : _e.serviceType, (_f = updatedMicrosoftServices[i]) === null || _f === void 0 ? void 0 : _f.serviceType);
            addChange(`${prefix} - Active Date`, (_g = existingMicrosoftServices[i]) === null || _g === void 0 ? void 0 : _g.activeDate, (_h = updatedMicrosoftServices[i]) === null || _h === void 0 ? void 0 : _h.activeDate);
            addChange(`${prefix} - Expiry Date`, (_j = existingMicrosoftServices[i]) === null || _j === void 0 ? void 0 : _j.expiryDate, (_k = updatedMicrosoftServices[i]) === null || _k === void 0 ? void 0 : _k.expiryDate);
            // Compare purchase order paths (but not the actual file content)
            const oldPoPath = ((_l = existingMicrosoftServices[i]) === null || _l === void 0 ? void 0 : _l.purchaseOrderPath) || ((_m = existingMicrosoftServices[i]) === null || _m === void 0 ? void 0 : _m.purchaseOrder);
            const newPoPath = ((_o = updatedMicrosoftServices[i]) === null || _o === void 0 ? void 0 : _o.purchaseOrderPath) || ((_p = updatedMicrosoftServices[i]) === null || _p === void 0 ? void 0 : _p.purchaseOrder);
            if (oldPoPath !== newPoPath) {
                changes.push({
                    field: `${prefix} - Purchase Order`,
                    oldValue: oldPoPath ? 'File updated' : 'No file',
                    newValue: newPoPath ? 'File updated' : 'No file'
                });
            }
        }
    }
    return changes;
};
exports.compareClientFields = compareClientFields;
