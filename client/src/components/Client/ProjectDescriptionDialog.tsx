"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateClientMutation } from "@/state/api";
import { Client } from "@/state/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface ProjectDescriptionDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDescriptionDialog: React.FC<ProjectDescriptionDialogProps> = ({
  client,
  open,
  onOpenChange,
}) => {
  const [projectDescription, setProjectDescription] = useState(
    client.projectDescription || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [updateClient] = useUpdateClientMutation();

  const handleSave = async () => {
    if (!client.id) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("projectDescription", projectDescription);

      await updateClient({
        id: client.id,
        formData: formData,
      }).unwrap();

      toast.success("Project description saved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving project description:", error);
      toast.error("Failed to save project description");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Description</DialogTitle>
          <DialogDescription>
            Add or edit the project description for {client.companyName || client.domainName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Description</Label>
            <Textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter project details, notes, or description..."
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDescriptionDialog;