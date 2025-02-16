import { Server, Socket } from "socket.io";
import redisClient from "./redisClient";

const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("New client connected:", socket.id);

    // Handle joining a chat room
    socket.on("joinChat", (chatId: string) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    // Handle sending a message
    socket.on("sendMessage", async (data) => {
      const { chatId, message } = data;

      // Broadcast to the room
      io.to(chatId).emit("receiveMessage", message);

      // Save to Redis for ephemeral states (e.g., online status)
      await redisClient.lPush(`chat:${chatId}:messages`, JSON.stringify(message));
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export default setupSocket;
