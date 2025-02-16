import express from "express";
import chatRoutes from "./chatRoutes";

const app = express();

app.use(express.json());
app.use("/api/chats", chatRoutes);

export default app;