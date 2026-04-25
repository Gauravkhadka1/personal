// client/src/components/SubTask/TimerConfirmationDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TimerConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  runningTaskTitle: string;
}

const TimerConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  runningTaskTitle
}: TimerConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Timer Already Running</DialogTitle>
          <DialogDescription>
            Another timer is currently running for "{runningTaskTitle}". 
            Do you want to stop it and start this timer instead?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            No, Keep Running
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
          >
            Yes, Stop and Switch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimerConfirmationDialog;