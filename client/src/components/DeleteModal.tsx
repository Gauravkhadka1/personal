import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item?",
  description = "This action cannot be undone. This will permanently delete this item.",
  confirmText = "Yes, delete!",
  cancelText = "No, keep it.",
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center gap-4">
          <TriangleAlert className="h-12 w-12 text-destructive" />
          <div className="space-y-2 text-center">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {description}
            </AlertDialogDescription>
          </div>
        </div>
        <AlertDialogFooter className="gap-4 sm:justify-center">
          <AlertDialogCancel className="mt-2">{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteModal;