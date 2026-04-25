// client/src/hooks/useTodayUpdateSocket.ts
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "@/lib/socket";
import { api } from "@/state/api";
import toast from "react-hot-toast";

export const useTodayUpdateSocket = (userId: string | undefined) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit("join_room", userId);

    // Today Update Created
    socket.on("todayUpdate:created", (data) => {
      console.log("Today update created:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));      
    });

    // Today Update Updated
    socket.on("todayUpdate:updated", (data) => {
      console.log("Today update updated:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));
    });

    // Today Update Deleted
    socket.on("todayUpdate:deleted", (data) => {
      console.log("Today update deleted:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));
    });

    // Today Update Liked
    socket.on("todayUpdate:liked", (data) => {
      console.log("Today update liked:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));
      // Optional: Show toast for likes (might be too noisy)
      // toast.success(data.message);
    });

    // Today Update Unliked
    socket.on("todayUpdate:unliked", (data) => {
      console.log("Today update unliked:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));
    });

    // Reply Created
    socket.on("todayUpdate:replied", (data) => {
      console.log("Reply created:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));
    });

    // Reply Liked
    socket.on("todayUpdate:replyLiked", (data) => {
      console.log("Reply liked:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));
    });

    // Reply Unliked
    socket.on("todayUpdate:replyUnliked", (data) => {
      console.log("Reply unliked:", data);
      dispatch(api.util.invalidateTags(["TodayUpdates"]));
    });

    return () => {
      socket.off("todayUpdate:created");
      socket.off("todayUpdate:updated");
      socket.off("todayUpdate:deleted");
      socket.off("todayUpdate:liked");
      socket.off("todayUpdate:unliked");
      socket.off("todayUpdate:replied");
      socket.off("todayUpdate:replyLiked");
      socket.off("todayUpdate:replyUnliked");
      socket.disconnect();
    };
  }, [userId, dispatch]);
};