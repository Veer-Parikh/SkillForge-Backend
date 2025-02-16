import { Request, Response } from "express";
import redisClient from "./utils/redisClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    // Fetch messages from Redis
    const messages = await redisClient.lRange(`chat:${chatId}:messages`, 0, -1);

    res.status(200).json(messages.map((msg) => JSON.parse(msg)));
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const createCommunity = async (req: Request, res: Response) => {
  const { mentorId, mentorName } = req.body;

  if (!mentorId || !mentorName) {
    res.status(400).json({ message: "Missing mentor details" });
    return;
  }

  try {
    const chat = await prisma.chat.create({
      data: {
        participants: [mentorId], // Initially only mentor
        isGroup: true,
        groupName: `${mentorName}'s Community`,
        mentorId,
      },
    });

    res.json({ message: "Community chat created", chat });
  } catch (err) {
    console.error("Error creating community chat:", err);
    res.status(500).json({ error: "Failed to create community chat" });
  }
};

export const addUserToCommunity = async (req:Request, res:Response) => {
    const { mentorId, userId } = req.body;
  
    if (!mentorId || !userId) {
      res.status(400).json({ message: "Missing details" });
      return;
    }
  
    try {
      const chat = await prisma.chat.findFirst({
        where: { mentorId },
      });
  
      if (!chat) {
        res.status(404).json({ message: "Community chat not found" });
        return;
      }
  
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          participants: { push: userId }, // Add the user to the participants array
        },
      });
  
      res.json({ message: "User added to community chat" });
    } catch (err) {
      console.error("Error adding user to chat:", err);
      res.status(500).json({ error: "Failed to add user" });
    }
}

export const createMessage = async (req: Request, res: Response) => {
  const { chatId, senderId, content } = req.body;

  if (!chatId || !senderId || !content) {
    res.status(400).json({ message: "Missing message details" });
    return;
  }

  try {
    const mesage = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
    });

    res.json({ message: "Message sent", mesage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Edit a message
export const editMessage = async (req: Request, res: Response) => {
  const { messageId, newContent } = req.body;

  if (!messageId || !newContent) {
    res.status(400).json({ message: "Missing message details" });
    return;
  }

  try {
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content: newContent },
    });

    res.json({ message: "Message updated", updatedMessage });
  } catch (err) {
    console.error("Error updating message:", err);
    res.status(500).json({ error: "Failed to update message" });
  }
};

// Delete a message
export const deleteMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;

  if (!messageId) {
    res.status(400).json({ message: "Message ID is required" });
    return;
  }

  try {
    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

// Add a user to the readBy array
export const addToReadByUsers = async (req: Request, res: Response) => {
  const { messageId, userId } = req.body;

  if (!messageId || !userId) {
    res.status(400).json({ message: "Missing required details" });
    return;
  }

  try {
    const mesage = await prisma.message.update({
      where: { id: messageId },
      data: {
        readBy: {
          push: userId, // Add user ID to readBy array
        },
      },
    });

    res.json({ message: "Message marked as read", mesage });
  } catch (err) {
    console.error("Error updating read status:", err);
    res.status(500).json({ error: "Failed to update read status" });
  }
};