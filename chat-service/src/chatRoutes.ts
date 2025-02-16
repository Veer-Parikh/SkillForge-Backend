import express from "express";
import { getChatHistory,createCommunity,addUserToCommunity,addToReadByUsers,createMessage,deleteMessage,editMessage} from "./chatController";

const router = express.Router();

router.get("/history/:chatId", getChatHistory);
router.post("/createCommunity", createCommunity);
router.post("/addUser", addUserToCommunity);
router.post("/message", createMessage);
router.put("/message", editMessage);
router.delete("/message/:messageId", deleteMessage);
router.put("/message/read", addToReadByUsers);

export default router;
