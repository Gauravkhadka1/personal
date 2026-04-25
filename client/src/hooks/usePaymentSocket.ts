// client/src/hooks/usePaymentSocket.ts
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "@/lib/socket";
import { api } from "@/state/api";

export const usePaymentSocket = (userId: string | undefined) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit("join_room", userId);

    // Payment created - invalidate payment data
    socket.on("payment:created", (data) => {
      console.log("Payment created:", data);
      dispatch(api.util.invalidateTags(["Payments"]));
      
      // Optional: Show toast notification
      // You can integrate with your toast system here
    });

    // Payment updated - invalidate payment data
    socket.on("payment:updated", (data) => {
      console.log("Payment updated:", data);
      dispatch(api.util.invalidateTags(["Payments"]));
    });

    // Payment deleted - invalidate payment data
    socket.on("payment:deleted", (data) => {
      console.log("Payment deleted:", data);
      dispatch(api.util.invalidateTags(["Payments"]));
    });

    return () => {
      socket.off("payment:created");
      socket.off("payment:updated");
      socket.off("payment:deleted");
      socket.disconnect();
    };
  }, [userId, dispatch]);
};