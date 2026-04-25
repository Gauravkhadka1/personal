// client/src/hooks/useTaskSocket.ts
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "@/lib/socket";
import { api } from "@/state/api"; // your RTK api slice

export const useTaskSocket = (userId: string | undefined) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit("join_room", userId);

    // Task created — invalidate task list
    socket.on("task:created", () => {
      dispatch(api.util.invalidateTags(["Tasks", "TaskCounts"]));
    });

    // Task status updated — invalidate task list and counts
    socket.on("task:statusUpdated", () => {
      dispatch(api.util.invalidateTags(["Tasks", "TaskCounts"]));
    });

    // Task updated — invalidate task list
    socket.on("task:updated", () => {
      dispatch(api.util.invalidateTags(["Tasks"]));
    });

    // Task deleted — invalidate task list and counts
    socket.on("task:deleted", () => {
      dispatch(api.util.invalidateTags(["Tasks", "TaskCounts", "DeletedTasks"]));
    });

    return () => {
      socket.off("task:created");
      socket.off("task:statusUpdated");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.disconnect();
    };
  }, [userId, dispatch]);
};