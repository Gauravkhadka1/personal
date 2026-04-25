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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFollowupNote = exports.updateFollowupNote = exports.getFollowupNote = exports.addFollowupNote = exports.addReplyToProjectCommentReply = exports.likeProjectCommentReply = exports.addReplyToProjectComment = exports.likeProjectComment = exports.deleteProjectComment = exports.updateProjectComment = exports.getProjectComments = exports.addProjectComment = exports.updateClientProjectStatus = exports.renewClientService = exports.sendReminderEmail = exports.getClientActivityLogs = exports.deleteMultipleClients = exports.deleteClient = exports.updateClient = exports.getProjectSupportEndClient = exports.getClientById = exports.getClientsByDesignCriteria = exports.getClientDesignCounts = exports.getNewClientsCounts = exports.getClientCounts = exports.getClientsList = exports.getClientsForProjectPage = exports.getAvailableNepaliYearMonths = exports.getClientsForExpiryPage = exports.getAllProjectTimelines = exports.getClients = exports.createClient = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const clientActivityHelper_1 = require("../utils/clientActivityHelper");
const nodemailer_1 = __importDefault(require("nodemailer"));
const reminderEmailService_1 = require("../utils/reminderEmailService");
const nepaliCalendar_1 = require("../utils/nepaliCalendar");
const prisma = new client_1.PrismaClient();
const decodeToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET ||
            "045ffc1dc9a74ea1812af89ec2f03c531a56b144b984ce3f0413ab0e6202e7c6");
        return decoded;
    }
    catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};
let transporter;
const createTransporter = () => {
    if (transporter)
        return transporter;
    transporter = nodemailer_1.default.createTransport({
        pool: true, // Use connection pooling
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            // user: "renewal@webtechnepal.com",
            // pass: "ncskugqkkoijpylj",
            user: "workspace@webtechnepal.com",
            pass: "ikcasazktikvpvqn",
        },
    });
    return transporter;
};
// ============================================= Client Flie Upload Start ============================================
const UPLOAD_DIR = path_1.default.join(process.cwd(), "uploads");
// Ensure upload directory exists
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// File upload handler
const handleFileUpload = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new Error("No file provided");
    }
    return `uploads/${file.filename}`;
});
const deleteFileIfExists = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!filePath)
        return;
    try {
        const fullPath = path_1.default.join(process.cwd(), filePath);
        if (fs_1.default.existsSync(fullPath)) {
            yield fs_1.default.promises.unlink(fullPath);
        }
    }
    catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
});
const calculateDaysLeft = (expiryDate) => {
    if (!expiryDate)
        return "N/A";
    const now = new Date();
    const nepalOffset = 5.75 * 60 * 60 * 1000;
    const nepalTime = new Date(now.getTime() + nepalOffset);
    const today = new Date(nepalTime);
    today.setUTCHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};
// Helper function to create service object
const createService = (type, expiry, amount, vatType) => {
    var _a;
    return ({
        type,
        expiry: expiry !== null && expiry !== void 0 ? expiry : undefined,
        amount: amount !== null && amount !== void 0 ? amount : undefined,
        daysLeft: calculateDaysLeft(expiry),
        vatType: (_a = vatType) !== null && _a !== void 0 ? _a : undefined,
    });
};
// Add this function to calculate service expiry information
const calculateClientServiceExpiry = (client) => {
    const services = [];
    // Add web design installments
    if (client.webDesignInstallments) {
        try {
            const installments = typeof client.webDesignInstallments === "string"
                ? JSON.parse(client.webDesignInstallments)
                : client.webDesignInstallments;
            installments.forEach((installment) => {
                if (!installment.paid) {
                    services.push(createService(`Web Design Installment ${installment.number}`, installment.dueDate, installment.amount, client.webDesignVatType));
                }
            });
        }
        catch (e) {
            console.error("Error parsing installments:", e);
        }
    }
    // Add Microsoft services
    if (client.microsoftServices) {
        try {
            const msServices = typeof client.microsoftServices === "string"
                ? JSON.parse(client.microsoftServices)
                : client.microsoftServices;
            msServices.forEach((service) => {
                // Include vendor name in service type if specified
                const vendorPrefix = service.vendor ? `${service.vendor} - ` : "";
                services.push(createService(`${vendorPrefix}Microsoft (${service.noOfAccounts} accounts)`, service.expiryDate, service.amount, service.microsoftVatType));
            });
        }
        catch (e) {
            console.error("Error parsing Microsoft services:", e);
        }
    }
    // Add other services
    [
        {
            type: "Domain",
            expiry: client.domainExpiryDate,
            amount: client.domainAmount,
            vatType: client.domainVatType,
        },
        {
            type: "Hosting",
            expiry: client.hostingExpiryDate,
            amount: client.hostingAmount,
            vatType: client.hostingVatType,
        },
        {
            type: "Maintenance",
            expiry: client.maintenanceExpiryDate,
            amount: client.maintenanceAmount,
            vatType: client.maintenanceVatType,
        },
    ].forEach((service) => {
        if (service.expiry) {
            services.push(createService(service.type, service.expiry, service.amount, service.vatType));
        }
    });
    return services;
};
// ============================================= Client Flie Upload End ============================================
// =========================================== Client CRUD Start ============================================
//------------------------------------ Create Client Start ----------------------------------------
// =========================================== Client CRUD Start ===========================================
const createClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const decodedToken = decodeToken(token);
        if (!decodedToken || !decodedToken.userId) {
            res.status(401).json({ message: "Unauthorized: Invalid token" });
            return;
        }
        const creatorId = decodedToken.userId;
        // Get creator user details for email
        const creatorUser = yield prisma.user.findUnique({
            where: { userId: creatorId }, // Note: using userId field instead of id
            select: {
                username: true,
                firstname: true,
                lastname: true,
                email: true,
            },
        });
        if (!creatorUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Use username, or fallback to firstname + lastname, or just email
        const creatorDisplayName = creatorUser.username ||
            (creatorUser.firstname && creatorUser.lastname
                ? `${creatorUser.firstname} ${creatorUser.lastname}`
                : creatorUser.email);
        // Extract all fields from the form data
        const formData = req.body;
        const files = req.files;
        if (formData.domainName) {
            const existingClient = yield prisma.client.findFirst({
                where: {
                    domainName: formData.domainName,
                },
            });
            if (existingClient) {
                // Return more detailed information
                res.status(400).json({
                    error: "DOMAIN_EXISTS",
                    message: `The domain ${formData.domainName} is already associated with client ${existingClient.companyName}`,
                    existingClientId: existingClient.id,
                });
                return;
            }
        }
        let agreementPath = undefined;
        if ((_b = files["webDesignAgreement"]) === null || _b === void 0 ? void 0 : _b[0]) {
            agreementPath = yield handleFileUpload(files["webDesignAgreement"][0]);
        }
        // Parse installments if they exist
        let installments = [];
        if (formData.webDesignInstallments) {
            installments =
                typeof formData.webDesignInstallments === "string"
                    ? JSON.parse(formData.webDesignInstallments)
                    : formData.webDesignInstallments;
            for (let i = 0; i < installments.length; i++) {
                const receiptField = `webDesignInstallments[${i}][receiptFile]`;
                if ((_c = files[receiptField]) === null || _c === void 0 ? void 0 : _c[0]) {
                    installments[i].receipt = yield handleFileUpload(files[receiptField][0]);
                }
            }
        }
        let microsoftServices = [];
        if (formData.microsoftServices) {
            microsoftServices =
                typeof formData.microsoftServices === "string"
                    ? JSON.parse(formData.microsoftServices)
                    : formData.microsoftServices;
            for (let i = 0; i < microsoftServices.length; i++) {
                const poField = `microsoftServices[${i}][purchaseOrder]`;
                if ((_d = files[poField]) === null || _d === void 0 ? void 0 : _d[0]) {
                    microsoftServices[i].purchaseOrderPath = yield handleFileUpload(files[poField][0]);
                }
            }
        }
        // Parse projectTimeline if it exists
        let projectTimeline = [];
        if (formData.projectTimeline) {
            projectTimeline =
                typeof formData.projectTimeline === "string"
                    ? JSON.parse(formData.projectTimeline)
                    : formData.projectTimeline;
        }
        // Ensure each timeline item has a status
        if (projectTimeline.length > 0) {
            projectTimeline = projectTimeline.map((timeline) => (Object.assign(Object.assign({}, timeline), { status: timeline.status || "ToDo" })));
        }
        // Parse categories if they exist (as JSON string from frontend)
        let categories = [];
        if (formData.webDesignCategories) {
            categories = typeof formData.webDesignCategories === "string"
                ? JSON.parse(formData.webDesignCategories)
                : formData.webDesignCategories;
        }
        // Create the client
        const client = yield prisma.client.create({
            data: {
                companyName: formData.companyName || undefined,
                domainName: formData.domainName || undefined,
                companyEmail: formData.companyEmail || undefined,
                companyPhone: formData.companyPhone || undefined,
                companyAddress: formData.companyAddress || undefined,
                contactPerson: formData.contactPerson || undefined,
                contactPersonEmail: formData.contactPersonEmail || undefined,
                contactPersonPhone: formData.contactPersonPhone || undefined,
                additionalNotes: formData.additionalNotes || undefined,
                projectDescription: formData.projectDescription || undefined,
                // Add projectTimeline relation
                projectTimeline: projectTimeline.length > 0
                    ? {
                        create: projectTimeline.map((timeline) => ({
                            title: timeline.title || undefined,
                            description: timeline.description || undefined,
                            deadline: timeline.deadline
                                ? new Date(timeline.deadline)
                                : null,
                            status: timeline.status || "ToDo",
                        })),
                    }
                    : undefined,
                googleDriveLink: formData.googleDriveLink || undefined,
                startDate: formData.startDate ? new Date(formData.startDate) : null,
                endDate: formData.endDate ? new Date(formData.endDate) : null,
                pan_vat_num: formData.pan_vat_num || undefined,
                webDesignCategories: categories.length > 0 ? categories : undefined,
                webDesignTechStack: formData.webDesignTechStack || undefined,
                webDesignTotalAmount: formData.webDesignTotalAmount
                    ? parseFloat(formData.webDesignTotalAmount)
                    : 0,
                webDesignRating: formData.webDesignRating
                    ? parseInt(formData.webDesignRating)
                    : null,
                webDesignVatType: formData.webDesignVatType || undefined,
                webDesignAgreement: agreementPath,
                webDesignInstallments: installments.length > 0
                    ? JSON.parse(JSON.stringify(installments)) // Ensure proper JSON serialization
                    : undefined,
                domainActiveDate: formData.domainActiveDate
                    ? new Date(formData.domainActiveDate)
                    : null,
                domainExpiryDate: formData.domainExpiryDate
                    ? new Date(formData.domainExpiryDate)
                    : null,
                domainAmount: formData.domainAmount
                    ? parseFloat(formData.domainAmount)
                    : 0,
                domainType: formData.domainType || undefined,
                domainVatType: formData.domainVatType || undefined,
                hostingSpace: formData.hostingSpace || undefined,
                hostingType: formData.hostingType || undefined,
                hostingVatType: formData.hostingVatType || undefined,
                hostingActiveDate: formData.hostingActiveDate
                    ? new Date(formData.hostingActiveDate)
                    : null,
                hostingExpiryDate: formData.hostingExpiryDate
                    ? new Date(formData.hostingExpiryDate)
                    : null,
                hostingAmount: formData.hostingAmount
                    ? parseFloat(formData.hostingAmount)
                    : 0,
                microsoftServices: microsoftServices.length > 0
                    ? JSON.parse(JSON.stringify(microsoftServices.map((service) => ({
                        noOfAccounts: service.noOfAccounts,
                        amount: service.amount,
                        activeDate: service.activeDate
                            ? new Date(service.activeDate)
                            : null,
                        expiryDate: service.expiryDate
                            ? new Date(service.expiryDate)
                            : null,
                        serviceType: service.serviceType,
                        microsoftVatType: service.microsoftVatType,
                        vendor: service.vendor,
                        purchaseOrder: service.purchaseOrderPath,
                    }))))
                    : undefined,
                maintenanceType: formData.maintenanceType || undefined,
                maintenanceVatType: formData.maintenanceVatType || undefined,
                maintenanceAmount: formData.maintenanceAmount
                    ? parseFloat(formData.maintenanceAmount)
                    : 0,
                maintenanceActiveDate: formData.maintenanceActiveDate
                    ? new Date(formData.maintenanceActiveDate)
                    : null,
                maintenanceExpiryDate: formData.maintenanceExpiryDate
                    ? new Date(formData.maintenanceExpiryDate)
                    : null,
                maintenanceDescription: formData.maintenanceDescription || undefined,
            },
        });
        yield prisma.activityLog.create({
            data: {
                action: "CREATE",
                details: `Client ${client.companyName} created`,
                userId: creatorId,
                clientId: client.id,
            },
        });
        // Send email notification after client is created
        // Send email notification after client is created
        try {
            const transporter = createTransporter();
            const emailSubject = `🎉 New Client Created: ${client.companyName}`;
            yield transporter.sendMail({
                from: '"Workspace_Webtech" <workspace@webtechnepal.com>',
                to: "gaurav@webtech.com.np",
                subject: emailSubject,
                text: `${creatorDisplayName} created a new client ${client.companyName} ${client.domainName || ""}. View client: https://webtech.mobi.np/clients/${client.id}`,
                html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          /* Include all the CSS from above */
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 20px; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
          .email-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
          .email-body { padding: 40px 30px; }
          .client-card { background: #f8fafc; border-radius: 8px; padding: 24px; margin: 20px 0; border-left: 4px solid #667eea; }
          .client-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
          .info-item { margin-bottom: 12px; }
          .info-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: 500; color: #1e293b; }
          .creator-section { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 24px 0; display: flex; align-items: center; gap: 16px; }
          .creator-avatar { width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 18px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
          .email-footer { background: #f1f5f9; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
          @media (max-width: 600px) { .client-info { grid-template-columns: 1fr; } .email-body, .email-header { padding: 30px 20px; } }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>New Client Created</h1>
          </div>
          <div class="email-body">
            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
              Hello Team,<br> ${creatorDisplayName} created a new Client.
            </p>
            <div class="client-card">
              <h3 style="color: #1e293b; margin-bottom: 16px; font-size: 18px;">📋 Client Details</h3>
              <div class="client-info">
                <div class="info-item">
                  <div class="info-label">Company Name</div>
                  <div class="info-value">${client.companyName}</div>
                </div>
                ${client.domainName
                    ? `
                <div class="info-item">
                  <div class="info-label">Domain</div>
                  <div class="info-value">${client.domainName}</div>
                </div>
                `
                    : ""}
                ${client.companyEmail
                    ? `
                <div class="info-item">
                  <div class="info-label">Company Email</div>
                  <div class="info-value">${client.companyEmail}</div>
                </div>
                `
                    : ""}
                ${client.contactPerson
                    ? `
                <div class="info-item">
                  <div class="info-label">Contact Person</div>
                  <div class="info-value">${client.contactPerson}</div>
                </div>
                `
                    : ""}
              </div>
            </div>
            <div style="text-align: center;">
              <a href="https://webtech.mobi.np/clients/${client.id}" class="cta-button" style="color: white;">
                View Client Details
              </a>
            </div>
          </div>
          <div class="email-footer">
            <div style="font-size: 12px; color: #64748b;">
              This email was automatically generated by the System.
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
              ${new Date().toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
            });
            console.log("New client creation email sent successfully to gaurav@webtech.com.np");
        }
        catch (emailError) {
            console.error("Failed to send new client email notification:", emailError);
            // Don't throw error here - client was created successfully, just email failed
        }
        res.status(201).json(client);
    }
    catch (error) {
        console.error("Error creating client:", error);
        // Handle Prisma unique constraint error
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            res.status(400).json({
                error: "Duplicate domain",
                message: "A client with this domain already exists.",
            });
        }
        else {
            res.status(500).json({ error: "Failed to create client" });
        }
    }
});
exports.createClient = createClient;
//------------------------------------ Create Client End ----------------------------------------
//----------------------------- Get all clients Start ---------------------------------------------
const getClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clients = yield prisma.client.findMany({
            include: {
                payments: true,
                tasks: {
                    where: {
                        parentTaskId: null, // Only get parent tasks initially
                    },
                    include: {
                        subtasks: true, // Include all subtasks for each parent task
                        assignedUsers: true, // Include assigned users if needed
                    },
                    orderBy: {
                        dueDate: "asc", // Optional: order tasks by due date
                    },
                },
            },
            orderBy: [
                {
                    projectPriority: {
                        sort: "asc",
                        nulls: "last", // This puts null values at the end
                    },
                },
                {
                    companyName: "asc", // Then sort by name
                },
            ],
        });
        res.status(200).json(clients);
    }
    catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});
exports.getClients = getClients;
const getAllProjectTimelines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clientsWithTimelines = yield prisma.client.findMany({
            where: {
                projectTimeline: {
                    some: {}, // Only include clients that have at least one project timeline
                },
            },
            select: {
                id: true,
                companyName: true,
                domainName: true,
                projectStatus: true,
                projectPriority: true,
                projectTimeline: {
                    orderBy: {
                        deadline: "asc",
                    },
                },
            },
            orderBy: {
                companyName: "asc",
            },
        });
        res.status(200).json({
            success: true,
            count: clientsWithTimelines.length,
            data: clientsWithTimelines,
        });
    }
    catch (error) {
        console.error("Error fetching project timelines:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch project timelines",
        });
    }
});
exports.getAllProjectTimelines = getAllProjectTimelines;
const getClientsForExpiryPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "20", search = "", filter = "" } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get current time in Nepal (UTC+5:45)
        const now = new Date();
        const nepalOffset = 5.75 * 60 * 60 * 1000;
        const nepalTime = new Date(now.getTime() + nepalOffset);
        // Set to beginning of day in Nepal time
        const today = new Date(nepalTime);
        today.setUTCHours(0, 0, 0, 0);
        // Build base search conditions
        const baseWhereConditions = {};
        if (search && typeof search === "string" && search.trim() !== "") {
            baseWhereConditions.OR = [
                { companyName: { contains: search } },
                { domainName: { contains: search } },
                { contactPerson: { contains: search } },
            ];
        }
        // Handle creation date filters - safely handle filter parameter
        const filterString = Array.isArray(filter) ? filter[0] : filter;
        const filterValue = typeof filterString === "string" ? filterString : "";
        // Nepali month mapping
        const NEPALI_MONTH_MAP = {
            baisakh: 1,
            jestha: 2,
            ashadh: 3,
            shrawan: 4,
            bhadra: 5,
            ashwin: 6,
            kartik: 7,
            mangsir: 8,
            poush: 9,
            magh: 10,
            falgun: 11,
            chaitra: 12,
        };
        // Handle Nepali month filters with year support (e.g., "2080-baisakh", "2081-ashwin")
        if (filterValue === "newclient" ||
            NEPALI_MONTH_MAP[filterValue.toLowerCase()] ||
            filterValue.includes("-")) {
            let monthRange = null;
            let currentNepaliYear = (0, nepaliCalendar_1.getCurrentNepaliYear)();
            if (filterValue === "newclient") {
                // Get current Nepali month (default behavior)
                const currentDate = new Date();
                for (let month = 1; month <= 12; month++) {
                    const range = (0, nepaliCalendar_1.getNepaliMonthRange)(currentNepaliYear, month);
                    if (range &&
                        currentDate >= range.startDate &&
                        currentDate <= range.endDate) {
                        monthRange = range;
                        break;
                    }
                }
                // Store the current month name in the response for frontend use
                req.currentNepaliMonth = monthRange
                    ? nepaliCalendar_1.NEPALI_MONTH_NAMES[monthRange.nepaliMonth].toLowerCase()
                    : null;
            }
            else if (filterValue.includes("-")) {
                // Handle year-month format (e.g., "2080-baisakh", "2081-ashwin")
                const [yearPart, monthPart] = filterValue.split("-");
                const nepaliYear = parseInt(yearPart);
                const monthName = monthPart.toLowerCase();
                if (!isNaN(nepaliYear) && NEPALI_MONTH_MAP[monthName]) {
                    const monthNumber = NEPALI_MONTH_MAP[monthName];
                    monthRange = (0, nepaliCalendar_1.getNepaliMonthRange)(nepaliYear, monthNumber);
                    // Store the selected year-month for frontend use
                    req.currentNepaliMonth = `${nepaliYear}-${monthName}`;
                }
            }
            else {
                // Get specific Nepali month for current year (existing behavior)
                const monthNumber = NEPALI_MONTH_MAP[filterValue.toLowerCase()];
                monthRange = (0, nepaliCalendar_1.getNepaliMonthRange)(currentNepaliYear, monthNumber);
                // Store the current month name for frontend use
                req.currentNepaliMonth = nepaliCalendar_1.NEPALI_MONTH_NAMES[monthNumber].toLowerCase();
            }
            if (monthRange) {
                baseWhereConditions.createdAt = {
                    gte: monthRange.startDate,
                    lte: monthRange.endDate,
                };
            }
        }
        else if (filterValue.startsWith("new")) {
            // Keep existing new* filters for backward compatibility
            const daysMatch = filterValue.match(/new(\d+)-?(\d*)/);
            if (daysMatch) {
                const startDays = parseInt(daysMatch[1]);
                const endDays = daysMatch[2] ? parseInt(daysMatch[2]) : null;
                const startDate = new Date(today);
                const endDate = new Date(today);
                if (endDays) {
                    // Range filter (e.g., new30-60days)
                    startDate.setDate(startDate.getDate() - endDays);
                    endDate.setDate(endDate.getDate() - startDays);
                    baseWhereConditions.createdAt = {
                        gte: startDate,
                        lt: endDate,
                    };
                }
                else {
                    // Single point filter (e.g., new30days)
                    startDate.setDate(startDate.getDate() - startDays);
                    baseWhereConditions.createdAt = {
                        gte: startDate,
                    };
                }
            }
        }
        // First, get ALL clients that match the base conditions
        const allClients = yield prisma.client.findMany({
            where: baseWhereConditions,
            include: {
                payments: true,
            },
            orderBy: [
                {
                    companyName: "asc",
                },
            ],
        });
        // Filter clients based on expiry criteria (only if filter is not a creation date filter)
        const filteredClients = allClients.filter((client) => {
            // If filtering by creation date (Nepali month or new*), we've already filtered at the database level
            if (filterValue === "newclient" ||
                NEPALI_MONTH_MAP[filterValue.toLowerCase()] ||
                filterValue.includes("-") ||
                filterValue.startsWith("new")) {
                return true; // All clients returned from DB match the creation date filter
            }
            const services = calculateClientServiceExpiry(client);
            // For suspended clients
            if (filterValue === "suspended") {
                return client.status === "suspend";
            }
            // For expiry filters, check if ANY service matches
            if (filterValue) {
                const hasMatchingService = services.some((service) => {
                    if (typeof service.daysLeft !== "number")
                        return false;
                    switch (filterValue) {
                        case "30":
                            return service.daysLeft >= 16 && service.daysLeft <= 30;
                        case "15":
                            return service.daysLeft >= 8 && service.daysLeft <= 15;
                        case "7":
                            return service.daysLeft >= 1 && service.daysLeft <= 7;
                        case "expired":
                            return service.daysLeft < 0;
                        default:
                            return true;
                    }
                });
                return hasMatchingService && client.status !== "suspend";
            }
            // No filter - show all non-suspended clients
            return client.status !== "suspend";
        });
        // Apply pagination
        let sortedAndPaginatedClients = filteredClients;
        // Sort by created date for Nepali month and new* filters before pagination
        if (filterValue === "newclient" ||
            NEPALI_MONTH_MAP[filterValue.toLowerCase()] ||
            filterValue.includes("-") ||
            filterValue.startsWith("new")) {
            sortedAndPaginatedClients = [...filteredClients].sort((a, b) => {
                const aCreatedAt = new Date(a.createdAt);
                const bCreatedAt = new Date(b.createdAt);
                return bCreatedAt.getTime() - aCreatedAt.getTime(); // Sort by most recent first
            });
        }
        const paginatedClients = sortedAndPaginatedClients.slice(skip, skip + limitNum);
        // Calculate service expiry information
        const clientsWithExpiryInfo = paginatedClients.map((client) => {
            const services = calculateClientServiceExpiry(client);
            // Fix: Calculate createdDaysAgo with proper Nepal timezone handling
            const createdAt = new Date(client.createdAt);
            const nepalOffset = 5.75 * 60 * 60 * 1000;
            // Convert both dates to Nepal time and normalize to start of day
            const createdNepal = new Date(createdAt.getTime() + nepalOffset);
            const todayNepal = new Date(today.getTime() + nepalOffset);
            createdNepal.setUTCHours(0, 0, 0, 0);
            todayNepal.setUTCHours(0, 0, 0, 0);
            const createdDaysAgo = Math.floor((todayNepal.getTime() - createdNepal.getTime()) / (1000 * 60 * 60 * 24));
            // Group services by expiry date
            const dateGroups = {};
            services.forEach((service) => {
                const dateKey = service.expiry
                    ? new Date(service.expiry).toISOString().split("T")[0]
                    : "none";
                if (!dateGroups[dateKey]) {
                    dateGroups[dateKey] = [];
                }
                dateGroups[dateKey].push(service);
            });
            // Create expiry groups
            const expiryGroups = Object.entries(dateGroups)
                .filter(([dateKey]) => dateKey !== "none")
                .map(([dateKey, services]) => {
                var _a, _b;
                // Combine Microsoft services with same date
                const microsoftServices = services.filter((s) => s.type && s.type.startsWith("Microsoft"));
                const otherServices = services.filter((s) => !s.type || !s.type.startsWith("Microsoft"));
                let displayServices = [...otherServices];
                if (microsoftServices.length > 0) {
                    const microsoftTotalAccounts = microsoftServices.reduce((sum, service) => {
                        var _a;
                        const accountsMatch = (_a = service.type) === null || _a === void 0 ? void 0 : _a.match(/\((\d+) accounts?\)/);
                        return sum + parseInt((accountsMatch === null || accountsMatch === void 0 ? void 0 : accountsMatch[1]) || "1", 10);
                    }, 0);
                    const microsoftTotalAmount = microsoftServices.reduce((sum, service) => sum + (service.amount || 0), 0);
                    // Get the vendor name from the first service if available
                    const vendorPrefix = ((_a = microsoftServices[0].type) === null || _a === void 0 ? void 0 : _a.includes("Connex"))
                        ? "Connex - "
                        : ((_b = microsoftServices[0].type) === null || _b === void 0 ? void 0 : _b.includes("iDream"))
                            ? "iDream - "
                            : "";
                    displayServices.push({
                        type: `Microsoft (${microsoftTotalAccounts} account${microsoftTotalAccounts !== 1 ? "s" : ""})`,
                        expiry: microsoftServices[0].expiry,
                        amount: microsoftTotalAmount,
                        daysLeft: microsoftServices[0].daysLeft,
                        vatType: microsoftServices[0].vatType,
                    });
                }
                const totalAmount = displayServices.reduce((sum, service) => sum + (service.amount || 0), 0);
                return {
                    services: displayServices,
                    totalAmount,
                    expiryDate: dateKey,
                };
            });
            const hasExpiringServices = expiryGroups.length > 0;
            return Object.assign(Object.assign({}, client), { expiryGroups, allServices: services, hasExpiringServices,
                createdDaysAgo });
        });
        res.status(200).json({
            clients: clientsWithExpiryInfo,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(filteredClients.length / limitNum),
                totalCount: filteredClients.length,
                hasNextPage: pageNum * limitNum < filteredClients.length,
                hasPrevPage: pageNum > 1,
            },
            currentNepaliMonth: req.currentNepaliMonth,
        });
    }
    catch (error) {
        console.error("Error fetching clients for expiry page:", error);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});
exports.getClientsForExpiryPage = getClientsForExpiryPage;
// Add a new utility function to get available year-month combinations
const getAvailableNepaliYearMonths = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const availableYears = (0, nepaliCalendar_1.getAvailableNepaliYears)();
        const yearMonths = [];
        availableYears.forEach((year) => {
            for (let month = 1; month <= 12; month++) {
                yearMonths.push({
                    value: `${year}-${nepaliCalendar_1.NEPALI_MONTH_NAMES[month].toLowerCase()}`,
                    label: `${year}-${nepaliCalendar_1.NEPALI_MONTH_NAMES[month]}`,
                });
            }
        });
        res.status(200).json({ yearMonths });
    }
    catch (error) {
        console.error("Error fetching available Nepali year-months:", error);
        res.status(500).json({ error: "Failed to fetch available year-months" });
    }
});
exports.getAvailableNepaliYearMonths = getAvailableNepaliYearMonths;
const getClientsForProjectPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search } = req.query;
        const startDate = new Date("2026-3-15");
        const endDate = new Date("2026-05-14");
        if (search) {
            const clients = yield prisma.client.findMany({
                where: {
                    OR: [
                        { companyName: { contains: search } },
                        { domainName: { contains: search } },
                    ],
                },
                include: {
                    payments: true,
                    tasks: {
                        where: { parentTaskId: null, isDeleted: false },
                        include: {
                            subtasks: {
                                where: { isDeleted: false }, // Exclude deleted subtasks
                            },
                            assignedUsers: true,
                        },
                        orderBy: { dueDate: "asc" },
                    },
                },
                orderBy: [
                    { projectPriority: { sort: "asc", nulls: "last" } },
                    { companyName: "asc" },
                ],
            });
            res.status(200).json(clients);
            return;
        }
        // Get non-completed clients with all fields
        const nonCompletedClients = yield prisma.client.findMany({
            where: {
                projectStatus: { not: "Completed" },
            },
            include: {
                payments: true,
                tasks: {
                    where: {
                        parentTaskId: null,
                        isDeleted: false, // Exclude deleted tasks
                    },
                    include: {
                        subtasks: {
                            where: { isDeleted: false }, // Exclude deleted subtasks
                        },
                        assignedUsers: true,
                    },
                    orderBy: { dueDate: "asc" },
                },
            },
            orderBy: [
                { projectPriority: { sort: "asc", nulls: "last" } },
                { companyName: "asc" },
            ],
        });
        // Get completed clients with all fields
        const completedClients = yield prisma.client.findMany({
            where: {
                projectStatus: "Completed",
                websiteLiveDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                payments: true,
                tasks: {
                    where: {
                        parentTaskId: null,
                        isDeleted: false, // Exclude deleted tasks
                    },
                    include: {
                        subtasks: {
                            where: { isDeleted: false }, // Exclude deleted subtasks
                        },
                        assignedUsers: true,
                    },
                    orderBy: { dueDate: "asc" },
                },
            },
            orderBy: [
                { projectPriority: { sort: "asc", nulls: "last" } },
                { companyName: "asc" },
            ],
        });
        // Combine and sort results
        const result = [...nonCompletedClients, ...completedClients].sort((a, b) => {
            var _a, _b;
            // Handle null priorities by treating them as Infinity (sorted last)
            const aPriority = (_a = a.projectPriority) !== null && _a !== void 0 ? _a : Infinity;
            const bPriority = (_b = b.projectPriority) !== null && _b !== void 0 ? _b : Infinity;
            // First sort by priority
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            // Then sort by company name
            return (a.companyName || "").localeCompare(b.companyName || "");
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});
exports.getClientsForProjectPage = getClientsForProjectPage;
//----------------------------- Get Paginated Clients Start ---------------------------------------------
const getClientsList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, pageSize = 10, search = "" } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const take = Number(pageSize);
        const searchTerm = search.toString().toLowerCase();
        // Build where clause for string fields only
        const whereClause = searchTerm
            ? {
                OR: [
                    { companyName: { contains: searchTerm } },
                    { domainName: { contains: searchTerm } },
                    { contactPerson: { contains: searchTerm } },
                ],
            }
            : {};
        // Get clients with pagination for string matches
        let clients = yield prisma.client.findMany({
            where: whereClause,
            skip: searchTerm ? 0 : skip, // If searching, get all to filter JSON
            take: searchTerm ? undefined : take, // If searching, get all
            orderBy: [
                { projectPriority: { sort: "asc", nulls: "last" } },
                { companyName: "asc" },
            ],
        });
        let totalCount = yield prisma.client.count({ where: whereClause });
        // If there's a search term, filter by JSON fields in memory
        if (searchTerm) {
            // Filter clients by webDesignCategories
            const filteredClients = clients.filter(client => {
                var _a, _b, _c;
                // Check categories if they exist
                if (client.webDesignCategories) {
                    let categories = [];
                    try {
                        // Parse categories based on how they're stored
                        if (typeof client.webDesignCategories === 'string') {
                            // Try to parse as JSON first
                            try {
                                const parsed = JSON.parse(client.webDesignCategories);
                                if (Array.isArray(parsed)) {
                                    categories = parsed.filter(cat => typeof cat === 'string');
                                }
                                else if (typeof parsed === 'string') {
                                    categories = [parsed];
                                }
                            }
                            catch (_d) {
                                // If not JSON, treat as comma-separated string
                                categories = client.webDesignCategories.split(',').map(c => c.trim());
                            }
                        }
                        else if (Array.isArray(client.webDesignCategories)) {
                            categories = client.webDesignCategories.filter(cat => typeof cat === 'string');
                        }
                        // Check if any category matches
                        const categoryMatch = categories.some(cat => cat.toLowerCase().includes(searchTerm));
                        if (categoryMatch)
                            return true;
                    }
                    catch (error) {
                        console.error("Error parsing categories:", error);
                    }
                }
                // Check tech stack
                if (client.webDesignTechStack) {
                    const techStackMatch = client.webDesignTechStack
                        .toLowerCase()
                        .includes(searchTerm);
                    if (techStackMatch)
                        return true;
                }
                // Check if already matched from basic fields
                return (((_a = client.companyName) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm)) ||
                    ((_b = client.domainName) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm)) ||
                    ((_c = client.contactPerson) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(searchTerm)));
            });
            totalCount = filteredClients.length;
            clients = filteredClients.slice(skip, skip + take);
        }
        res.status(200).json({
            clients,
            totalCount,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCount / take),
        });
    }
    catch (error) {
        console.error("Error fetching paginated clients:", error);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});
exports.getClientsList = getClientsList;
//-----------------------------  Get Paginated Clients End ---------------------------------------------
//----------------------------- Get Clients Count Start ---------------------------------------------
const getClientCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get current time in Nepal (UTC+5:45)
        const now = new Date();
        const nepalOffset = 5.75 * 60 * 60 * 1000;
        const nepalTime = new Date(now.getTime() + nepalOffset);
        // Set to beginning of day in Nepal time
        const today = new Date(nepalTime);
        today.setUTCHours(0, 0, 0, 0);
        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // Get all clients
        const clients = yield prisma.client.findMany({
            select: {
                id: true,
                status: true,
                projectStatus: true,
                microsoftServices: true,
                domainExpiryDate: true,
                hostingExpiryDate: true,
                maintenanceExpiryDate: true,
                webDesignInstallments: true,
                createdAt: true, // Add createdAt to check for new clients
            },
        });
        const counts = {
            totalClients: clients.length, // Total number of clients
            expiring: 0, // Total number of expiring items (renamed from 'total')
            expiringIn30Days: 0, // 16-30 days
            expiringIn15Days: 0, // 8-15 days
            expiringIn7Days: 0, // 1-7 days
            expired: 0,
            suspended: 0,
            newClients30Days: 0, // New clients created within 30 days
            projectStatusCounts: {
                New: 0,
                Design: 0,
                "Client-Review": 0,
                Development: 0,
                "Content-Fillup": 0,
                AMC: 0,
                Completed: 0,
                Issues: 0,
            },
        };
        const calculateDaysLeft = (expiryDate) => {
            if (!expiryDate)
                return null;
            const expiry = new Date(expiryDate);
            const diffTime = expiry.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };
        // First count suspended clients, project statuses, and new clients
        for (const client of clients) {
            if (client.status === "suspend") {
                counts.suspended++;
            }
            // Count new clients created within 30 days
            if (client.createdAt && new Date(client.createdAt) >= thirtyDaysAgo) {
                counts.newClients30Days++;
            }
            // Count project statuses
            if (client.projectStatus &&
                counts.projectStatusCounts.hasOwnProperty(client.projectStatus)) {
                counts.projectStatusCounts[client.projectStatus]++;
            }
        }
        // Process each client for expiry counts
        for (const client of clients) {
            // Skip suspended clients for expiry counts
            if (client.status === "suspend")
                continue;
            const clientExpiryDates = new Set();
            // Process Microsoft services
            if (client.microsoftServices) {
                try {
                    const msServices = typeof client.microsoftServices === "string"
                        ? JSON.parse(client.microsoftServices)
                        : client.microsoftServices;
                    msServices.forEach((service) => {
                        if (service.expiryDate) {
                            clientExpiryDates.add(new Date(service.expiryDate).toISOString().split("T")[0]);
                        }
                    });
                }
                catch (e) {
                    console.error("Error parsing Microsoft services:", e);
                }
            }
            // Process other services
            [
                client.domainExpiryDate,
                client.hostingExpiryDate,
                client.maintenanceExpiryDate,
            ].forEach((expiry) => {
                if (expiry) {
                    clientExpiryDates.add(new Date(expiry).toISOString().split("T")[0]);
                }
            });
            // Process web design installments (only unpaid ones)
            if (client.webDesignInstallments) {
                try {
                    const installments = typeof client.webDesignInstallments === "string"
                        ? JSON.parse(client.webDesignInstallments)
                        : client.webDesignInstallments;
                    installments.forEach((installment) => {
                        if (!installment.paid && installment.dueDate) {
                            clientExpiryDates.add(new Date(installment.dueDate).toISOString().split("T")[0]);
                        }
                    });
                }
                catch (e) {
                    console.error("Error parsing installments:", e);
                }
            }
            // Count each unique expiry date for this client
            clientExpiryDates.forEach((dateStr) => {
                const expiryDate = new Date(dateStr);
                const daysLeft = calculateDaysLeft(expiryDate);
                if (daysLeft === null)
                    return;
                counts.expiring++;
                if (daysLeft < 0) {
                    counts.expired++;
                }
                else if (daysLeft <= 7) {
                    counts.expiringIn7Days++;
                }
                else if (daysLeft <= 15) {
                    counts.expiringIn15Days++;
                }
                else if (daysLeft <= 30) {
                    counts.expiringIn30Days++;
                }
            });
        }
        res.status(200).json(counts);
    }
    catch (error) {
        console.error("Error getting client counts:", error);
        res.status(500).json({ error: "Failed to get client counts" });
    }
});
exports.getClientCounts = getClientCounts;
const getNewClientsCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const nepaliYear = year ? parseInt(year) : (0, nepaliCalendar_1.getCurrentNepaliYear)();
        // Get all Nepali months for the specified year
        const nepaliMonths = (0, nepaliCalendar_1.getNepaliYearMonths)(nepaliYear);
        // Get all clients with createdAt date
        const clients = yield prisma.client.findMany({
            select: {
                id: true,
                createdAt: true,
            },
        });
        // Initialize counts for all 12 months
        const monthlyCounts = {};
        const monthNames = {};
        for (let month = 1; month <= 12; month++) {
            monthlyCounts[month] = 0;
            monthNames[month] = nepaliCalendar_1.NEPALI_MONTH_NAMES[month];
        }
        // Count clients for each Nepali month
        for (const client of clients) {
            if (!client.createdAt)
                continue;
            const clientDate = new Date(client.createdAt);
            // Find which Nepali month this client belongs to
            for (const monthRange of nepaliMonths) {
                if (clientDate >= monthRange.startDate &&
                    clientDate <= monthRange.endDate) {
                    monthlyCounts[monthRange.nepaliMonth]++;
                    break;
                }
            }
        }
        // Format the response
        const response = {
            year: nepaliYear,
            totalNewClients: clients.length,
            monthlyCounts: Object.keys(monthlyCounts).map((monthNum) => {
                const month = parseInt(monthNum);
                return {
                    month,
                    monthName: monthNames[month],
                    count: monthlyCounts[month],
                };
            }),
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting new clients counts by Nepali month:", error);
        res.status(500).json({ error: "Failed to get new clients counts" });
    }
});
exports.getNewClientsCounts = getNewClientsCounts;
const getClientDesignCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get all clients with web design categories and tech stack
        const clients = yield prisma.client.findMany({
            select: {
                webDesignCategories: true,
                webDesignTechStack: true,
            },
            where: {
                OR: [
                    { webDesignCategories: { not: client_2.Prisma.JsonNull } },
                    { webDesignTechStack: { not: null } },
                ],
            },
        });
        // Initialize counts
        const categoryCounts = {};
        const techStackCounts = {};
        // Process each client
        for (const client of clients) {
            // Count web design categories - handle as array with proper type checking
            if (client.webDesignCategories) {
                let categories = [];
                // Handle different possible formats
                if (Array.isArray(client.webDesignCategories)) {
                    // Filter out non-string values and ensure they're strings
                    categories = client.webDesignCategories
                        .filter((cat) => cat !== null && typeof cat === 'string');
                }
                else if (typeof client.webDesignCategories === 'string') {
                    // If it's a string, try to parse as JSON or split by comma
                    try {
                        const parsed = JSON.parse(client.webDesignCategories);
                        if (Array.isArray(parsed)) {
                            categories = parsed.filter((cat) => cat !== null && typeof cat === 'string');
                        }
                        else if (typeof parsed === 'string') {
                            categories = [parsed];
                        }
                    }
                    catch (_a) {
                        // If not valid JSON, treat as comma-separated string
                        categories = client.webDesignCategories.split(',').map(c => c.trim());
                    }
                }
                categories.forEach((category) => {
                    if (category && category.trim()) {
                        const trimmedCategory = category.trim();
                        categoryCounts[trimmedCategory] = (categoryCounts[trimmedCategory] || 0) + 1;
                    }
                });
            }
            // Count web design tech stacks
            if (client.webDesignTechStack) {
                const techStacks = Array.isArray(client.webDesignTechStack)
                    ? client.webDesignTechStack
                    : [client.webDesignTechStack];
                techStacks.forEach((techStack) => {
                    if (techStack && typeof techStack === 'string') {
                        techStackCounts[techStack] = (techStackCounts[techStack] || 0) + 1;
                    }
                });
            }
        }
        // Sort counts by value (descending)
        const sortedCategoryCounts = Object.fromEntries(Object.entries(categoryCounts).sort(([, a], [, b]) => b - a));
        const sortedTechStackCounts = Object.fromEntries(Object.entries(techStackCounts).sort(([, a], [, b]) => b - a));
        res.status(200).json({
            categories: sortedCategoryCounts,
            techStacks: sortedTechStackCounts,
            totalClientsWithDesign: clients.length,
        });
    }
    catch (error) {
        console.error("Error getting client design counts:", error);
        res.status(500).json({ error: "Failed to get client design counts" });
    }
});
exports.getClientDesignCounts = getClientDesignCounts;
const getClientsByDesignCriteria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, techStack, page = 1, limit = 10, sortBy = "webDesignRating", sortOrder = "desc", } = req.query;
        // Validate that at least one filter is provided
        if (!category && !techStack) {
            res.status(400).json({
                error: "Please provide either category or techStack filter",
            });
            return;
        }
        // Build the where clause
        const whereClause = {};
        if (category && techStack) {
            // Both provided — use AND condition
            whereClause.AND = [];
            // Category: stored as comma-separated string e.g. "Ecommerce,Conference"
            const categoriesArray = Array.isArray(category) ? category : [category];
            whereClause.AND.push({
                OR: categoriesArray.map((cat) => ({
                    webDesignCategories: {
                        string_contains: cat,
                    },
                })),
            });
            // TechStack: stored as plain string e.g. "HTML + WordPress"
            const techStackArray = Array.isArray(techStack) ? techStack : [techStack];
            whereClause.AND.push({
                OR: techStackArray.map((tech) => ({
                    webDesignTechStack: {
                        contains: tech,
                    },
                })),
            });
        }
        else if (category) {
            // Only category provided
            const categoriesArray = Array.isArray(category) ? category : [category];
            whereClause.OR = categoriesArray.map((cat) => ({
                webDesignCategories: {
                    string_contains: cat,
                },
            }));
        }
        else if (techStack) {
            // Only techStack provided
            const techStackArray = Array.isArray(techStack) ? techStack : [techStack];
            whereClause.OR = techStackArray.map((tech) => ({
                webDesignTechStack: {
                    contains: tech,
                },
            }));
        }
        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Handle sorting — put null webDesignRating values last
        const orderBy = {};
        if (sortBy === "webDesignRating") {
            orderBy.webDesignRating = {
                sort: sortOrder,
                nulls: "last",
            };
        }
        else {
            orderBy[sortBy] = sortOrder;
        }
        // Fetch clients
        const clients = yield prisma.client.findMany({
            where: whereClause,
            select: {
                id: true,
                companyName: true,
                domainName: true,
                contactPerson: true,
                webDesignCategories: true,
                webDesignTechStack: true,
                webDesignRating: true,
            },
            skip,
            take: limitNum,
            orderBy,
        });
        // Total count for pagination
        const totalCount = yield prisma.client.count({
            where: whereClause,
        });
        const totalPages = Math.ceil(totalCount / limitNum);
        // Transform response
        const transformedClients = clients.map((client) => {
            // webDesignCategories is stored as a comma-separated string e.g. "Ecommerce,Conference"
            let categories = [];
            if (client.webDesignCategories) {
                if (typeof client.webDesignCategories === "string") {
                    // Split comma-separated string into array and trim whitespace
                    categories = client.webDesignCategories
                        .split(",")
                        .map((cat) => cat.trim())
                        .filter(Boolean);
                }
                else if (Array.isArray(client.webDesignCategories)) {
                    categories = client.webDesignCategories
                        .filter((cat) => cat !== null && cat !== undefined)
                        .map((cat) => String(cat).trim())
                        .filter(Boolean);
                }
            }
            return {
                id: client.id,
                companyName: client.companyName,
                domainName: client.domainName,
                contactPerson: client.contactPerson,
                webDesignCategories: categories,
                webDesignCategory: categories.length > 0 ? categories.join(", ") : null,
                webDesignTechStack: client.webDesignTechStack,
                webDesignRating: client.webDesignRating,
            };
        });
        res.status(200).json({
            clients: transformedClients,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
            filters: {
                category: category || null,
                techStack: techStack || null,
            },
            sorting: {
                sortBy,
                sortOrder,
            },
        });
    }
    catch (error) {
        console.error("Error getting clients by design criteria:", error);
        res.status(500).json({ error: "Failed to get clients by design criteria" });
    }
});
exports.getClientsByDesignCriteria = getClientsByDesignCriteria;
//----------------------------- Get Clients Count End ---------------------------------------------
//-------------------------------------- Get client by ID Start ----------------------------------
const getClientById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const client = yield prisma.client.findUnique({
            where: { id: Number(id) },
            include: {
                payments: {
                    orderBy: {
                        paidDate: "desc", // Sort by paidDate descending (most recent first)
                    },
                },
                projectTimeline: true,
            },
        });
        if (!client) {
            res.status(404).json({ error: "Client not found" });
            return;
        }
        res.status(200).json(client);
    }
    catch (error) {
        console.error("Error fetching client:", error);
        res.status(500).json({ error: "Failed to fetch client" });
    }
});
exports.getClientById = getClientById;
// Add this function to your existing clientController.ts
const getProjectSupportEndClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, pageSize = 10, search = "" } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const take = Number(pageSize);
        // Get current date
        const currentDate = new Date();
        // Filter for clients with support period that has passed (in the past)
        const dateFilter = {
            websiteSupportPeriod: {
                not: null,
                lt: currentDate, // Support ended before today
            },
        };
        // Build search conditions
        const searchConditions = search
            ? {
                OR: [
                    {
                        companyName: { contains: search, mode: "insensitive" },
                    },
                    { domainName: { contains: search, mode: "insensitive" } },
                    {
                        contactPerson: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        contactPersonEmail: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {};
        // Find clients with expired support periods
        const [clients, totalCount] = yield Promise.all([
            prisma.client.findMany({
                where: Object.assign(Object.assign(Object.assign({}, searchConditions), dateFilter), { projectStatus: "Completed" }),
                select: {
                    id: true,
                    companyName: true,
                    domainName: true,
                    contactPerson: true,
                    contactPersonEmail: true,
                    contactPersonPhone: true,
                    websiteSupportPeriod: true,
                    websiteLiveDate: true,
                    projectStatus: true,
                },
                skip,
                take,
                orderBy: {
                    websiteSupportPeriod: "desc", // Most recent expirations first
                },
            }),
            prisma.client.count({
                where: Object.assign(Object.assign(Object.assign({}, searchConditions), dateFilter), { projectStatus: "Completed" }),
            }),
        ]);
        // Calculate days ago for each client and format the message
        const clientsWithDaysInfo = clients.map((client) => {
            if (!client.websiteSupportPeriod)
                return Object.assign(Object.assign({}, client), { daysAgo: 0, status: "unknown", supportStatus: "No support period" });
            const supportEndDate = new Date(client.websiteSupportPeriod);
            const timeDiff = currentDate.getTime() - supportEndDate.getTime();
            const daysAgo = Math.floor(timeDiff / (1000 * 3600 * 24));
            // Format the days ago message
            let daysAgoMessage = `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
            return Object.assign(Object.assign({}, client), { daysAgo,
                daysAgoMessage, status: "expired", supportStatus: `Support expired ${daysAgoMessage}` });
        });
        res.status(200).json({
            clients: clientsWithDaysInfo,
            totalCount,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCount / take),
            filter: {
                search: search,
                status: "expired",
            },
        });
    }
    catch (error) {
        console.error("Error fetching expired support clients:", error);
        res.status(500).json({ error: "Failed to fetch expired support clients" });
    }
});
exports.getProjectSupportEndClient = getProjectSupportEndClient;
//-------------------------------------- Get client by ID End ----------------------------------
//------------------------------------------ Update client Start ---------------------------------
const updateClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const decodedToken = decodeToken(token);
        if (!decodedToken || !decodedToken.userId) {
            res.status(401).json({ message: "Unauthorized: Invalid token" });
            return;
        }
        const updaterId = decodedToken.userId;
        const { id } = req.params;
        const clientData = req.body;
        const files = req.files;
        // First get the existing client to check for old files and changes
        const existingClient = yield prisma.client.findUnique({
            where: { id: Number(id) },
        });
        if (!existingClient) {
            res.status(404).json({ error: "Client not found" });
            return;
        }
        const processedData = {};
        // Process regular fields
        for (const [key, value] of Object.entries(clientData)) {
            if (key === "actionDetails")
                continue;
            if (Array.isArray(value)) {
                processedData[key] = value[value.length - 1];
            }
            else {
                processedData[key] = value;
            }
            if (processedData[key] === "") {
                processedData[key] = null;
            }
            if ((key.endsWith("Amount") || key === "webDesignRating") &&
                processedData[key]) {
                processedData[key] = parseFloat(processedData[key]);
            }
        }
        if (clientData.status) {
            processedData.status = clientData.status;
            // If this is just a status change, create a specific activity log
            if (Object.keys(clientData).filter((k) => k !== "actionDetails").length ===
                1 &&
                clientData.status) {
                const action = clientData.status === "suspend" ? "SUSPEND" : "ACTIVATE";
                const user = yield prisma.user.findUnique({
                    where: { userId: updaterId },
                });
                yield prisma.activityLog.create({
                    data: {
                        action: "UPDATE",
                        details: `${(user === null || user === void 0 ? void 0 : user.firstname) || "System"} ${action === "SUSPEND" ? "suspended" : "activated"} the client`,
                        userId: updaterId,
                        clientId: Number(id),
                    },
                });
                const updatedClient = yield prisma.client.update({
                    where: { id: Number(id) },
                    data: { status: clientData.status },
                });
                res.status(200).json(updatedClient);
                return;
            }
        }
        if (processedData.webDesignInstallments) {
            try {
                processedData.webDesignInstallments =
                    typeof processedData.webDesignInstallments === "string"
                        ? JSON.parse(processedData.webDesignInstallments)
                        : processedData.webDesignInstallments;
            }
            catch (e) {
                console.error("Error parsing installments:", e);
                processedData.webDesignInstallments = [];
            }
        }
        if (processedData.microsoftServices) {
            try {
                processedData.microsoftServices =
                    typeof processedData.microsoftServices === "string"
                        ? JSON.parse(processedData.microsoftServices)
                        : processedData.microsoftServices;
                for (let i = 0; i < processedData.microsoftServices.length; i++) {
                    const poField = `microsoftServices[${i}][purchaseOrder]`;
                    if ((_b = files[poField]) === null || _b === void 0 ? void 0 : _b[0]) {
                        const existingServices = existingClient.microsoftServices
                            ? typeof existingClient.microsoftServices === "string"
                                ? JSON.parse(existingClient.microsoftServices)
                                : existingClient.microsoftServices
                            : [];
                        const oldPo = (_c = existingServices[i]) === null || _c === void 0 ? void 0 : _c.purchaseOrderPath;
                        yield deleteFileIfExists(oldPo);
                        processedData.microsoftServices[i].purchaseOrderPath =
                            yield handleFileUpload(files[poField][0]);
                    }
                }
            }
            catch (e) {
                console.error("Error parsing Microsoft services:", e);
                processedData.microsoftServices = [];
            }
        }
        if (files) {
            if ((_d = files["webDesignAgreement"]) === null || _d === void 0 ? void 0 : _d[0]) {
                yield deleteFileIfExists(existingClient.webDesignAgreement);
                processedData["webDesignAgreement"] = yield handleFileUpload(files["webDesignAgreement"][0]);
            }
            if (processedData.webDesignInstallments &&
                Array.isArray(processedData.webDesignInstallments)) {
                const existingInstallments = existingClient.webDesignInstallments
                    ? typeof existingClient.webDesignInstallments === "string"
                        ? JSON.parse(existingClient.webDesignInstallments)
                        : existingClient.webDesignInstallments
                    : [];
                for (let i = 0; i < processedData.webDesignInstallments.length; i++) {
                    const receiptField = `webDesignInstallments[${i}][receiptFile]`;
                    if ((_e = files[receiptField]) === null || _e === void 0 ? void 0 : _e[0]) {
                        const oldReceipt = (_f = existingInstallments[i]) === null || _f === void 0 ? void 0 : _f.receipt;
                        yield deleteFileIfExists(oldReceipt);
                        processedData.webDesignInstallments[i].receipt =
                            yield handleFileUpload(files[receiptField][0]);
                    }
                }
            }
        }
        // Convert date fields
        const dateFields = [
            "domainActiveDate",
            "domainExpiryDate",
            "hostingActiveDate",
            "hostingExpiryDate",
            "microsoftActiveDate",
            "microsoftExpiryDate",
            "maintenanceActiveDate",
            "maintenanceExpiryDate",
            "startDate",
            "endDate",
            "websiteLiveDate",
            "websiteSupportPeriod",
        ];
        dateFields.forEach((field) => {
            if (processedData[field]) {
                processedData[field] = new Date(processedData[field]);
            }
        });
        // Convert installment dates
        if (processedData.webDesignInstallments) {
            processedData.webDesignInstallments =
                processedData.webDesignInstallments.map((i) => (Object.assign(Object.assign({}, i), { dueDate: i.dueDate ? new Date(i.dueDate) : null })));
        }
        // Process Microsoft Services
        if (processedData.microsoftServices) {
            try {
                processedData.microsoftServices =
                    typeof processedData.microsoftServices === "string"
                        ? JSON.parse(processedData.microsoftServices)
                        : processedData.microsoftServices;
                // Process purchase order files for Microsoft services
                for (let i = 0; i < processedData.microsoftServices.length; i++) {
                    const poField = `microsoftServices[${i}][purchaseOrder]`;
                    if ((_g = files[poField]) === null || _g === void 0 ? void 0 : _g[0]) {
                        // Delete old purchase order if it exists
                        const existingServices = existingClient.microsoftServices
                            ? typeof existingClient.microsoftServices === "string"
                                ? JSON.parse(existingClient.microsoftServices)
                                : existingClient.microsoftServices
                            : [];
                        const oldPo = (_h = existingServices[i]) === null || _h === void 0 ? void 0 : _h.purchaseOrder;
                        yield deleteFileIfExists(oldPo);
                        processedData.microsoftServices[i].purchaseOrder =
                            yield handleFileUpload(files[poField][0]);
                    }
                }
            }
            catch (e) {
                console.error("Error parsing Microsoft services:", e);
                processedData.microsoftServices = [];
            }
        }
        const changes = (0, clientActivityHelper_1.compareClientFields)(existingClient, processedData);
        // Process projectTimeline separately to avoid relation issues
        let projectTimelineData = [];
        let hasEmptyTimeline = false;
        if (processedData.projectTimeline) {
            try {
                projectTimelineData =
                    typeof processedData.projectTimeline === "string"
                        ? JSON.parse(processedData.projectTimeline)
                        : processedData.projectTimeline;
                // Check if it's explicitly an empty array
                if (Array.isArray(projectTimelineData) &&
                    projectTimelineData.length === 0) {
                    hasEmptyTimeline = true;
                }
                // Ensure it's an array and process dates
                if (Array.isArray(projectTimelineData)) {
                    projectTimelineData = projectTimelineData
                        .filter((timeline) => timeline && (timeline.title || timeline.description)) // Filter out empty items
                        .map((timeline) => ({
                        title: timeline.title || "",
                        description: timeline.description || "",
                        deadline: timeline.deadline ? new Date(timeline.deadline) : null,
                        status: timeline.status || "ToDo",
                    }));
                }
                else {
                    projectTimelineData = [];
                }
            }
            catch (e) {
                console.error("Error parsing projectTimeline:", e);
                projectTimelineData = [];
            }
        }
        // Remove projectTimeline from processedData to avoid relation manipulation issues
        const { projectTimeline } = processedData, clientDataWithoutTimeline = __rest(processedData, ["projectTimeline"]);
        // Update client without touching projectTimeline relation
        const updatedClient = yield prisma.client.update({
            where: { id: Number(id) },
            data: clientDataWithoutTimeline,
            include: {
                projectTimeline: true,
            },
        });
        // Handle project timelines separately if provided
        if (projectTimelineData.length > 0) {
            // Delete existing timelines
            yield prisma.projectTimeline.deleteMany({
                where: { clientId: Number(id) },
            });
            // Create new timelines
            yield prisma.projectTimeline.createMany({
                data: projectTimelineData.map((timeline) => (Object.assign(Object.assign({}, timeline), { clientId: Number(id) }))),
            });
        }
        else if (hasEmptyTimeline) {
            // If projectTimeline was explicitly set to empty array, delete all timelines
            yield prisma.projectTimeline.deleteMany({
                where: { clientId: Number(id) },
            });
        }
        // Fetch the final updated client with timelines
        const finalClient = yield prisma.client.findUnique({
            where: { id: Number(id) },
            include: {
                projectTimeline: true,
            },
        });
        // Get user who made the changes
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: updaterId },
        });
        // Create activity log if there were changes
        if (changes.length > 0) {
            const userDisplayName = updatingUser
                ? `${updatingUser.firstname} ${updatingUser.lastname}`
                : "System";
            // Create one log entry per changed field
            for (const change of changes) {
                yield prisma.activityLog.create({
                    data: {
                        action: "UPDATE",
                        details: `${userDisplayName} updated ${change.field} from "${change.oldValue}" to "${change.newValue}"`,
                        userId: updaterId,
                        clientId: updatedClient.id,
                    },
                });
            }
        }
        // Also log project timeline changes if they occurred
        if (projectTimelineData.length > 0 || hasEmptyTimeline) {
            const userDisplayName = updatingUser
                ? `${updatingUser.firstname} ${updatingUser.lastname}`
                : "System";
            const timelineAction = projectTimelineData.length > 0
                ? `updated project timeline with ${projectTimelineData.length} items`
                : "cleared all project timeline items";
            yield prisma.activityLog.create({
                data: {
                    action: "UPDATE",
                    details: `${userDisplayName} ${timelineAction}`,
                    userId: updaterId,
                    clientId: Number(id),
                },
            });
        }
        res.status(200).json(finalClient);
    }
    catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ error: "Failed to update client" });
    }
});
exports.updateClient = updateClient;
//------------------------------------------ Update client End ---------------------------------
//-------------------------------------------- Delete client Start ------------------------------------------
const deleteClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // First get the client to check for files to delete
        const client = yield prisma.client.findUnique({
            where: { id: Number(id) },
        });
        if (!client) {
            res.status(404).json({ error: "Client not found" });
            return;
        }
        // Delete agreement file if exists
        yield deleteFileIfExists(client.webDesignAgreement);
        // Delete installment receipts if exist
        if (client.webDesignInstallments) {
            const installments = typeof client.webDesignInstallments === "string"
                ? JSON.parse(client.webDesignInstallments)
                : client.webDesignInstallments;
            for (const installment of installments) {
                yield deleteFileIfExists(installment.receipt);
            }
        }
        if (client.microsoftServices) {
            const services = typeof client.microsoftServices === "string"
                ? JSON.parse(client.microsoftServices)
                : client.microsoftServices;
            for (const service of services) {
                yield deleteFileIfExists(service.purchaseOrder);
            }
        }
        // Now delete the client record
        yield prisma.client.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ error: "Failed to delete client" });
    }
});
exports.deleteClient = deleteClient;
//-------------------------------------------- Delete client End ------------------------------------------
//----------------------- Delete multiple clients Start ---------------------------------------------------
const deleteMultipleClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            res.status(400).json({ error: "Invalid request body" });
            return;
        }
        // First get all clients to check for files to delete
        const clients = yield prisma.client.findMany({
            where: {
                id: { in: ids.map((id) => Number(id)) },
            },
        });
        // Delete all associated files
        for (const client of clients) {
            yield deleteFileIfExists(client.webDesignAgreement);
            if (client.webDesignInstallments) {
                const installments = typeof client.webDesignInstallments === "string"
                    ? JSON.parse(client.webDesignInstallments)
                    : client.webDesignInstallments;
                for (const installment of installments) {
                    yield deleteFileIfExists(installment.receipt);
                }
            }
        }
        // Now delete the client records
        yield prisma.client.deleteMany({
            where: {
                id: { in: ids.map((id) => Number(id)) },
            },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting clients:", error);
        res.status(500).json({ error: "Failed to delete clients" });
    }
});
exports.deleteMultipleClients = deleteMultipleClients;
//----------------------- Delete multiple clients End ---------------------------------------------------
// =========================================== Client CRUD End ============================================
//---------------------------------  Get Clients Activity Logs Start -----------------------------------------
// =========================================== Client CRUD Start ===========================================
const getClientActivityLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const logs = yield prisma.activityLog.findMany({
            where: { clientId: Number(id) },
            include: { user: true },
            orderBy: { timestamp: "desc" },
        });
        res.status(200).json(logs);
    }
    catch (error) {
        console.error("Error fetching client activity logs:", error);
        res.status(500).json({ error: "Failed to fetch client activity logs" });
    }
});
exports.getClientActivityLogs = getClientActivityLogs;
//---------------------------------  Get Clients Activity Logs End -----------------------------------------
//---------------------------------------- Renew Client Service Start ------------------------------------------
const sendReminderEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId } = req.params;
        const { serviceType, sendToClient = true, previewEmail = false } = req.body;
        // Get the authenticated user's ID from the request (set by authMiddleware)
        const authUserId = req.userId;
        if (!authUserId) {
            res.status(401).json({ error: "Unauthorized - No user ID found" });
            return;
        }
        const client = yield prisma.client.findUnique({
            where: { id: Number(clientId) },
        });
        if (!client) {
            res.status(404).json({ error: "Client not found" });
            return;
        }
        // Get the authenticated user's email for preview
        const authUser = yield prisma.user.findUnique({
            where: { userId: Number(authUserId) },
            select: { email: true, username: true },
        });
        if (!authUser || !authUser.email) {
            res
                .status(404)
                .json({ error: "Authenticated user not found or has no email" });
            return;
        }
        // Determine recipient emails
        let recipientEmails = [];
        let recipientNames = [];
        if (previewEmail && !sendToClient) {
            // Send to the logged-in user's email only
            recipientEmails = [authUser.email];
            recipientNames = [authUser.username || "User"];
        }
        else if (sendToClient) {
            // Send to both contact person and company emails if available
            if (client.contactPersonEmail) {
                recipientEmails.push(client.contactPersonEmail);
                recipientNames.push(client.contactPerson || "Contact Person");
            }
            if (client.companyEmail &&
                client.companyEmail !== client.contactPersonEmail) {
                recipientEmails.push(client.companyEmail);
                recipientNames.push(client.companyName || "Company");
            }
            if (recipientEmails.length === 0) {
                res
                    .status(400)
                    .json({ error: "No valid recipient email addresses found" });
                return;
            }
        }
        else {
            res.status(400).json({ error: "No valid recipient email address" });
            return;
        }
        // Get the expiry date of the requested service to find all services with same expiry
        let targetExpiryDate = null;
        // First, find the expiry date of the requested service
        if (serviceType.includes("Domain") && client.domainExpiryDate) {
            targetExpiryDate = new Date(client.domainExpiryDate);
        }
        else if (serviceType.includes("Hosting") && client.hostingExpiryDate) {
            targetExpiryDate = new Date(client.hostingExpiryDate);
        }
        else if (serviceType.includes("Microsoft") && client.microsoftServices) {
            const msServices = typeof client.microsoftServices === "string"
                ? JSON.parse(client.microsoftServices)
                : client.microsoftServices;
            if (msServices.length > 0) {
                targetExpiryDate = new Date(msServices[0].expiryDate);
            }
        }
        else if (serviceType.includes("Maintenance") &&
            client.maintenanceExpiryDate) {
            targetExpiryDate = new Date(client.maintenanceExpiryDate);
        }
        else if (serviceType.includes("Web Design") &&
            client.webDesignInstallments) {
            try {
                const installments = typeof client.webDesignInstallments === "string"
                    ? JSON.parse(client.webDesignInstallments)
                    : client.webDesignInstallments;
                const unpaidInstallment = installments.find((inst) => !inst.paid);
                if (unpaidInstallment) {
                    targetExpiryDate = new Date(unpaidInstallment.dueDate);
                }
            }
            catch (e) {
                console.error("Error parsing web design installments:", e);
            }
        }
        // Prepare services data for the invoice - include ALL services with same expiry date
        const services = [];
        // Always include domain service if it has the same expiry date
        if (client.domainExpiryDate &&
            (!targetExpiryDate ||
                new Date(client.domainExpiryDate).toISOString().split("T")[0] ===
                    targetExpiryDate.toISOString().split("T")[0])) {
            services.push(createService("Domain", client.domainExpiryDate, client.domainAmount, client.domainVatType));
        }
        // Always include hosting service if it has the same expiry date
        if (client.hostingExpiryDate &&
            (!targetExpiryDate ||
                new Date(client.hostingExpiryDate).toISOString().split("T")[0] ===
                    targetExpiryDate.toISOString().split("T")[0])) {
            services.push(createService("Hosting", client.hostingExpiryDate, client.hostingAmount, client.hostingVatType));
        }
        // Microsoft services
        if (client.microsoftServices) {
            const microsoftServices = typeof client.microsoftServices === "string"
                ? JSON.parse(client.microsoftServices)
                : client.microsoftServices;
            microsoftServices.forEach((service) => {
                const serviceExpiry = new Date(service.expiryDate);
                if (!targetExpiryDate ||
                    serviceExpiry.toISOString().split("T")[0] ===
                        targetExpiryDate.toISOString().split("T")[0]) {
                    services.push(createService(`Microsoft (${service.noOfAccounts} accounts)`, service.expiryDate, service.amount, service.microsoftVatType));
                }
            });
        }
        // Maintenance service
        if (client.maintenanceExpiryDate &&
            (!targetExpiryDate ||
                new Date(client.maintenanceExpiryDate).toISOString().split("T")[0] ===
                    targetExpiryDate.toISOString().split("T")[0])) {
            services.push(createService("Maintenance", client.maintenanceExpiryDate, client.maintenanceAmount, client.maintenanceVatType));
        }
        // Web Design installments
        if (client.webDesignInstallments) {
            try {
                const installments = typeof client.webDesignInstallments === "string"
                    ? JSON.parse(client.webDesignInstallments)
                    : client.webDesignInstallments;
                installments.forEach((installment) => {
                    if (!installment.paid) {
                        const installmentDate = new Date(installment.dueDate);
                        if (!targetExpiryDate ||
                            installmentDate.toISOString().split("T")[0] ===
                                targetExpiryDate.toISOString().split("T")[0]) {
                            services.push(createService(`Web Design ${installment.number}${installment.number === installments.length ? " (Final)" : ""} Installment`, installment.dueDate, installment.amount, client.webDesignVatType));
                        }
                    }
                });
            }
            catch (e) {
                console.error("Error parsing web design installments:", e);
            }
        }
        // Group services by expiry date (like the client does)
        const dateGroups = {};
        services.forEach((service) => {
            const dateKey = service.expiry
                ? new Date(service.expiry).toISOString().split("T")[0]
                : "none";
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = [];
            }
            dateGroups[dateKey].push(service);
        });
        // Create final grouped services array
        const finalServices = [];
        Object.entries(dateGroups).forEach(([dateKey, serviceGroup]) => {
            if (dateKey === "none")
                return;
            // For Microsoft services with same date, combine them
            const microsoftServices = serviceGroup.filter((s) => s.type.startsWith("Microsoft"));
            const otherServices = serviceGroup.filter((s) => !s.type.startsWith("Microsoft"));
            // Calculate total Microsoft accounts and amount
            const microsoftTotalAccounts = microsoftServices.reduce((sum, service) => { var _a; return sum + parseInt(((_a = service.type.match(/\((\d+) accounts\)/)) === null || _a === void 0 ? void 0 : _a[1]) || "0"); }, 0);
            const microsoftTotalAmount = microsoftServices.reduce((sum, service) => sum + (service.amount || 0), 0);
            // Combine all services for display
            const displayServices = [...otherServices];
            if (microsoftServices.length > 0) {
                displayServices.push({
                    type: `Microsoft (${microsoftTotalAccounts} accounts)`,
                    expiry: microsoftServices[0].expiry,
                    amount: microsoftTotalAmount,
                    daysLeft: microsoftServices[0].daysLeft,
                    vatType: microsoftServices[0].vatType,
                });
            }
            // Add each service from the group to the final services array
            displayServices.forEach((service) => {
                finalServices.push(service);
            });
        });
        // Send email to all recipients
        for (let i = 0; i < recipientEmails.length; i++) {
            yield (0, reminderEmailService_1.sendReminderEmailWithInvoice)(Object.assign(Object.assign({}, client), { contactPersonEmail: recipientEmails[i], contactPerson: recipientNames[i] }), finalServices, previewEmail, previewEmail ? [] : ["gauravkhadka111111@gmail.com"], [recipientEmails[i]]);
        }
        // Update last reminder date only if sending to client (not preview)
        if (sendToClient && !previewEmail) {
            yield prisma.client.update({
                where: { id: Number(clientId) },
                data: {
                    lastReminderDate: new Date(),
                },
            });
            // Log this activity
            yield prisma.activityLog.create({
                data: {
                    action: "SEND_REMINDER",
                    details: `Reminder email sent for ${serviceType} to ${recipientEmails.join(", ")}`,
                    userId: Number(authUserId),
                    clientId: Number(clientId),
                },
            });
        }
        else if (previewEmail) {
            // Log preview activity
            yield prisma.activityLog.create({
                data: {
                    action: "PREVIEW_REMINDER",
                    details: `Preview email sent for ${serviceType}`,
                    userId: Number(authUserId),
                    clientId: Number(clientId),
                },
            });
        }
        res.status(200).json({
            message: `Email ${previewEmail ? "preview" : ""} sent successfully to ${recipientEmails.join(", ")}`,
            recipientEmails,
            isPreview: previewEmail,
        });
    }
    catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({
            error: "Failed to send email",
            details: error.message,
        });
    }
});
exports.sendReminderEmail = sendReminderEmail;
const renewClientService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const transporter = createTransporter();
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const decodedToken = decodeToken(token);
        if (!decodedToken || !decodedToken.userId) {
            res.status(401).json({ message: "Unauthorized: Invalid token" });
            return;
        }
        const { id } = req.params;
        const { serviceType, newExpiryDate, sendEmail } = req.body;
        const userId = decodedToken.userId;
        // Get the existing client
        const existingClient = yield prisma.client.findUnique({
            where: { id: Number(id) },
        });
        if (!existingClient) {
            res.status(404).json({ error: "Client not found" });
            return;
        }
        let updateData = {};
        let serviceField = "";
        // Determine which service to update based on serviceType
        switch (serviceType.toLowerCase()) {
            case "domain":
                updateData.domainExpiryDate = new Date(newExpiryDate);
                serviceField = "domainExpiryDate";
                break;
            case "hosting":
                updateData.hostingExpiryDate = new Date(newExpiryDate);
                serviceField = "hostingExpiryDate";
                break;
            case "maintenance":
                updateData.maintenanceExpiryDate = new Date(newExpiryDate);
                serviceField = "maintenanceExpiryDate";
                break;
            case "microsoft":
                if (existingClient.microsoftServices) {
                    const services = typeof existingClient.microsoftServices === "string"
                        ? JSON.parse(existingClient.microsoftServices)
                        : existingClient.microsoftServices;
                    const updatedServices = services.map((service) => (Object.assign(Object.assign({}, service), { expiryDate: new Date(newExpiryDate) })));
                    updateData.microsoftServices = updatedServices;
                    serviceField = "microsoftServices expiry dates";
                }
                break;
            default:
                res.status(400).json({ error: "Invalid service type" });
                return;
        }
        // Update the client
        const updatedClient = yield prisma.client.update({
            where: { id: Number(id) },
            data: updateData,
        });
        // Log the activity
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
        });
        yield prisma.activityLog.create({
            data: {
                action: "UPDATE",
                details: `${(user === null || user === void 0 ? void 0 : user.firstname) || "System"} renewed ${serviceType} service. New expiry date: ${new Date(newExpiryDate).toLocaleDateString()}`,
                userId: Number(userId),
                clientId: Number(id),
            },
        });
        // Send email if requested
        if (sendEmail && existingClient.companyEmail) {
            try {
                const formattedDate = new Date(newExpiryDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
                const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
              <h2 style="margin: 0;">Service Renewal Confirmation</h2>
            </div>
            <div style="padding: 20px;">
              <p>Dear Sir/Madam,</p>
              <p>Your ${serviceType} service has been successfully renewed.</p>
              <p>The new expiry date is <strong>${formattedDate}</strong>.</p>
              <p>Thank you for your continued business.</p>
              <p>Best regards,<br/>Webtech Nepal Pvt. Ltd</p>
            </div>
          </div>
        `;
                // Prepare CC recipients
                const ccRecipients = [
                    "gaurav@webtech.com.np",
                    "testuser1@comeonnepal.com",
                ];
                if (existingClient.contactPersonEmail) {
                    ccRecipients.push(existingClient.contactPersonEmail);
                }
                const mailOptions = {
                    to: existingClient.companyEmail,
                    subject: `${serviceType} Service Renewal Confirmation`,
                    html: emailContent,
                    cc: ccRecipients,
                };
                yield transporter.sendMail(mailOptions);
            }
            catch (emailError) {
                console.error("Error sending email:", emailError);
            }
        }
        res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error("Error renewing service:", error);
        res.status(500).json({ error: "Failed to renew service" });
    }
});
exports.renewClientService = renewClientService;
//---------------------------------------- Renew Client Service End ------------------------------------------
// -------------------------------------- Send Expiry Reminder Start ---------------------------------------
// -------------------------------------- Send Expiry Reminder End ---------------------------------------
// ----------------------------------------- Preview Expiry Reminder Start -------------------------------------
// ----------------------------------------- Preview Expiry Reminder End -------------------------------------
//------------------------------ Update Project Status Start ----------------------------------------------
const updateClientProjectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { projectStatus, websiteLiveDate } = req.body;
        // Prepare the update data object
        const updateData = {};
        if (projectStatus !== undefined) {
            updateData.projectStatus = projectStatus;
        }
        if (websiteLiveDate !== undefined) {
            if (websiteLiveDate) {
                const parsedDate = new Date(websiteLiveDate);
                if (!isNaN(parsedDate.getTime())) {
                    updateData.websiteLiveDate = parsedDate;
                }
                else {
                    console.log("Invalid date format");
                }
            }
            else {
                updateData.websiteLiveDate = null;
            }
        }
        const updatedClient = yield prisma.client.update({
            where: { id: Number(id) },
            data: updateData,
        });
        res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error("Error updating client project status:", error);
        res.status(500).json({ error: "Failed to update client project status" });
    }
});
exports.updateClientProjectStatus = updateClientProjectStatus;
//------------------------------ Update Project Status End ----------------------------------------------
//========================================= Project Comment CRUD Start ======================================
const addProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId } = req.params;
    const { content, userId } = req.body;
    try {
        const newComment = yield prisma.projectComment.create({
            data: {
                content,
                clientId: Number(clientId),
                userId: userId ? Number(userId) : undefined,
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });
        res.status(201).json(newComment);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to add comment" });
    }
});
exports.addProjectComment = addProjectComment;
const getProjectComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId } = req.params;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    try {
        const comments = yield prisma.projectComment.findMany({
            where: {
                clientId: Number(clientId),
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
                likes: {
                    where: userId ? { userId } : undefined,
                    select: {
                        userId: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                firstname: true,
                                lastname: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                _count: {
                    select: {
                        likes: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const formattedComments = comments.map((comment) => (Object.assign(Object.assign({}, comment), { likeCount: comment._count.likes, likedByUser: comment.likes.length > 0, replies: comment.replies.map((reply) => ({
                id: reply.id,
                content: reply.content,
                createdAt: reply.createdAt,
                user: reply.user,
            })) })));
        res.json(formattedComments);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving comments: ${error.message}` });
    }
});
exports.getProjectComments = getProjectComments;
const updateProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content } = req.body;
    try {
        const updatedComment = yield prisma.projectComment.update({
            where: { id: Number(commentId) },
            data: { content },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });
        res.status(200).json(updatedComment);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error updating comment: ${error.message}` });
    }
});
exports.updateProjectComment = updateProjectComment;
const deleteProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    try {
        // First delete all likes associated with the comment
        yield prisma.projectCommentLike.deleteMany({
            where: { commentId: Number(commentId) },
        });
        // Then delete all replies to the comment
        yield prisma.projectCommentReply.deleteMany({
            where: { commentId: Number(commentId) },
        });
        // Finally delete the comment itself
        yield prisma.projectComment.delete({
            where: { id: Number(commentId) },
        });
        res.status(204).send();
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error deleting comment: ${error.message}` });
    }
});
exports.deleteProjectComment = deleteProjectComment;
//========================================= Project Comment CRUD End ======================================
//========================================= Project Comment Like Reply Start ======================================
const likeProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { userId } = req.body;
    try {
        // Check if user already liked the comment
        const existingLike = yield prisma.projectCommentLike.findFirst({
            where: {
                userId: Number(userId),
                commentId: Number(commentId),
            },
        });
        if (existingLike) {
            // Unlike if already liked
            yield prisma.projectCommentLike.delete({
                where: {
                    id: existingLike.id,
                },
            });
        }
        else {
            // Like if not already liked
            yield prisma.projectCommentLike.create({
                data: {
                    userId: Number(userId),
                    commentId: Number(commentId),
                },
            });
        }
        // Get updated like count
        const likeCount = yield prisma.projectCommentLike.count({
            where: {
                commentId: Number(commentId),
            },
        });
        res.json({
            success: true,
            likeCount,
            likedByUser: !existingLike,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error liking comment: ${error.message}`,
        });
    }
});
exports.likeProjectComment = likeProjectComment;
const addReplyToProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content, userId } = req.body;
    try {
        const reply = yield prisma.projectCommentReply.create({
            data: {
                content,
                userId: Number(userId),
                commentId: Number(commentId),
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
            },
        });
        res.status(201).json(reply);
    }
    catch (error) {
        res.status(500).json({ message: `Error adding reply: ${error.message}` });
    }
});
exports.addReplyToProjectComment = addReplyToProjectComment;
const likeProjectCommentReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { replyId } = req.params;
    const { userId } = req.body;
    try {
        // First get the reply to find its commentId
        const reply = yield prisma.projectCommentReply.findUnique({
            where: { id: Number(replyId) },
            select: { commentId: true },
        });
        if (!reply) {
            res.status(404).json({ success: false, message: "Reply not found" });
            return;
        }
        // Check if user already liked the reply
        const existingLike = yield prisma.projectCommentLike.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(replyId),
            },
        });
        if (existingLike) {
            // Unlike if already liked
            yield prisma.projectCommentLike.delete({
                where: { id: existingLike.id },
            });
        }
        else {
            // Like if not already liked - include commentId from the reply
            yield prisma.projectCommentLike.create({
                data: {
                    userId: Number(userId),
                    replyId: Number(replyId),
                    commentId: reply.commentId, // Include the commentId from the reply
                },
            });
        }
        // Get updated like count
        const likeCount = yield prisma.projectCommentLike.count({
            where: { replyId: Number(replyId) },
        });
        res.json({
            success: true,
            likeCount,
            likedByUser: !existingLike,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error liking reply: ${error.message}`,
        });
    }
});
exports.likeProjectCommentReply = likeProjectCommentReply;
const addReplyToProjectCommentReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { replyId } = req.params;
    const { content, userId } = req.body;
    try {
        // First get the parent reply to find its commentId
        const parentReply = yield prisma.projectCommentReply.findUnique({
            where: { id: Number(replyId) },
            select: { commentId: true },
        });
        if (!parentReply) {
            res.status(404).json({ message: "Parent reply not found" });
            return;
        }
        const reply = yield prisma.projectCommentReply.create({
            data: {
                content,
                userId: Number(userId),
                parentReplyId: Number(replyId),
                commentId: parentReply.commentId, // Include the commentId from the parent reply
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
            },
        });
        res.status(201).json(reply);
    }
    catch (error) {
        res.status(500).json({ message: `Error adding reply: ${error.message}` });
    }
});
exports.addReplyToProjectCommentReply = addReplyToProjectCommentReply;
//========================================= Project Comment Like Reply End ======================================
//====================================== Client Follow up Note CRUD Start ==========================================
// Update the addFollowupNote function
const addFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId } = req.params;
    const { content, userId } = req.body;
    if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
    }
    try {
        // First verify the client exists
        const client = yield prisma.client.findUnique({
            where: { id: Number(clientId) },
        });
        if (!client) {
            res.status(404).json({ message: "Client not found" });
            return;
        }
        // Verify user exists
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const newFollowupNote = yield prisma.followupNote.create({
            data: {
                content,
                clientId: Number(clientId),
                userId: Number(userId),
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });
        res.status(201).json(newFollowupNote);
    }
    catch (error) {
        console.error("Error adding follow-up note:", error);
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                res.status(400).json({
                    message: "Invalid client or user ID",
                    details: error.meta,
                });
                return;
            }
        }
        if (error instanceof Error) {
            res.status(500).json({
                message: "Failed to add follow-up note",
                error: error.message,
            });
        }
        else {
            res.status(500).json({
                message: "Failed to add follow-up note",
                error: "Unknown error occurred",
            });
        }
    }
});
exports.addFollowupNote = addFollowupNote;
const getFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId } = req.params;
    try {
        const whereCondition = Number(clientId) === 0 ? {} : { clientId: Number(clientId) };
        const followupNotes = yield prisma.followupNote.findMany({
            where: whereCondition,
            include: {
                user: {
                    select: {
                        userId: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        companyName: true,
                        domainName: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(followupNotes);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving follow-up notes: ${error.message}` });
    }
});
exports.getFollowupNote = getFollowupNote;
const updateFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
    }
    try {
        const updatedFollowupNote = yield prisma.followupNote.update({
            where: { id: Number(commentId) },
            data: { content },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });
        res.status(200).json(updatedFollowupNote);
    }
    catch (error) {
        console.error("Error updating follow-up note:", error);
        res
            .status(500)
            .json({ message: `Error updating follow-up note: ${error.message}` });
    }
});
exports.updateFollowupNote = updateFollowupNote;
const deleteFollowupNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    try {
        yield prisma.followupNote.delete({
            where: { id: Number(commentId) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting follow-up note:", error);
        res
            .status(500)
            .json({ message: `Error deleting follow-up note: ${error.message}` });
    }
});
exports.deleteFollowupNote = deleteFollowupNote;
//========================== Client Follow up Note CRUD End ==========================================
