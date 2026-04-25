"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Board from "../../projects/BoardView";
import CreateTask from "@/components/Task/CreateTask";
import {
  useGetClientByIdQuery,
  useUpdateClientMutation,
  ProjectTimeline,
} from "@/state/api";
import ProjectTimelineComponent from "@/components/ProjectTimelineComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../../context/AuthContext";
import {
  Activity,
  ListTodo,
  MessageSquareText,
  Pencil,
  FileText,
  Calendar,
  Clock,
  Edit,
  Save,
  X,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import DOMPurify from "dompurify";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";

type Props = {
  params: { id: string };
};

const TaskBoard = ({ params }: Props) => {
  const { id } = params;
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);

  const [localProjectTimelines, setLocalProjectTimelines] = useState<
    ProjectTimeline[]
  >([]);
  const [isSavingTimelines, setIsSavingTimelines] = useState(false);

  // Add function to save timelines
  const saveTimelines = async () => {
    setIsSavingTimelines(true);
    try {
      const formData = new FormData();
      formData.append("projectTimeline", JSON.stringify(localProjectTimelines));

      await updateClient({ id: Number(id), formData }).unwrap();
      toast.success("Project timelines updated successfully!");
      refetch(); // Refresh the data
    } catch (err) {
      console.error("Error updating timelines:", err);
      toast.error("Failed to update project timelines.");
    } finally {
      setIsSavingTimelines(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const {
    register,
    handleSubmit,
    formState: { isDirty },
    reset,
    setValue,
    watch,
  } = useForm();

  const [editorContent, setEditorContent] = useState("");

  const {
    data: clientData,
    isLoading,
    error,
    refetch,
  } = useGetClientByIdQuery(Number(id));
  const [updateClient] = useUpdateClientMutation();

  const [clientName, setClientName] = useState("");
  const [clientCompanyName, setClientCompanyName] = useState("");
  const [clientProjectDescription, setClientProjectDescription] = useState("");
  const [clientProjectTimeline, setClientProjectTimeline] = useState<
    ProjectTimeline[]
  >([]);
  const [clientStartDate, setClientStartDate] = useState("");
  const [clientEndDate, setClientEndDate] = useState("");
  const [clientWebDesignTechStack, setClientWebDesignTechStack] = useState("");
  const [clientGoogleDriveLink, setClientGoogleDriveLink] = useState("");

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Add this useEffect to initialize timelines from clientData
  useEffect(() => {
    if (clientData?.projectTimeline) {
      try {
        const timelines =
          typeof clientData.projectTimeline === "string"
            ? JSON.parse(clientData.projectTimeline)
            : clientData.projectTimeline;
        setLocalProjectTimelines(timelines);
      } catch (e) {
        console.error("Error parsing project timelines:", e);
        setLocalProjectTimelines([]);
      }
    } else {
      setLocalProjectTimelines([]);
    }
  }, [clientData]);

  useEffect(() => {
    if (clientData) {
      setClientName(clientData.domainName || "");
      setClientCompanyName(clientData.companyName || "");
      setClientProjectDescription(clientData.projectDescription || "");
      setClientProjectTimeline(clientData.projectTimeline || []);
      setClientStartDate(clientData.startDate || "");
      setClientEndDate(clientData.endDate || "");
      setClientWebDesignTechStack(clientData.webDesignTechStack || "");
      setClientGoogleDriveLink(clientData.googleDriveLink || "");

      // Reset form with current values
      reset({
        projectDescription: clientData.projectDescription || "",
        projectTimeline: clientData.projectTimeline || [],
        googleDriveLink: clientData.googleDriveLink || "",
        webDesignTechStack: clientData.webDesignTechStack || "",
        startDate: clientData.startDate || "",
        endDate: clientData.endDate || "",
      });

      setEditorContent(clientData.projectDescription || "");
    }
  }, [clientData, id, reset]);

  const formatDate = (dateString: string | null | Date | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateTimeLeft = (
    startDate?: string | null | Date,
    endDate?: string | null | Date,
  ) => {
    if (!startDate || !endDate)
      return { text: "N/A", color: "text-gray-600 dark:text-gray-400" };

    const today = new Date();
    const end = new Date(endDate);
    const daysRemaining = differenceInDays(end, today);
    const daysPast = differenceInDays(today, end);

    if (daysRemaining > 0) {
      return {
        text: `${daysRemaining} days remaining`,
        color: "text-green-600 dark:text-green-500",
      };
    } else if (daysPast > 0) {
      return {
        text: `Overdue by ${daysPast} days`,
        color: "text-red-600 dark:text-red-500",
      };
    } else {
      return {
        text: "Due today",
        color: "text-yellow-600 dark:text-yellow-500",
      };
    }
  };

  const timeStatus = calculateTimeLeft(clientStartDate, clientEndDate);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      formData.append("projectDescription", editorContent || "");
      formData.append("googleDriveLink", data.googleDriveLink || "");
      formData.append("webDesignTechStack", data.webDesignTechStack || "");
      if (data.startDate) formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);

      await updateClient({ id: Number(id), formData }).unwrap();
      toast.success("Project updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error("Failed to update project.");
    }
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
    setValue("projectDescription", content, { shouldDirty: true });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching project data.</div>;

  return (
    <div>
      <CreateTask
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        id={id}
      />
      <div className="m-4 mt-2 flex items-center justify-between text-lg dark:text-gray-200 bg-white dark:bg-secondary px-4 py-3 rounded-lg">
        <div className="flex items-center text-lg dark:text-gray-200">
          <div className="h-12 w-2 rounded-full border-none bg-blue-500"></div>
          <div>
            <h1 className="pl-2 pr-2 text-2xl font-semibold">{clientName}</h1>
            <p className="pl-2">{clientCompanyName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {clientEndDate && (
            <div className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-300">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-300" />
              <span className="text-muted-foreground"> Deadline: </span>
              {formatDate(clientEndDate)}
            </div>
          )}
          {clientStartDate && (
            <div className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-300">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-300" />
              <span className="text-muted-foreground">Started: </span>
              {formatDate(clientStartDate)}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Tabs
          defaultValue="tasks"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="flex items-center justify-start mx-4">
            <TabsTrigger value="overview">
              <FileText className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListTodo className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Board id={id} setIsCreateTaskOpen={setIsCreateTaskOpen} />
          </TabsContent>

          <TabsContent value="overview">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="w-[70%] border p-4 dark:bg-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <h1 className="pl-2 pr-2 text-2xl font-semibold text-gray-900 dark:text-gray-300">
                      Project Description
                    </h1>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                          className="dark:text-gray-30 border dark:border-gray-600 dark:text-gray-300"
                        >
                          <X className="mr-2 h-4 w-4 dark:text-gray-300" />
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!isDirty}
                          className="dark:text-gray-800"
                        >
                          <Save className="mr-2 h-4 w-4 dark:text-gray-800" />
                          Save
                        </Button>
                      </div>
                    ) : isAdmin ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="border dark:border-gray-700 dark:text-gray-300 dark:bg-secondary"
                      >
                        <Edit className="mr-2 h-4 w-4 dark:text-gray-300" />
                        Edit
                      </Button>
                    ) : null}
                  </div>
                  <p className="pl-2 text-muted-foreground">
                    Detailed information about the project
                  </p>

                  {isEditing ? (
                    <div className="mt-4">
                      <RichTextEditor
                        content={editorContent}
                        onContentChange={handleContentChange}
                        placeholder="Write your project description here..."
                        className="min-h-[200px]"
                      />
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none p-2 dark:text-gray-300/80">
                      {clientProjectDescription ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              clientProjectDescription,
                            ),
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg p-8 text-center dark:border-gray-600">
                          <h3 className="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">
                            No Project Description Added Yet
                          </h3>
                          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                            Add a description to provide more details about this
                            project
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-[30%] border p-4 text-gray-600 dark:text-gray-300 dark:bg-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="mb-4 text-2xl font-semibold">
                      Project Details
                    </h2>
                    {isEditing && (
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!isDirty}
                        className="ml-auto dark:text-gray-800"
                      >
                        <Save className="mr-2 h-4 w-4 dark:text-gray-800" />
                        Save
                      </Button>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 dark:text-gray-400">Client:</div>
                    <div>{clientCompanyName}</div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 dark:text-gray-400">Tech Stack:</div>
                    {isEditing ? (
                      <select
                        {...register("webDesignTechStack")}
                        defaultValue={clientWebDesignTechStack}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                      >
                        <option value="">Select Tech Stack</option>
                        <option value="HTML + WordPress">
                          HTML + WordPress
                        </option>
                        <option value="HTML + Laravel">HTML + Laravel</option>
                        <option value="Next.js + Laravel">
                          Next.js + Laravel
                        </option>
                        <option value="Next.js + Node.js">
                          Next.js + Node.js
                        </option>
                      </select>
                    ) : (
                      <div>{clientWebDesignTechStack}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 dark:text-gray-400">Start Date:</div>
                    {isEditing ? (
                      <input
                        type="date"
                        {...register("startDate")}
                        defaultValue={formatDateForInput(clientStartDate)}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                      />
                    ) : (
                      <div>{formatDate(clientStartDate)}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 dark:text-gray-400">Due Date:</div>
                    {isEditing ? (
                      <input
                        type="date"
                        {...register("endDate")}
                        defaultValue={formatDateForInput(clientEndDate)}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                      />
                    ) : (
                      <div>{formatDate(clientEndDate)}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 dark:text-gray-400">Time Left:</div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${timeStatus.color}`}
                      >
                        {timeStatus.text}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 dark:text-gray-400">Google Drive Link:</div>
                    {isEditing ? (
                      <input
                        type="url"
                        {...register("googleDriveLink")}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                        placeholder="https://drive.google.com/..."
                      />
                    ) : (
                      <div>
                        {clientGoogleDriveLink && (
                          <a
                            href={clientGoogleDriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mr-1"
                          >
                            <img
                              src="/google-drive.png"
                              alt="Google Drive"
                              className="h-4 w-4 rounded-full"
                            />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      onClick={saveTimelines}
                      disabled={
                        isSavingTimelines || localProjectTimelines.length === 0
                      }
                      className="flex items-center gap-2"
                    >
                      {isSavingTimelines ? (
                        <>
                          <Clock className="h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Timelines
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <ProjectTimelineComponent
                timelines={localProjectTimelines}
                clientId={Number(id)}
                onUpdate={setLocalProjectTimelines}
                isUpdating={isSavingTimelines}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Link Dialog - Keeping this for reference but it's now handled by RichTextEditor */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setLinkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setLinkDialogOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeTab === "Board" && (
        <Board id={id} setIsCreateTaskOpen={setIsCreateTaskOpen} />
      )}
    </div>
  );
};

export default TaskBoard;
