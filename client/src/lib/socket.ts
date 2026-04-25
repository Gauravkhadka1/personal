// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/", {
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false, // connect manually after login
    });
  }
  return socket;
};