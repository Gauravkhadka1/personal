import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ServiceExpiry {
  type: string;
  expiry?: string | Date | null | undefined;
  amount?: number | null | undefined;
  daysLeft?: number | string | null;
  vatType?: "inclusive" | "exclusive" | "non-vat" | null;
}

export interface ExpiryGroup {
  services: ServiceExpiry[];
  totalAmount: number;
  expiryDate?: string | null;
  client?: ClientWithExpiry;
}

export interface ClientWithExpiry extends Client {
  expiryGroups: ExpiryGroup[];
  allServices: ServiceExpiry[];
  hasExpiringServices: boolean;
}

export interface RenewServiceData {
  client: Client;
  services: {
    type: string;
    currentExpiry: Date | string | undefined;
  }[];
}

export interface ClientType {
  id: number;
  domainName: string;
  companyName: string;
  projectStatus: string;
  projectPriority: number;
  startDate?: string;
  endDate?: string;
  websiteLiveDate?: string;
  websiteSupportPeriod?: string;

  googleDriveLink?: string;
  tasks?: Task[];
}
export interface ProjectTimeline {
  id?: number;
  title?: string;
  description?: string;
  deadline?: string | Date | null;
  clientId?: number;
  status: ProjectTimelineStatus;
  createdAt?: string;
  updatedAt?: string;
}

export enum ProjectTimelineStatus {
  ToDo = "ToDo",
  InProgress = "InProgress",
  Completed = "Completed"
}
export interface Client {
  id: number;
  domainName: string;
  serviceType: string;
  amount: number;
  daysLeft: number;
  expiryDate: string;
  hostingSpace: string;
  status: string;
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  companyPhone: string;
  contactPerson: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  additionalNotes: string;
  pan_vat_num: String;

  domainActiveDate: string;
  domainExpiryDate: string;
  domainAmount: number;
  domainType: string;
  domainVatType?: "inclusive" | "exclusive" | "non-vat" | null;
  hostingActiveDate: string;
  hostingExpiryDate: string;
  hostingAmount: number;
  hostingType: string;
  hostingVatType?: "inclusive" | "exclusive" | "non-vat" | null;

  microsoftServices?: MicrosoftService[];

  maintenanceActiveDate: string;
  maintenanceExpiryDate: string;
  maintenanceAmount: number;
  maintenanceType: string;
  maintenanceVatType?: "inclusive" | "exclusive" | "non-vat" | null;
  maintenanceDescription: string;

  // Web Design

  webDesignTotalAmount?: number;
  webDesignVatType?: "inclusive" | "exclusive" | "non-vat" | null;
  webDesignAgreement?: string;

  webDesignInstallments?: Installment[];
  activityLogs?: ActivityLog[];

  lastReminderDate?: string | null;

  projectDescription?: string;
  projectTimeline?: ProjectTimeline[];
  webDesignCategories?: string[]; 
  webDesignTechStack?: string;
  webDesignRating?: number;
  projectStatus?: string;
  projectPriority?: number;
  startDate?: string;
  endDate?: string;
  websiteLiveDate?: string;
  websiteSupportPeriod?: string;
  googleDriveLink?: string;
  tasks?: Task[];
  payments?: Payment[];

  // Add these properties for expiry functionality
  expiryGroups?: ExpiryGroup[];
  allServices?: ServiceExpiry[];
  hasExpiringServices?: boolean;

  createdDaysAgo: string;

  createdAt: string;
  updatedAt: string;
}

export interface ClientDesignCounts {
  categories: Record<string, number>;
  techStacks: Record<string, number>;
  totalClientsWithDesign: number;
}

export interface ClientsByDesignCriteriaResponse {
  clients: Client[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    category: string | string[] | null;
    techStack: string | string[] | null;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
}

export interface ClientsListResponse {
  clients: Client[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export type ClientsResponse =
  | ClientsByDesignCriteriaResponse
  | ClientsListResponse;

// Helper functions to check the type
export const isDesignCriteriaResponse = (
  data: ClientsResponse,
): data is ClientsByDesignCriteriaResponse => {
  return "pagination" in data && "filters" in data && "sorting" in data;
};

export const isListResponse = (
  data: ClientsResponse,
): data is ClientsListResponse => {
  return !isDesignCriteriaResponse(data);
};

// Helper functions to get common properties
export const getClientsFromResponse = (data: ClientsResponse): Client[] => {
  return data.clients;
};

export const getTotalPagesFromResponse = (data: ClientsResponse): number => {
  if (isDesignCriteriaResponse(data)) {
    return data.pagination.totalPages;
  }
  return data.totalPages;
};

export const getCurrentPageFromResponse = (data: ClientsResponse): number => {
  if (isDesignCriteriaResponse(data)) {
    return data.pagination.currentPage;
  }
  return data.currentPage;
};

export const getTotalCountFromResponse = (data: ClientsResponse): number => {
  if (isDesignCriteriaResponse(data)) {
    return data.pagination.totalCount;
  }
  return data.totalCount;
};

export interface Prospects {
  id: number;
  name: string;
  description: string;
  status: ProspectsStatus;
  category: string;
  inquiryDate?: string;
  activityLogs?: ActivityLog[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  sound: string;
  isRead: boolean;
  createdAt: string;
  userId: number;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Normal = "Normal",
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "Work In Progress",
  QA = "QA",
  Completed = "Completed",
}
export enum ProspectsStatus {
  New = "New",
  Dealing = "Dealing",
  QuoteSent = "QuoteSent",
  AgreementSent = "AgreementSent",
  Converted = "Converted",
}

export interface User {
  userId?: number;
  firstname: string;
  lastname: string;
  username: string;
  phone: string;
  email: string;
  profilePictureUrl?: string;
  role: "ADMIN" | "MANAGER" | "INTERN";
  birthday?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  lastSeenAt?: string;
  isOnline?: boolean;
  clientId?: number; // Add clientId
  client?: {
    companyName: string;
    domainName: string;
  };
  _count?: {
    knowledgeSharings?: number;
  };
}

export interface UserPayload {
  firstname: string;
  lastname: string;
  username: string;
  phone: string;
  email: string;
  profilePictureUrl?: string;
  role: "ADMIN" | "DESIGNER" | "DEVELOPER" | "INTERN" | "CLIENT";
  password: string;
  clientId?: number;
}
export interface Attachment {
  id: number;
  fileName: string;
  fileURL: string;
  taskId: number;
  uploadedById: number;
  createdAt: string;
  uploadedBy?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
  };
}
export interface ActivityLog {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  userId: number;
  user?: User;
}

export interface CommentReply {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  userId: number;
  user: User;
  commentId: number;
  parentReplyId?: number | null;
  likes: CommentReplyLike[];
  mentions: CommentReplyMention[];
  replies?: CommentReply[];
}

export interface CommentReplyLike {
  id: number;
  userId: number;
  user: {
    userId: number;
    username: string;
  };
  replyId: number;
  createdAt: string;
}

export interface CommentReplyMention {
  id: number;
  replyId: number;
  userId: number;
  user: User;
  createdAt: string;
}

export interface CommentLike {
  id: number;
  userId: number;
  user: {
    userId: number;
    username: string;
  };
  commentId: number;
  createdAt: string;
}

export interface Mention {
  id: number;
  commentId: number;
  userId: number;
  user: User;
  createdAt: string;
}

// Update the Comment interface
export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  userId: number;
  user?: User;
  taskId: number;
  mentions: Mention[];
  likes: CommentLike[];
  replies: CommentReply[];
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status?: Status | null;
  priority?: Priority | null;
  tags?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  formattedTimeSpent?: string | null;
  formattedCurrentElapsed?: string | null;
  points?: number | null;
  clientId: number;
  assignedBy?: string | null;
  assignedTo?: string[] | null | undefined;
  author?: User | null;
  assignedUsers?: User[] | null;
  comments?: Comment[] | null;
  attachments?: Attachment[] | null;
  activityLogs?: ActivityLog[] | null;
  parentTaskId?: number | null; // Add this
  subtasks?: Task[] | null; // Add this
  client?: ClientType | undefined;
  category?:
    | "Design"
    | "Development"
    | "ContentFillup"
    | "AMC"
    | "Other"
    | null;

  isTimerRunning?: boolean;
  timerStartTime?: string | null;
  timeSpent?: number;

  isDeleted?: boolean;
  deletedAt?: string | null;

  // Add these fields for parent task and project information
  parentTask?: {
    id: number;
    title: string;
    client?: {
      id: number;
      companyName: string;
      domainName: string;
    } | null;
  } | null;
}

export interface SearchResults {
  tasks?: Task[];
  clients?: ClientType[];
  users?: User[];
}

export interface Team {
  teamId: number;
  teamName: string;
  productOwnerUserId?: number;
  projectManagerUserId?: number;
}

export interface Category {
  id: number;
  categoryName: string;
  categoryCode?: string;
}

export interface Installment {
  number: number;
  amount: number;
  dueDate: string;
  paid: boolean;
  receipt: FileList | null;
}

interface MicrosoftService {
  noOfAccounts: string;
  amount: number;
  activeDate: string;
  expiryDate: string;
  serviceType: string;
  microsoftVatType: string;
  purchaseOrder: File | null;
  vendor?: "Connex" | "iDream"; 
}

export interface FollowupNote {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  clientId: number;
  user: {
    firstname: string;
    lastname: string;
    profilePictureUrl: string;
  };
  likeCount: number;
  likedByUser: boolean;
  // replies: ProjectCommentReply[];
}
export interface ProspectFollowupNote {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  prospectId: number;
  user: {
    firstname: string;
    lastname: string;
    profilePictureUrl: string;
  };
  likeCount: number;
  likedByUser: boolean;
  // replies: ProjectCommentReply[];
}
export interface ProjectComment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  clientId: number;
  user: {
    firstname: string;
    lastname: string;
    profilePictureUrl: string;
  };
  likeCount: number;
  likedByUser: boolean;
  replies: ProjectCommentReply[];
}

export interface ProjectCommentReply {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  user: {
    firstname: string;
    lastname: string;
    profilePictureUrl: string;
  };
  likeCount?: number;
  likedByUser?: boolean;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  NoteLike: NoteLike[];
  NoteReply: NoteReply[];
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface Checklist {
  id: number;
  title: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  items: ChecklistItem[];
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  order: number;
  checklistId: number;
}
export interface SalesNote {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  userId: number;
  SalesNoteLike: SalesNoteLike[];
  SalesNoteReply: SalesNoteReply[];
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface SalesNoteLike {
  id: number;
  userId: number;
  noteId: number;
  createdAt: string;
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface SalesNoteReply {
  id: number;
  content: string;
  userId: number;
  noteId: number;
  createdAt: string;
  updatedAt: string;
  likes: SalesNoteReplyLike[];
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface SalesNoteReplyLike {
  id: number;
  userId: number;
  replyId: number;
  createdAt: string;
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface TodayUpdate {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  likes: Like[];
  replies: Reply[];
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}
export interface SystemUpdate {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
}
export interface FeedbackAttachment {
  id: number;
  fileName: string;
  fileURL: string;
  feedbackId: number;
  uploadedById: number;
  createdAt: string;
  uploadedBy?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
  };
}

export interface SystemFeedback {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  attachments?: FeedbackAttachment[];
  status: "New" | "Acknowledged" | "InProgress" | "Resolved";
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}
export interface UserFeedbackStats {
  user: User;
  feedbacks: SystemFeedback[];
  statusCounts: {
    New: number;
    Acknowledged: number;
    InProgress: number;
    Resolved: number;
  };
  totalCount: number;
  resolvedCount: number;
}

export interface KnowledgeSharing {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  attachments?: KnowledgeSharingAttachment[];
  likes?: Like[];
  comments?: Comment[];
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
  _count?: {
    likes: number;
    comments: number;
  };
}
export interface KnowledgeSharingAttachment {
  id: number;
  fileName: string;
  fileURL: string;
  feedbackId: number;
  uploadedById: number;
  createdAt: string;
  uploadedBy?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
  };
}

export interface KnowledgeSharingLike {
  id: number;
  userId: number;
  knowledgeSharingId: number;
  createdAt: string;
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
  };
}

export interface KnowledgeSharingComment {
  id: number;
  content: string;
  userId: number;
  knowledgeSharingId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
  };
}

export interface Like {
  id: number;
  userId: number;
  updateId: number;
  createdAt: string;
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface Reply {
  id: number;
  content: string;
  userId: number;
  updateId: number;
  createdAt: string;
  updatedAt: string;
  likes: LikeOnReply[];
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}
export interface NoteLike {
  id: number;
  userId: number;
  updateId: number;
  createdAt: string;
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface NoteReply {
  id: number;
  content: string;
  userId: number;
  updateId: number;
  createdAt: string;
  updatedAt: string;
  likes: LikeOnReply[];
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
  replies?: NoteReply[];
}

export interface LikeOnReply {
  id: number;
  userId: number;
  replyId: number;
  createdAt: string;
  user: {
    userId: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    lastSeenAt?: string;
    isOnline?: boolean;
  };
}

export interface Payment {
  id: number;
  clientId: number;
  client?: ClientType;
  paymentType: string;
  category: string;
  amount: number;
  paidDate: string;
  paidNepaliDate: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TimerStatus {
  isTimerRunning: boolean;
  timerStartTime: string | null;
  totalTimeSpent: number;
  currentElapsed: number;
  totalElapsed: number;
}

export interface DailyTask {
  title: string;
  clientDomainName: string;
  clientCompanyName: string;
  status: string;
  timeSpent: number;
  timeSpentHuman: string;
  timeSpentFormatted: string;
}

export interface ScheduleSlot {
  timeFrame: string;
  timeSpent: number;
  timeSpentHuman: string;
  timeSpentFormatted: string;
  tasks: DailyTask[];
  isActive: boolean;
  isCoreHour: boolean;
}

export interface DailySummary {
  date: string;
  totalTasks: number;
  tasks: DailyTask[];
  totalTimeSpent: number;
  totalTimeFormatted: string;
  totalTimeHuman: string;
  totalIntervals: number;
  activeIntervals: number;
  coreHoursDisplayed: string;
}

export interface ScheduleData {
  timeZone: string;
  date: string;
  schedule: ScheduleSlot[];
  dailySummary: DailySummary;
}

export interface PolicyCategory {
  id: number;
  name: string;
  description?: string;
  policies?: Policy[];
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: number;
  content: string;
  categoryId: number;
  category?: PolicyCategory;
  version: number;
  isActive: boolean;
  createdBy: number;
  createdByUser?: {
    userId: number;
    username: string;
    email: string;
  };
  updatedBy?: number;
  updatedByUser?: {
    userId: number;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskReportData {
  summary: {
    totalTasksCompleted: number;
    tasksInCurrentPage: number;
    totalTimeSpent: string;
    averageCompletionTime: string;
    dateRange: {
      from: string;
      to: string | null;
    };
    filters: {
      assignedTo: string | number;
    };
  };
  tasksByUser: Array<{
    userName: string;
    userId: number;
    taskCount: number;
    totalTimeSpent: number;
    tasks: Array<{
      id: number;
      title: string;
      completedAt: string;
      timeSpent: number;
    }>;
  }>;
  tasksByProject: Array<{
    projectName: string;
    projectId: number;
    taskCount: number;
    totalTimeSpent: number;
    tasks: Array<{
      id: number;
      title: string;
      completedAt: string;
      timeSpent: number;
    }>;
  }>;
  todayUpdates: Array<{
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
      userId: number;
      username: string;
      firstname: string;
      lastname: string;
      profilePictureUrl: string | null;
    };
    likes: Array<any>;
    replies: Array<any>;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    completedAt: string;
    createdAt: string;
    timeSpent: number;
    formattedTimeSpent: string;
    project: {
      id: number;
      name: string;
      description: string | null;
    } | null;
    client: {
      id: number;
      domainName: string;
      companyName: string;
    } | null;
    assignedUsers: Array<any>;
    subtasksCount: number;
    completedSubtasksCount: number;
    attachmentsCount: number;
    commentsCount: number;
    lastComment: any;
  }>;
}


export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    // Add this to your second API's prepareHeaders function to debug
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "Prospects",
    "Tasks",
    "DeletedTasks",
    "DeletedSubtasks",
    "TaskCounts",
    "Users",
    "Teams",
    "Comments",
    "Categories",
    "Clients",
    "ActivityLog",
    "Notifications",
    "Notes",
    "TodayUpdates",
    "SystemUpdates",
    "SystemFeedback",
    "KnowledgeSharing",
    "SalesNotes",
    "ProjectComments",
    "FollowupNote",
    "ProspectFollowupNote",
    "Payments",
    "Checklists",
    "SupportExpiring",
    "TaskTimer",
    "SubtaskTimer",
    "ClientDesignCounts",
    "ClientsByDesign",
    "UserSchedule",
    "Calendar",
    "Comment",
    "Reply",
    "PolicyCategories",
    "Policies",
    "TaskReport"
  ],
  endpoints: (build) => ({
    //========================================= Client End Point Start ===================================

    //========================================= Client CRUD End Point Start ===================================
    createClient: build.mutation<Client, FormData>({
      query: (formData) => ({
        url: "clients",
        method: "POST",
        body: formData,
        // Remove the Content-Type header to let the browser set it with the boundary
      }),
      invalidatesTags: ["Clients"],
    }),

    getClients: build.query<Client[], void>({
      query: () => "clients",
      providesTags: ["Clients"],
    }),
    getProjectTimelines: build.query<Client[], void>({
      query: () => "clients/project-timelines/all",
      providesTags: ["Clients"],
    }),

    getClientsForProjectPage: build.query<Client[], { search?: string }>({
      query: ({ search }) => ({
        url: "clients/project",
        params: { search },
      }),
      providesTags: ["Clients"],
    }),

    // client\src\state\api.ts
    getClientsForExpiryPage: build.query<
      {
        clients: Client[];
        currentNepaliMonth?: string;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalCount: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      },
      { page?: number; limit?: number; search?: string; filter?: string }
    >({
      query: ({ page = 1, limit = 20, search = "", filter = "" }) => ({
        url: "clients/expirypage",
        params: { page, limit, search, filter },
      }),
      providesTags: ["Clients"],
    }),

    // Add this to your existing api.ts file
    getNepaliCalendar: build.query<
      {
        success: boolean;
        data: {
          summary: {
            totalYears: number;
            currentNepaliYear: number;
            availableYearRange: {
              start: number;
              end: number;
            };
          };
          years: Array<{
            nepaliYear: number;
            hasCustomData: boolean;
            isCurrentYear: boolean;
            months: Array<{
              nepaliMonth: number;
              nepaliMonthName: string;
              startDate: string;
              endDate: string;
              days: number;
            }>;
          }>;
          monthReference: Array<{
            monthNumber: number;
            monthName: string;
            monthNameNepali: string;
          }>;
        };
      },
      void
    >({
      query: () => "calendar",
      providesTags: ["Calendar"],
    }),

    getClientDesignCounts: build.query<ClientDesignCounts, void>({
      query: () => "clients/design-counts",
      providesTags: ["ClientDesignCounts"],
    }),

    getClientsByDesignCriteria: build.query<
      ClientsByDesignCriteriaResponse,
      {
        category?: string | string[];
        techStack?: string | string[];
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
      }
    >({
      query: (params) => ({
        url: "clients/design/clients",
        params: {
          category: params.category,
          techStack: params.techStack,
          page: params.page,
          limit: params.pageSize,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      }),
      providesTags: ["ClientsByDesign"],
    }),

    getSupportExpiringClients: build.query<
      {
        clients: {
          id: number;
          companyName: string;
          domainName: string;
          contactPerson: string;
          contactPersonEmail: string;
          contactPersonPhone: string;
          websiteSupportPeriod: string | null;
          websiteLiveDate: string | null;
          projectStatus: string;
          daysAgo: number; // Changed from daysRemaining
          daysAgoMessage: string; // New field
          status: string;
          supportStatus: string;
        }[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      },
      { page?: number; pageSize?: number; search?: string }
    >({
      query: ({ page = 1, pageSize = 10, search = "" }) =>
        `clients/project-support/ending?page=${page}&pageSize=${pageSize}&search=${search}`,
      providesTags: ["SupportExpiring"],
    }),

    sendReminder: build.mutation({
      query: ({
        id,
        serviceType,
        sendToClient = true,
        previewEmail = false,
      }) => ({
        url: `clients/${id}/send-reminder`,
        method: "POST",
        body: { serviceType, sendToClient, previewEmail },
      }),
      invalidatesTags: ["Clients"],
    }),

    // Update the getClientCounts endpoint to include the total count
    getClientCounts: build.query<
      {
        totalClients: number;
        expiring: number;
        expiringIn30Days: number;
        expiringIn15Days: number;
        expiringIn7Days: number;
        expired: number;
        suspended: number;
        newClients30Days: number;
        projectStatusCounts: {
          New: number;
          "Client-Review": number;
          Design: number;
          Development: number;
          "Content-Fillup": number;
          AMC: number;
          Completed: number;
        };
      },
      void
    >({
      query: () => "clients/counts",
      providesTags: ["Clients"],
    }),

    // Add this query alongside getClientCounts
    getNewClientCounts: build.query<
      {
        year: number;
        totalNewClients: number;
        monthlyCounts: {
          month: number;
          monthName: string;
          count: number;
        }[];
      },
      void
    >({
      query: () => "clients/new-clients-counts",
      providesTags: ["Clients"],
    }),

    getClientsList: build.query<
      ClientsListResponse,
      { page?: number; pageSize?: number; search?: string }
    >({
      query: ({ page = 1, pageSize = 10, search = "" }) =>
        `clients/list?page=${page}&pageSize=${pageSize}&search=${search}`,
      providesTags: ["Clients"],
    }),
    getClientById: build.query<Client, number>({
      query: (id) => `clients/${id}`,
      providesTags: (result, error, id) => [{ type: "Clients", id }],
    }),
    updateClient: build.mutation<Client, { id: number; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `clients/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Clients"],
    }),

   
updateClientProjectStatus: build.mutation<
  Client,
  { id: number; projectStatus?: string; websiteLiveDate?: string }
>({
  query: ({ id, projectStatus, websiteLiveDate }) => ({
    url: `clients/${id}/project-status`,
    method: "PATCH",
    body: { projectStatus, websiteLiveDate },
  }),
  invalidatesTags: ["Clients"],
}),

    deleteClient: build.mutation<void, number>({
      query: (id) => ({
        url: `clients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Clients"],
    }),
    deleteMultipleClients: build.mutation<void, number[]>({
      query: (ids) => ({
        url: "clients",
        method: "DELETE",
        body: { ids },
      }),
      invalidatesTags: ["Clients"],
    }),
    searchClients: build.query<Client[], string>({
      query: (searchTerm) => `clients/search?q=${searchTerm}`,
      providesTags: ["Clients"],
    }),

    //========================================= Client CRUD End Point End ===================================

    getClientActivityLogs: build.query<ActivityLog[], number>({
      query: (clientId) => `clients/${clientId}/activities`,
      providesTags: (result, error, clientId) => [
        { type: "ActivityLog", id: clientId },
      ],
    }),

    logClientActivity: build.mutation<
      ActivityLog,
      { clientId: number; userId: number; action: string; details?: string }
    >({
      query: ({ clientId, userId, action, details }) => ({
        url: `clients/${clientId}/activities`,
        method: "POST",
        body: { userId, action, details },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "ActivityLog", id: clientId },
      ],
    }),

    renewClientService: build.mutation<
      Client,
      {
        id: number;
        serviceType: string;
        newExpiryDate: string;
        sendEmail: boolean;
      }
    >({
      query: ({ id, serviceType, newExpiryDate, sendEmail }) => ({
        url: `clients/${id}/renew-service`,
        method: "PATCH",
        body: { serviceType, newExpiryDate, sendEmail },
      }),
      invalidatesTags: ["Clients"],
    }),

    // Add to your api.ts endpoints

    getProjectComments: build.query<ProjectComment[], number>({
      query: (clientId) => `clients/project-comments/${clientId}`,
      providesTags: (result, error, clientId) => [
        { type: "ProjectComments", id: clientId },
      ],
    }),
    addProjectComment: build.mutation<
      ProjectComment,
      {
        clientId: number;
        content: string;
        userId: number;
      }
    >({
      query: ({ clientId, content, userId }) => ({
        url: `clients/project-comments/${clientId}`,
        method: "POST",
        body: { content, userId },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "ProjectComments", id: clientId },
      ],
    }),
    likeProjectComment: build.mutation<
      void,
      { commentId: number; userId: number }
    >({
      query: ({ commentId }) => ({
        url: `clients/project-comments/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: "ProjectComments", id: "LIST" },
      ],
    }),
    addProjectCommentReply: build.mutation<
      ProjectCommentReply,
      { commentId: number; content: string; userId: number }
    >({
      query: ({ commentId, content, userId }) => ({
        url: `clients/project-comments/${commentId}/reply`,
        method: "POST",
        body: { content, userId },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: "ProjectComments", id: "LIST" },
      ],
    }),
    likeProjectCommentReply: build.mutation<
      void,
      { replyId: number; userId: number }
    >({
      query: ({ replyId }) => ({
        url: `project-comments/replies/${replyId}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { replyId }) => [
        { type: "ProjectComments", id: "LIST" },
      ],
    }),

    updateProjectComment: build.mutation<
      ProjectComment,
      {
        commentId: number;
        content: string;
        clientId: number;
      }
    >({
      query: ({ commentId, content }) => ({
        url: `clients/project-comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "ProjectComments", id: clientId },
      ],
    }),
    deleteProjectComment: build.mutation<
      void,
      { commentId: number; clientId: number }
    >({
      query: ({ commentId }) => ({
        url: `clients/project-comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "ProjectComments", id: clientId }, // Use clientId
      ],
    }),

    // Follow up Note Start

    getFollowupNote: build.query<FollowupNote[], number>({
      query: (clientId) => `clients/followup-note/${clientId}`,
      providesTags: (result, error, clientId) => [
        { type: "FollowupNote", id: clientId },
      ],
    }),
    addFollowupNote: build.mutation<
      FollowupNote,
      {
        clientId: number;
        content: string;
        userId: number;
      }
    >({
      query: ({ clientId, content, userId }) => ({
        url: `clients/followup-note/${clientId}`,
        method: "POST",
        body: { content, userId },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "FollowupNote", id: clientId },
      ],
    }),

    updateFollowupNote: build.mutation<
      FollowupNote,
      {
        commentId: number;
        content: string;
        clientId: number;
      }
    >({
      query: ({ commentId, content }) => ({
        url: `clients/followup-note/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "FollowupNote", id: clientId },
      ],
    }),
    deleteFollowupNote: build.mutation<
      void,
      { followupNoteId: number; clientId: number }
    >({
      query: ({ followupNoteId }) => ({
        url: `clients/followup-note/${followupNoteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "FollowupNote", id: clientId }, // Use clientId
      ],
    }),
    //========================================= Client End Poing End ===================================

    // Prospect Follow up Note Start

    //========================================= Prospect End Poing Start ===================================
    createProspects: build.mutation<Prospects, Partial<Prospects>>({
      query: (prospects) => ({
        url: "prospects",
        method: "POST",
        body: prospects,
      }),
      invalidatesTags: ["Prospects"],
    }),
    getProspects: build.query<Prospects[], { prospectsId?: number }>({
      query: () => "prospects",
      providesTags: ["Prospects"],
    }),
    deleteProspects: build.mutation<void, number>({
      query: (prospectId) => ({
        url: `prospects/${prospectId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, prospectId) => [
        { type: "Prospects", id: prospectId },
        { type: "Prospects" },
      ],
    }),

    updateProspect: build.mutation<
      Prospects,
      {
        prospectsId: number;
        name?: string;
        status?: ProspectsStatus;
        description?: string;
        category?: string;
        inquiryDate?: string;
      }
    >({
      query: ({
        prospectsId,
        name,
        status,
        description,
        category,
        inquiryDate,
      }) => ({
        url: `prospects/${prospectsId}`,
        method: "PUT",
        body: { name, status, category, description, inquiryDate },
      }),
      invalidatesTags: (result, error, { prospectsId }) => [
        { type: "Prospects", id: prospectsId }, // Invalidate the specific prospect
        { type: "Prospects", id: "LIST" }, // Invalidate the entire list of prospects
      ],
    }),

    getProspectFollowupNote: build.query<FollowupNote[], number>({
      query: (prospectId) => `prospects/prospect-followup-note/${prospectId}`,
      providesTags: (result, error, prospectId) => [
        { type: "ProspectFollowupNote", id: prospectId },
      ],
    }),
    addProspectFollowupNote: build.mutation<
      ProspectFollowupNote,
      {
        prospectId: number;
        content: string;
        userId: number;
      }
    >({
      query: ({ prospectId, content, userId }) => ({
        url: `prospects/prospect-followup-note/${prospectId}`,
        method: "POST",
        body: { content, userId },
      }),
      invalidatesTags: (result, error, { prospectId }) => [
        { type: "ProspectFollowupNote", id: prospectId },
      ],
    }),

    updateProspectFollowupNote: build.mutation<
      ProspectFollowupNote,
      {
        commentId: number;
        content: string;
        prospectId: number;
      }
    >({
      query: ({ commentId, content }) => ({
        url: `prospects/prospect-followup-note/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (result, error, { prospectId }) => [
        { type: "ProspectFollowupNote", id: prospectId },
      ],
    }),
    deleteProspectFollowupNote: build.mutation<
      void,
      { prospectFollowupNoteId: number; prospectId: number }
    >({
      query: ({ prospectFollowupNoteId }) => ({
        url: `prospects/prospect-followup-note/${prospectFollowupNoteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { prospectId }) => [
        { type: "ProspectFollowupNote", id: prospectId }, // Use clientId
      ],
    }),

    //========================================= Prospect End Poing End ===================================

    // Prospect Follow up Notes Start

    // Client End

    // Notification Section Start
    // client\src\state\api.ts
    // client\src\state\api.ts
    getNotifications: build.query<
      Notification[],
      { userId: number; showAll?: boolean }
    >({
      query: ({ userId, showAll = false }) => ({
        url: `notifications/user/${userId}`,
        params: { showAll },
      }),
      providesTags: ["Notifications"],
    }),
    // In your api.ts endpoints
    // In your api.ts endpoints
    markNotificationAsRead: build.mutation<Notification, number>({
      query: (notificationId) => ({
        url: `notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result) =>
        result
          ? [{ type: "Notifications", id: result.userId }]
          : ["Notifications"],
    }),

    markAllNotificationsAsRead: build.mutation<void, number>({
      query: (userId) => ({
        url: `notifications/user/${userId}/mark-all-read`,
        method: "PATCH",
      }),
      invalidatesTags: (_, error, userId) =>
        error ? [] : [{ type: "Notifications", id: userId }],
    }),
    // Add to your api endpoints
    deleteNotification: build.mutation<void, number>({
      query: (notificationId) => ({
        url: `notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
    // Notification Section End

    // Client End

    registerUser: build.mutation<{ message: string }, UserPayload>({
      query: (userData) => ({
        url: "users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    changePassword: build.mutation<
      { message: string },
      { userId: number; currentPassword: string; newPassword: string }
    >({
      query: ({ userId, currentPassword, newPassword }) => ({
        url: `users/${userId}/change-password`,
        method: "POST",
        body: { currentPassword, newPassword },
      }),
    }),

    updateLastSeen: build.mutation<void, void>({
      query: () => ({
        url: "users/presence",
        method: "PATCH",
      }),
    }),

    // Project end

    // Prospect Start

    //----------------------------------- Task Start -------------------------------------------------

    // ======================================== Task CRUD Starts ============================================
    createTask: build.mutation<Task, Partial<Task>>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks", "Clients"],
    }),
    // In your getTasks query, ensure isDeleted is filtered out
    getTasks: build.query<
      { tasks: Task[]; pagination?: PaginationInfo },
      {
        clientId?: number;
        assignedTo?: number;
        includeDeleted?: boolean;
        page?: number;
        limit?: number;
        search?: string;
        projectName?: string;
        status?: string;
        clientDomainName?: string;
        companyName?: string;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params?.clientId)
          queryParams.append("clientId", params.clientId.toString());
        if (params?.assignedTo)
          queryParams.append("assignedTo", params.assignedTo.toString());
        if (params?.includeDeleted)
          queryParams.append("includeDeleted", "true");
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.search) queryParams.append("search", params.search);
        if (params?.projectName)
          queryParams.append("projectName", params.projectName);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.clientDomainName)
          queryParams.append("clientDomainName", params.clientDomainName);
        if (params?.companyName)
          queryParams.append("companyName", params.companyName);

        return `tasks?${queryParams.toString()}`;
      },
      transformResponse: (response: { tasks: Task[]; pagination?: any }) => {
        return response;
      },
      providesTags: (result) =>
        result && result.tasks
          ? [
              ...result.tasks.map(({ id }) => ({ type: "Tasks" as const, id })),
              { type: "Tasks", id: "LIST" },
            ]
          : [{ type: "Tasks", id: "LIST" }],
    }),
    getTasksForTaskPage: build.query<
      { tasks: Task[]; pagination?: PaginationInfo },
      {
        clientId?: number;
        assignedTo?: number;
        includeDeleted?: boolean;
        page?: number;
        limit?: number;
        search?: string;
        projectName?: string;
        status?: string;
        clientDomainName?: string;
        companyName?: string;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params?.clientId)
          queryParams.append("clientId", params.clientId.toString());
        if (params?.assignedTo)
          queryParams.append("assignedTo", params.assignedTo.toString());
        if (params?.includeDeleted)
          queryParams.append("includeDeleted", "true");
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.search) queryParams.append("search", params.search);
        if (params?.projectName)
          queryParams.append("projectName", params.projectName);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.clientDomainName)
          queryParams.append("clientDomainName", params.clientDomainName);
        if (params?.companyName)
          queryParams.append("companyName", params.companyName);

        return `tasks/taskpage?${queryParams.toString()}`;
      },
      transformResponse: (response: { tasks: Task[]; pagination?: any }) => {
        return response;
      },
      providesTags: (result) =>
        result && result.tasks
          ? [
              ...result.tasks.map(({ id }) => ({ type: "Tasks" as const, id })),
              { type: "Tasks", id: "LIST" },
            ]
          : [{ type: "Tasks", id: "LIST" }],
    }),

    getTaskById: build.query<Task, number>({
      query: (taskId) => `tasks/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: "Tasks", id: taskId }],
    }),

    getMyTasksCount: build.query<
      {
        "To Do": number;
        "Work In Progress": number;
        QA: number;
        Completed: number;
      },
      void
    >({
      query: () => "tasks/counts/my-status",
      providesTags: ["TaskCounts"],
    }),
    getAllTasksCount: build.query<
      {
        "To Do": number;
        "Work In Progress": number;
        QA: number;
        Completed: number;
      },
      void
    >({
      query: () => "tasks/counts/status",
      providesTags: ["TaskCounts"],
    }),

    getTasksByUser: build.query<
      { tasks: Task[]; pagination?: any },
      { userId: number; search?: string; page?: number; limit?: number }
    >({
      query: ({ userId, search, page = 1, limit = 500 }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        return `tasks/user/${userId}?${params.toString()}`;
      },
      transformResponse: (response: { tasks: Task[]; pagination?: any }) => {
        return response;
      },
      providesTags: (result, error, { userId }) =>
        result?.tasks && result.tasks.length > 0
          ? result.tasks.map(({ id }) => ({ type: "Tasks", id }))
          : [{ type: "Tasks", id: userId }],
    }),
    getTasksByUserIdForProfile: build.query<Task[], number>({
      query: (userId) => `tasks/profile/${userId}`,
      transformResponse: (response: { tasks: Task[]; pagination?: any }) => {
        // Handle both array response and object with tasks property
        return Array.isArray(response) ? response : response.tasks || [];
      },
      providesTags: (result, error, userId) =>
        result && result.length > 0
          ? result.map(({ id }) => ({ type: "Tasks", id }))
          : [{ type: "Tasks", id: userId }],
    }),


getTaskReport: build.query<
  { success: boolean; data: TaskReportData; message: string },
  {
    username?: string;  // Changed from assignedTo
    fromDate?: string;
    toDate?: string;
  }
>({
  query: (params) => {
    const queryParams = new URLSearchParams();
    
    if (params?.username) 
      queryParams.append("username", params.username);
    if (params?.fromDate) 
      queryParams.append("fromDate", params.fromDate);
    if (params?.toDate) 
      queryParams.append("toDate", params.toDate);
    
    return `tasks/taskreport?${queryParams.toString()}`;
  },
  providesTags: ["TaskReport"],
}),

    updateTask: build.mutation<
      Task,
      { taskId: number; taskData: Partial<Task> }
    >({
      query: ({ taskId, taskData }) => ({
        url: `tasks/${taskId}`,
        method: "PUT",
        body: taskData, // taskData can still include assignedBy if needed
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
        { type: "Clients" },
      ],
    }),

    updateTaskStatus: build.mutation<
      Task,
      { taskId: number; status: string; updatedBy: number }
    >({
      query: ({ taskId, status, updatedBy }) => ({
        url: `tasks/${taskId}/status`,
        method: "PATCH",
        body: { status, updatedBy },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    deleteTask: build.mutation<void, number>({
      query: (taskId) => ({
        url: `tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    uploadAttachment: build.mutation<
      Attachment[],
      { taskId: number; formData: FormData }
    >({
      query: ({ taskId, formData }) => ({
        url: `tasks/${taskId}/attachments`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),

    deleteAttachment: build.mutation<
      void,
      { taskId: number; attachmentId: number }
    >({
      query: ({ taskId, attachmentId }) => ({
        url: `tasks/${taskId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),

    softDeleteTask: build.mutation<void, number>({
      query: (taskId) => ({
        url: `tasks/${taskId}/soft-deletetasks`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: "Tasks", id: taskId },
        { type: "DeletedTasks" },
      ],
    }),

    // Restore task
    restoreTask: build.mutation<void, number>({
      query: (taskId) => ({
        url: `tasks/${taskId}/restoretasks`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: "Tasks", id: taskId },
        { type: "DeletedTasks" },
      ],
    }),

    // Permanently delete task
    permanentlyDeleteTask: build.mutation<void, number>({
      query: (taskId) => ({
        url: `tasks/${taskId}/permanentdeletetasks`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, taskId) => [{ type: "DeletedTasks" }],
    }),

    // Get all deleted tasks
    getAllDeletedTasks: build.query<any[], void>({
      query: () => "tasks/deletedtasks",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "DeletedTasks" as const,
                id,
              })),
              { type: "DeletedTasks", id: "LIST" },
            ]
          : [{ type: "DeletedTasks", id: "LIST" }],
    }),

    // Add to your endpoints in api.ts
    getTaskComments: build.query<Comment[], number>({
      query: (taskId) => `tasks/${taskId}/comments`,
      providesTags: (result, error, taskId) => [
        { type: "Comments", id: taskId },
      ],
    }),
    addCommentToTask: build.mutation<
      Comment,
      { taskId: number; content: string; userId: number }
    >({
      query: ({ taskId, content, userId }) => ({
        url: `tasks/${taskId}/comments`,
        method: "POST",
        body: { content, userId },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Comments", id: taskId },
      ],
    }),

    getCommentWithReplies: build.query<Comment, number>({
      query: (commentId) => `tasks/comments/${commentId}`,
      providesTags: (result, error, commentId) => [
        { type: "Comment", id: commentId },
      ],
    }),

    editComment: build.mutation<
      Comment,
      { commentId: number; content: string; userId: number }
    >({
      query: ({ commentId, content, userId }) => ({
        url: `tasks/comments/${commentId}`,
        method: "PUT",
        body: { content, userId },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: "Comment", id: commentId },
        { type: "Comments", id: result?.taskId },
      ],
    }),

    deleteTaskComment: build.mutation<
      { message: string },
      { commentId: number; userId: number }
    >({
      query: ({ commentId, userId }) => ({
        url: `tasks/comments/${commentId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: "Comment", id: commentId },
        { type: "Comments" },
      ],
    }),

    toggleCommentLike: build.mutation<
      { message: string; liked: boolean },
      { commentId: number; userId: number }
    >({
      query: ({ commentId, userId }) => ({
        url: `tasks/comments/${commentId}/like`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: "Comment", id: commentId },
      ],
    }),

    // Reply operations
    addReplyToComment: build.mutation<
      CommentReply,
      {
        commentId: number;
        content: string;
        userId: number;
        parentReplyId?: number;
      }
    >({
      query: ({ commentId, content, userId, parentReplyId }) => ({
        url: `tasks/comments/${commentId}/replies`,
        method: "POST",
        body: { content, userId, parentReplyId },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: "Comment", id: commentId },
      ],
    }),

    editReply: build.mutation<
      CommentReply,
      { replyId: number; content: string; userId: number }
    >({
      query: ({ replyId, content, userId }) => ({
        url: `tasks/replies/${replyId}`,
        method: "PUT",
        body: { content, userId },
      }),
      invalidatesTags: (result, error, { replyId }) => [
        { type: "Reply", id: replyId },
      ],
    }),

    deleteReply: build.mutation<
      { message: string },
      { replyId: number; userId: number }
    >({
      query: ({ replyId, userId }) => ({
        url: `tasks/replies/${replyId}`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: (result, error, { replyId }) => [
        { type: "Reply", id: replyId },
      ],
    }),

    toggleReplyLike: build.mutation<
      { message: string; liked: boolean },
      { replyId: number; userId: number }
    >({
      query: ({ replyId, userId }) => ({
        url: `tasks/replies/${replyId}/like`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (result, error, { replyId }) => [
        { type: "Reply", id: replyId },
      ],
    }),

    //================================================ Tasks Endpoint End ==================================

    createSubtask: build.mutation<
      Task,
      {
        parentTaskId: number;
        taskData: Partial<Task> & { assignedBy: string };
      }
    >({
      query: ({ parentTaskId, taskData }) => ({
        url: `tasks/${parentTaskId}/subtasks`,
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["Tasks"],
    }),
    getSubtasks: build.query<Task[], number>({
      query: (taskId) => `tasks/${taskId}/subtasks`,
      providesTags: (result, error, taskId) => [
        { type: "Tasks", id: `subtasks-${taskId}` },
      ],
    }),
    updateSubtask: build.mutation<
      Task,
      { subtaskId: number; taskData: Partial<Task> }
    >({
      query: ({ subtaskId, taskData }) => ({
        url: `tasks/${subtaskId}/subtasks`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (result, error, { subtaskId }) => [
        { type: "Tasks", id: subtaskId },
      ],
    }),

    // client\src\state\api.ts
    // Add these endpoints to your existing API

    // Soft delete subtask
    softDeleteSubtask: build.mutation<void, number>({
      query: (subtaskId) => ({
        url: `tasks/subtasks/${subtaskId}/soft-delete`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, subtaskId) => [
        { type: "Tasks", id: subtaskId },
        { type: "DeletedSubtasks" },
      ],
    }),

    // Restore subtask
    restoreSubtask: build.mutation<void, number>({
      query: (subtaskId) => ({
        url: `tasks/subtasks/${subtaskId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, subtaskId) => [
        { type: "Tasks", id: subtaskId },
        { type: "DeletedSubtasks" },
      ],
    }),

    // Permanently delete subtask
    permanentlyDeleteSubtask: build.mutation<void, number>({
      query: (subtaskId) => ({
        url: `tasks/subtasks/${subtaskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, subtaskId) => [
        { type: "DeletedSubtasks" },
      ],
    }),

    // Get all deleted subtasks
    getDeletedSubtasks: build.query<any[], void>({
      query: () => "tasks/subtasks/deleted",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "DeletedSubtasks" as const,
                id,
              })),
              { type: "DeletedSubtasks", id: "LIST" },
            ]
          : [{ type: "DeletedSubtasks", id: "LIST" }],
    }),

    getAllDeletedSubtasks: build.query<any[], void>({
      query: () => "tasks/subtasks/deleted",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "DeletedSubtasks" as const,
                id,
              })),
              { type: "DeletedSubtasks", id: "LIST" },
            ]
          : [{ type: "DeletedSubtasks", id: "LIST" }],
    }),

    // Add new queries for user-specific deleted items
    getMyDeletedTasks: build.query<any[], void>({
      query: () => "tasks/deleted/my-tasks",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "DeletedTasks" as const,
                id,
              })),
              { type: "DeletedTasks", id: "LIST" },
            ]
          : [{ type: "DeletedTasks", id: "LIST" }],
    }),

    getMyDeletedSubtasks: build.query<any[], void>({
      query: () => "tasks/deleted/my-subtasks",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "DeletedSubtasks" as const,
                id,
              })),
              { type: "DeletedSubtasks", id: "LIST" },
            ]
          : [{ type: "DeletedSubtasks", id: "LIST" }],
    }),
    //----------------------------------- Taks End ----------------------------------------------------------

    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    deleteUser: build.mutation<void, string>({
      query: (email) => ({
        url: `users/${email}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    updateUserRole: build.mutation<void, { userId: number; role: string }>({
      query: ({ userId, role }) => ({
        url: `users/role/${userId}`, // Match backend route
        method: "PUT", // Change to PUT
        body: { role },
      }),
      invalidatesTags: ["Users"],
    }),

    // Add to your endpoints in api.ts
    getUserActivityLogs: build.query<ActivityLog[], number>({
      query: (userId) => `users/${userId}/activities`,
      providesTags: (result, error, userId) => [
        { type: "ActivityLog", id: userId },
      ],
    }),
    getUserComments: build.query<Comment[], number>({
      query: (userId) => `users/${userId}/comments`,
      providesTags: (result, error, userId) => [
        { type: "Comments", id: `user-${userId}` },
      ],
    }),

    getTeams: build.query<Team[], void>({
      query: () => "teams",
      providesTags: ["Teams"],
    }),
    search: build.query<SearchResults, string>({
      query: (query) => `search?query=${query}`,
    }),

    // Note API Start
    getNotes: build.query<Note[], void>({
      query: () => "notes",
      providesTags: ["Notes"],
    }),
    getPublicNotes: build.query<Note[], void>({
      query: () => "notes/public",
      providesTags: ["Notes"],
    }),
    getUserNotes: build.query<Note[], number>({
      query: (userId) => `notes/user`,
      providesTags: ["Notes"],
    }),
    createNote: build.mutation<
      Note,
      { noteData: Partial<Note>; endpointType: "public" | "private" }
    >({
      query: ({ noteData, endpointType }) => ({
        url: `notes/${endpointType}`,
        method: "POST",
        body: noteData,
      }),
      invalidatesTags: ["Notes"],
    }),
    updateNote: build.mutation<Note, { id: number; noteData: Partial<Note> }>({
      query: ({ id, noteData }) => ({
        url: `notes/${id}`,
        method: "PUT",
        body: noteData,
      }),
      invalidatesTags: ["Notes"],
    }),
    updateNoteReply: build.mutation<
      Reply,
      { replyId: number; content: string }
    >({
      query: ({ replyId, content }) => ({
        url: `notes/replies/${replyId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["Notes"],
    }),

    deleteNoteReply: build.mutation<void, number>({
      query: (replyId) => ({
        url: `notes/replies/${replyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notes"],
    }),
    deleteNote: build.mutation<void, number>({
      query: (id) => ({
        url: `notes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notes"],
    }),

    likeNote: build.mutation<Like, { noteId: number }>({
      query: ({ noteId }) => ({
        url: `notes/${noteId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Notes"],
    }),

    unlikeNote: build.mutation<void, { noteId: number }>({
      query: ({ noteId }) => ({
        url: `notes/${noteId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["Notes"],
    }),

    createNoteReply: build.mutation<
      Reply,
      { noteId: number; content: string; parentReplyId?: number }
    >({
      query: ({ noteId, content, parentReplyId }) => ({
        url: `notes/${noteId}/replies`,
        method: "POST",
        body: { content, parentReplyId },
      }),
      invalidatesTags: ["Notes"],
    }),

    likeNoteReply: build.mutation<LikeOnReply, { replyId: number }>({
      query: ({ replyId }) => ({
        url: `notes/replies/${replyId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Notes"],
    }),

    unlikeNoteReply: build.mutation<void, { replyId: number }>({
      query: ({ replyId }) => ({
        url: `notes/replies/${replyId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["Notes"],
    }),
    // Note API End

    // Sales Notes Start
    getSalesNotes: build.query<SalesNote[], void>({
      query: () => "sales-notes",
      providesTags: ["SalesNotes"],
    }),
    createSalesNote: build.mutation<SalesNote, Partial<SalesNote>>({
      query: (noteData) => ({
        url: "sales-notes",
        method: "POST",
        body: noteData,
      }),
      invalidatesTags: ["SalesNotes"],
    }),
    updateSalesNote: build.mutation<
      SalesNote,
      { id: number; noteData: Partial<SalesNote> }
    >({
      query: ({ id, noteData }) => ({
        url: `sales-notes/${id}`,
        method: "PUT",
        body: noteData,
      }),
      invalidatesTags: ["SalesNotes"],
    }),
    deleteSalesNote: build.mutation<void, number>({
      query: (id) => ({
        url: `sales-notes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalesNotes"],
    }),
    // Sales Notes End

    getChecklists: build.query<Checklist[], void>({
      query: () => "checklists",
      providesTags: ["Checklists"],
    }),
    getPublicChecklists: build.query<Checklist[], void>({
      query: () => "checklists/public",
      providesTags: ["Checklists"],
    }),
    getUserChecklists: build.query<Checklist[], number>({
      query: (userId) => `checklists/user`,
      providesTags: ["Checklists"],
    }),
    createChecklist: build.mutation<
      Checklist,
      { checklistData: Partial<Checklist>; endpointType: "public" | "private" }
    >({
      query: ({ checklistData, endpointType }) => ({
        url: `checklists/${endpointType}`,
        method: "POST",
        body: checklistData,
      }),
      invalidatesTags: ["Checklists"],
    }),
    updateChecklist: build.mutation<
      Checklist,
      { id: number; checklistData: Partial<Checklist> }
    >({
      query: ({ id, checklistData }) => ({
        url: `checklists/${id}`,
        method: "PUT",
        body: checklistData,
      }),
      invalidatesTags: ["Checklists"],
    }),

    reorderChecklists: build.mutation<void, number[]>({
      query: (checklistIds) => ({
        url: `checklists/reorder`,
        method: "PATCH",
        body: { checklistIds },
      }),
      invalidatesTags: ["Checklists"],
    }),
    deleteChecklist: build.mutation<void, number>({
      query: (id) => ({
        url: `checklists/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Checklists"],
    }),

    // Today Update Start
    //========================================== Today Updates Endpoints Starts ===============================
    getTodayUpdates: build.query<TodayUpdate[], void>({
      query: () => "today-updates",
      providesTags: ["TodayUpdates"],
    }),
    getUserTodayUpdates: build.query<TodayUpdate[], number>({
      query: (userId) => `today-updates/user`,
      providesTags: ["TodayUpdates"],
    }),
    // Add to your existing API endpoints
    getTodayUpdatesByUserAndDate: build.query<
      TodayUpdate[],
      { userId: number; date: string }
    >({
      query: ({ userId, date }) => `today-updates/user/${userId}/date/${date}`,
      providesTags: ["TodayUpdates"],
    }),
    createTodayUpdate: build.mutation<TodayUpdate, { content: string }>({
      query: (updateData) => ({
        url: `today-updates`,
        method: "POST",
        body: updateData,
      }),
      invalidatesTags: ["TodayUpdates"],
    }),
    updateTodayUpdate: build.mutation<
      TodayUpdate,
      { id: number; content: string }
    >({
      query: ({ id, content }) => ({
        url: `today-updates/${id}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["TodayUpdates"],
    }),
    deleteTodayUpdate: build.mutation<void, number>({
      query: (id) => ({
        url: `today-updates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TodayUpdates"],
    }),

    likeTodayUpdate: build.mutation<Like, { updateId: number }>({
      query: ({ updateId }) => ({
        url: `today-updates/${updateId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["TodayUpdates"],
    }),

    unlikeTodayUpdate: build.mutation<void, { updateId: number }>({
      query: ({ updateId }) => ({
        url: `today-updates/${updateId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["TodayUpdates"],
    }),

    createReply: build.mutation<Reply, { updateId: number; content: string }>({
      query: ({ updateId, content }) => ({
        url: `today-updates/${updateId}/replies`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["TodayUpdates"],
    }),

    likeReply: build.mutation<LikeOnReply, { replyId: number }>({
      query: ({ replyId }) => ({
        url: `today-updates/replies/${replyId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["TodayUpdates"],
    }),

    unlikeReply: build.mutation<void, { replyId: number }>({
      query: ({ replyId }) => ({
        url: `today-updates/replies/${replyId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["TodayUpdates"],
    }),
    //========================================== Today Updates Endpoints Ends ===============================

    //========================================== System Feedback Endpoints Starts ===============================
    createSystemUpdate: build.mutation<SystemUpdate, { content: string }>({
      query: (updateData) => ({
        url: `system-updates`,
        method: "POST",
        body: updateData,
      }),
      invalidatesTags: ["SystemUpdates"],
    }),
    getSystemUpdates: build.query<SystemUpdate[], void>({
      query: () => "system-updates",
      providesTags: ["SystemUpdates"],
    }),

    updateSystemUpdate: build.mutation<
      SystemUpdate,
      { id: number; content: string }
    >({
      query: ({ id, content }) => ({
        url: `system-updates/${id}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["SystemUpdates"],
    }),
    deleteSystemUpdate: build.mutation<void, number>({
      query: (id) => ({
        url: `system-updates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SystemUpdates"],
    }),

    //========================================== System Feedback Endpoints Ends ===============================

    //========================================== System Feedback Endpoints Starts ===============================
    createSystemFeedback: build.mutation<
      SystemFeedback,
      { content: string; attachments?: File[] }
    >({
      query: (feedbackData) => {
        const formData = new FormData();
        formData.append("content", feedbackData.content);
        if (feedbackData.attachments) {
          feedbackData.attachments.forEach((file) => {
            formData.append("attachments", file);
          });
        }
        return {
          url: `system-feedback`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["SystemFeedback"],
    }),

    getSystemFeedbacks: build.query<
      {
        feedbacks: SystemFeedback[];
        statusCounts: {
          New: number;
          Acknowledged: number;
          InProgress: number;
          Resolved: number;
        };
        totalCount: number;
        resolvedCount: number;
      },
      number | void
    >({
      // Change void to number | void
      query: (userId?: number) => {
        const params = userId ? `?userId=${userId}` : "";
        return `system-feedback${params}`;
      },
      providesTags: ["SystemFeedback"],
    }),

    updateSystemFeedback: build.mutation<
      SystemFeedback,
      { id: number; content: string }
    >({
      query: ({ id, content }) => ({
        url: `system-feedback/${id}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["SystemFeedback"],
    }),
    updateSystemFeedbackStatus: build.mutation<
      SystemFeedback,
      { id: number; status: "New" | "Acknowledged" | "InProgress" | "Resolved" }
    >({
      query: ({ id, status }) => ({
        url: `system-feedback/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["SystemFeedback"],
    }),
    deleteSystemFeedback: build.mutation<void, number>({
      query: (id) => ({
        url: `system-feedback/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SystemFeedback"],
    }),
    deleteFeedbackAttachment: build.mutation<
      void,
      { feedbackId: number; attachmentId: number }
    >({
      query: ({ feedbackId, attachmentId }) => ({
        url: `system-feedback/${feedbackId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SystemFeedback"],
    }),

    //========================================== System Feedback Endpoints Ends ===============================

    // Knowledge Sharing Start

    getKnowledgeSharings: build.query<KnowledgeSharing[], void>({
      query: () => "knowledge-sharing",
      providesTags: ["KnowledgeSharing"],
    }),
    createKnowledgeSharing: build.mutation<
      KnowledgeSharing,
      { content: string; attachments?: File[] }
    >({
      query: (knowledgeSharingData) => {
        const formData = new FormData();
        formData.append("content", knowledgeSharingData.content);
        if (knowledgeSharingData.attachments) {
          knowledgeSharingData.attachments.forEach((file) => {
            formData.append("attachments", file);
          });
        }
        return {
          url: `knowledge-sharing`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["KnowledgeSharing"],
    }),
    updateKnowledgeSharing: build.mutation<
      KnowledgeSharing,
      { id: number; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `knowledge-sharing/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["KnowledgeSharing"],
    }),
    deleteKnowledgeSharing: build.mutation<void, number>({
      query: (id) => ({
        url: `knowledge-sharing/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["KnowledgeSharing"],
    }),
    deleteKnowledgeSharingAttachment: build.mutation<
      void,
      { knowledgeSharingId: number; attachmentId: number }
    >({
      query: ({ knowledgeSharingId, attachmentId }) => ({
        url: `knowledge-sharing/${knowledgeSharingId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["KnowledgeSharing"],
    }),
    // Add like and comment endpoints
    likeKnowledgeSharing: build.mutation<void, number>({
      query: (knowledgeSharingId) => ({
        url: `knowledge-sharing/${knowledgeSharingId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["KnowledgeSharing"],
    }),
    unlikeKnowledgeSharing: build.mutation<void, number>({
      query: (knowledgeSharingId) => ({
        url: `knowledge-sharing/${knowledgeSharingId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["KnowledgeSharing"],
    }),
    createComment: build.mutation<
      Comment,
      { knowledgeSharingId: number; content: string }
    >({
      query: ({ knowledgeSharingId, content }) => ({
        url: `knowledge-sharing/${knowledgeSharingId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["KnowledgeSharing"],
    }),
    deleteComment: build.mutation<
      void,
      { knowledgeSharingId: number; commentId: number }
    >({
      query: ({ knowledgeSharingId, commentId }) => ({
        url: `knowledge-sharing/${knowledgeSharingId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["KnowledgeSharing"],
    }),

    // Knowledge Sharing End

    //========================================== Sales Notes endpoints Starts ===============================
    likeSalesNote: build.mutation<SalesNoteLike, { noteId: number }>({
      query: ({ noteId }) => ({
        url: `sales-notes/${noteId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["SalesNotes"],
    }),

    unlikeSalesNote: build.mutation<void, { noteId: number }>({
      query: ({ noteId }) => ({
        url: `sales-notes/${noteId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["SalesNotes"],
    }),

    createSalesNoteReply: build.mutation<
      SalesNoteReply,
      { noteId: number; content: string }
    >({
      query: ({ noteId, content }) => ({
        url: `sales-notes/${noteId}/replies`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["SalesNotes"],
    }),

    likeSalesNoteReply: build.mutation<SalesNoteReplyLike, { replyId: number }>(
      {
        query: ({ replyId }) => ({
          url: `sales-note-replies/${replyId}/like`,
          method: "POST",
        }),
        invalidatesTags: ["SalesNotes"],
      },
    ),

    unlikeSalesNoteReply: build.mutation<void, { replyId: number }>({
      query: ({ replyId }) => ({
        url: `sales-note-replies/${replyId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["SalesNotes"],
    }),

    //========================================== Sales Notes endpoints Ends ===============================

    //========================================== Payment endpoints Starts ===============================
 getPayments: build.query<{ payments: Payment[]; summary: any; yearlySummary: any }, { month?: number; year?: number; category?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.month) queryParams.append('month', params.month.toString());
        if (params?.year) queryParams.append('year', params.year.toString());
        if (params?.category) queryParams.append('category', params.category);
        
        return {
          url: `/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
        };
      },
      providesTags: ['Payments'],
    }),
    
    getPaymentsByClient: build.query<Payment[], number>({
      query: (clientId) => `payments/client/${clientId}`,
      providesTags: (result, error, clientId) => [
        { type: 'Payments', id: clientId },
      ],
    }),
    createPayment: build.mutation<Payment, FormData>({
      query: (formData) => ({
        url: "payments",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Payments"],
    }),
    updatePayment: build.mutation<Payment, { id: number; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `payments/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Payments"],
    }),
    deletePayment: build.mutation<void, number>({
      query: (id) => ({
        url: `payments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Payments"],
    }),
    //========================================== Payment endpoints Ends ===============================

    startTimer: build.mutation<
      {
        message: string;
        task?: any;
        runningTimers?: Array<{ id: number; title: string }>;
      },
      { taskId: number; userId: number }
    >({
      query: (data) => ({
        url: `tasks/${data.taskId}/timer/start`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
        { type: "TaskTimer", id: taskId },
      ],
    }),

    pauseTimer: build.mutation<void, { taskId: number; userId: number }>({
      query: (data) => ({
        // Change from ({ taskId }) to (data)
        url: `tasks/${data.taskId}/timer/pause`,
        method: "POST",
        body: data, // Add this line to send the userId in the body
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
        { type: "TaskTimer", id: taskId },
      ],
    }),
    stopTimer: build.mutation<void, { taskId: number; userId: number }>({
      query: (data) => ({
        // Change from ({ taskId }) to (data)
        url: `tasks/${data.taskId}/timer/stop`,
        method: "POST",
        body: data, // Add this line to send the userId in the body
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
        { type: "TaskTimer", id: taskId },
      ],
    }),
    getTimerStatus: build.query<TimerStatus, number>({
      query: (taskId) => `tasks/${taskId}/timer/status`,
      providesTags: (result, error, taskId) => [
        { type: "TaskTimer", id: taskId },
      ],
    }),

    startSubtaskTimer: build.mutation<
      {
        message: string;
        subtask?: any;
        runningTimers?: Array<{ id: number; title: string }>;
      },
      { subtaskId: number; userId: number }
    >({
      query: (data) => ({
        url: `tasks/subtasks/${data.subtaskId}/timer/start`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { subtaskId }) => [
        { type: "Tasks", id: subtaskId },
        { type: "SubtaskTimer", id: subtaskId },
      ],
    }),
    pauseSubtaskTimer: build.mutation<
      void,
      { subtaskId: number; userId: number }
    >({
      query: (data) => ({
        // Changed from ({ subtaskId }) to (data)
        url: `tasks/subtasks/${data.subtaskId}/timer/pause`,
        method: "POST",
        body: data, // Added this line to send the userId in the body
      }),
      invalidatesTags: (result, error, { subtaskId }) => [
        { type: "Tasks", id: subtaskId },
        { type: "SubtaskTimer", id: subtaskId },
      ],
    }),
    stopSubtaskTimer: build.mutation<
      void,
      { subtaskId: number; userId: number }
    >({
      query: (data) => ({
        // Changed from ({ subtaskId }) to (data)
        url: `tasks/subtasks/${data.subtaskId}/timer/stop`,
        method: "POST",
        body: data, // Added this line to send the userId in the body
      }),
      invalidatesTags: (result, error, { subtaskId }) => [
        { type: "Tasks", id: subtaskId },
        { type: "SubtaskTimer", id: subtaskId },
      ],
    }),
    getSubtaskTimerStatus: build.query<TimerStatus, number>({
      query: (subtaskId) => `tasks/subtasks/${subtaskId}/timer/status`,
      providesTags: (result, error, subtaskId) => [
        { type: "SubtaskTimer", id: subtaskId },
      ],
    }),

    getUserDailySchedule: build.query<
      ScheduleData,
      { userId: number; date: string }
    >({
      query: ({ userId, date }) => `tasks/user-schedule/${userId}?date=${date}`,
      providesTags: ["UserSchedule"],
    }),

   // Add these to your api.ts file (inside your API slice)

// Policy Category Endpoints
getCategories: build.query<PolicyCategory[], void>({
  query: () => "policies/categories",
  providesTags: ["PolicyCategories"],
}),
createCategory: build.mutation<PolicyCategory, { name: string; description?: string }>({
  query: (body) => ({
    url: "policies/categories",
    method: "POST",
    body,
  }),
  invalidatesTags: ["PolicyCategories"],
}),
updateCategory: build.mutation<PolicyCategory, { id: number; name: string; description?: string }>({
  query: ({ id, ...body }) => ({
    url: `policies/categories/${id}`,
    method: "PUT",
    body,
  }),
  invalidatesTags: ["PolicyCategories"],
}),
deleteCategory: build.mutation<void, number>({
  query: (id) => ({
    url: `policies/categories/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: ["PolicyCategories", "Policies"],
}),

 getPolicies: build.query<Policy[], { categoryId?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params && params.categoryId) {
          queryParams.append("categoryId", params.categoryId.toString());
        }
        return `policies/policies?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Policies" as const, id })),
              { type: "Policies", id: "LIST" },
            ]
          : [{ type: "Policies", id: "LIST" }],
    }),
    
    getPolicyById: build.query<Policy, number>({
      query: (id) => `policies/policies/${id}`,
      providesTags: (result, error, id) => [{ type: "Policies", id }],
    }),
    
    createPolicy: build.mutation<Policy, { content: string; categoryId: number }>({
      query: (body) => ({
        url: "policies/policies",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Policies", "PolicyCategories"],
    }),
    
    updatePolicy: build.mutation<Policy, { id: number; content: string; categoryId: number }>({
      query: ({ id, ...body }) => ({
        url: `policies/policies/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Policies", id }],
    }),
    
    deletePolicy: build.mutation<void, number>({
      query: (id) => ({
        url: `policies/policies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Policies", "PolicyCategories"],
    }),

// Add these to your API slice
reorderCategories: build.mutation<void, { categoryIds: number[] }>({
  query: (body) => ({
    url: "policies/categories/reorder",
    method: "POST",
    body,
  }),
  invalidatesTags: ["PolicyCategories"],
}),

reorderPolicies: build.mutation<void, { categoryId: number; policyIds: number[] }>({
  query: (body) => ({
    url: "policies/policies/reorder",
    method: "POST",
    body,
  }),
  invalidatesTags: ["Policies"],
}),
  }),
});

export const {
  useGetProspectsQuery,
  useGetTasksQuery,
  useGetTaskReportQuery,
  useGetTasksForTaskPageQuery,
  useGetTaskByIdQuery,
  useGetMyTasksCountQuery,
  useGetAllTasksCountQuery,
  useCreateTaskMutation,
  useCreateProspectsMutation,
  useUpdateTaskMutation,
  useDeleteProspectsMutation,
  useUpdateLastSeenMutation,

  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useCreateSubtaskMutation,
  useGetSubtasksQuery,
  useUpdateSubtaskMutation,
  useSoftDeleteSubtaskMutation,
  useRestoreSubtaskMutation,
  usePermanentlyDeleteSubtaskMutation,
  useGetDeletedSubtasksQuery,
  useGetAllDeletedSubtasksQuery,
  useGetMyDeletedSubtasksQuery,
  useGetMyDeletedTasksQuery,

  useGetProjectCommentsQuery,
  useAddProjectCommentMutation,

  useUpdateProspectMutation,
  useSearchQuery,

  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useGetTeamsQuery,
  useGetTasksByUserQuery,
  useRegisterUserMutation,
  useGetTasksByUserIdForProfileQuery,
  useChangePasswordMutation,
  useAddCommentToTaskMutation,
  useGetUserActivityLogsQuery,
  useGetUserCommentsQuery,

  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,

  // Client Export Start
  useCreateClientMutation,
  useGetClientsQuery,
  useGetProjectTimelinesQuery,
  useGetClientsForProjectPageQuery,
  useGetClientsForExpiryPageQuery,
  useGetClientCountsQuery,
  useGetNewClientCountsQuery,
  useGetClientDesignCountsQuery,
  useGetClientsByDesignCriteriaQuery,
  useGetSupportExpiringClientsQuery,
  useGetClientsListQuery,
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useDeleteMultipleClientsMutation,
  useSearchClientsQuery,
  useGetClientActivityLogsQuery,
  useRenewClientServiceMutation,
  useUpdateClientProjectStatusMutation,

  useLikeProjectCommentMutation,
  useAddProjectCommentReplyMutation,
  useLikeProjectCommentReplyMutation,
  useUpdateProjectCommentMutation,
  useDeleteProjectCommentMutation,

  // Followup Note Start
  // useLikeProjectCommentMutation,
  useGetFollowupNoteQuery,
  useAddFollowupNoteMutation,
  // useAddProjectCommentReplyMutation,
  // useLikeProjectCommentReplyMutation,
  useUpdateFollowupNoteMutation,
  useDeleteFollowupNoteMutation,
  // Followup Note End
  // Client Export End

  useGetProspectFollowupNoteQuery,
  useAddProspectFollowupNoteMutation,
  // useAddProjectCommentReplyMutation,
  // useLikeProjectCommentReplyMutation,
  useUpdateProspectFollowupNoteMutation,
  useDeleteProspectFollowupNoteMutation,

  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,

  // Notes End Point Start
  useGetNotesQuery,
  useGetPublicNotesQuery,
  useGetUserNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,

  useLikeNoteMutation,
  useUnlikeNoteMutation,
  useCreateNoteReplyMutation,
  useLikeNoteReplyMutation,
  useUnlikeNoteReplyMutation,
  useUpdateNoteReplyMutation,
  useDeleteNoteReplyMutation,
  // Like Note End

  // Today Updates Start
  useGetTodayUpdatesQuery,
  useGetUserTodayUpdatesQuery,
  useGetTodayUpdatesByUserAndDateQuery,
  useCreateTodayUpdateMutation,
  useUpdateTodayUpdateMutation,
  useDeleteTodayUpdateMutation,
  // Today Updates End

  // System Updates Start
  useGetSystemUpdatesQuery,
  useCreateSystemUpdateMutation,
  useUpdateSystemUpdateMutation,
  useUpdateSystemFeedbackStatusMutation,
  useDeleteSystemUpdateMutation,
  // System Updates End

  // System Feedback Start
  useGetSystemFeedbacksQuery,
  useCreateSystemFeedbackMutation,
  useUpdateSystemFeedbackMutation,
  useDeleteSystemFeedbackMutation,
  useDeleteFeedbackAttachmentMutation,
  // System Feedback End

  // Knowledge Sharing Start
  useGetKnowledgeSharingsQuery,
  useCreateKnowledgeSharingMutation,
  useUpdateKnowledgeSharingMutation,
  useDeleteKnowledgeSharingMutation,
  useDeleteKnowledgeSharingAttachmentMutation,
  useLikeKnowledgeSharingMutation,
  useUnlikeKnowledgeSharingMutation,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  // Knowledge Sharing End

  useLikeTodayUpdateMutation,
  useUnlikeTodayUpdateMutation,
  useCreateReplyMutation,
  useLikeReplyMutation,
  useUnlikeReplyMutation,

  // SalesNotes Start

  useGetSalesNotesQuery,
  useCreateSalesNoteMutation,
  useUpdateSalesNoteMutation,
  useDeleteSalesNoteMutation,
  useLikeSalesNoteMutation,
  useUnlikeSalesNoteMutation,
  useCreateSalesNoteReplyMutation,
  useLikeSalesNoteReplyMutation,
  useUnlikeSalesNoteReplyMutation,
  // SalesNotes End

  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useGetPaymentsQuery,
    useLazyGetPaymentsQuery,
  useDeletePaymentMutation,

  useGetChecklistsQuery,
  useGetUserChecklistsQuery,
  useGetPublicChecklistsQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useReorderChecklistsMutation,

  useDeleteChecklistMutation,

  useSoftDeleteTaskMutation,
  useRestoreTaskMutation,
  usePermanentlyDeleteTaskMutation,
  useGetAllDeletedTasksQuery,

  useStartTimerMutation,
  usePauseTimerMutation,
  useStopTimerMutation,
  useGetTimerStatusQuery,

  useStartSubtaskTimerMutation,
  usePauseSubtaskTimerMutation,
  useStopSubtaskTimerMutation,
  useGetSubtaskTimerStatusQuery,

  useGetUserDailyScheduleQuery,

  useSendReminderMutation,
  useGetNepaliCalendarQuery,

  useGetTaskCommentsQuery,
  useGetCommentWithRepliesQuery,
  useEditCommentMutation,
  useDeleteTaskCommentMutation,
  useToggleCommentLikeMutation,
  useAddReplyToCommentMutation,
  useEditReplyMutation,
  useDeleteReplyMutation,
  useToggleReplyLikeMutation,

   useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetPoliciesQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
   useReorderCategoriesMutation,
    useReorderPoliciesMutation,
} = api;
