import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import redisClient from "./utils/redisClient";
import setupSocket from "./utils/socketHandler";

const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

setupSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`);
});
