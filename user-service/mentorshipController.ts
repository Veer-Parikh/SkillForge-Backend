import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
const jwt = require("jsonwebtoken");
const { generateOTP, getOtpExpiration, sendOTP } = require("./middleware/otp");
import { myRequest } from "./types/types";
import axios from "axios";
const prisma = new PrismaClient();

export const createMentorship = async (req: myRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const mentorId = req.body.mentorId;
  
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
  
    try {
      const mentorResponse = await axios.post(`http://localhost:5000/api/mentor/${mentorId}`);
      const mentor = mentorResponse.data;
  
      if (!mentor) {
        res.status(404).send({ message: "Mentor not found" });
        return;
      }
  
      if (mentor.currentUsers.includes(userId)) {
        res.status(400).json({ message: "User is already in mentorship with this mentor" });
        return;
      }
  
      const mentorship = await prisma.mentorship.create({
        data: {
          mentorId,
          userId,
        },
      });
  
      const updatedMentor = await axios.put(`http://localhost:5000/api/mentor/addUser/${mentorId}`, {
        userId,
      });

      await axios.post("http://localhost:7000/api/chat/addUserToCommunity", {
        mentorId,
        userId,
      });

      console.log("Successfully added as your mentor");
      res.json({ message: "Mentor added successfully", mentorship, mentor: updatedMentor.data });
    } catch (error) {
      console.error("Error in createMentorship function:", error);
      res.status(500).json({ error });
    }
};



export const endMentorship = async (req: myRequest, res: Response): Promise<void> => {
    try {
        const mentorId = req.body.mentorId;

        // Check if the mentorship exists and is not already ended
        const existingMentorship = await prisma.mentorship.findFirst({
            where: {
                id: req.body.id, // Mentorship ID
                userId: req.user?.id, // Ensure it belongs to the requesting user
                mentorId: mentorId, // Ensure it matches the provided mentorId
                endAt: null, // Ensure it's an active mentorship
            },
        });

        if (!existingMentorship) {
            res.status(404).send({ message: "Mentorship not found or already ended." });
            return;
        }

        // Update the mentorship to mark it as ended
        const mentorship = await prisma.mentorship.update({
            where: { id: req.body.id },
            data: {
                endAt: new Date(),
            },
        });

        // Update the mentor's user list
        const mentor = await axios.put(`http://localhost:5000/api/mentor/removeUser/${mentorId}`, {
            userId: req.user?.id,
        });

        console.log("Mentorship ended successfully");
        res.send({ mentorship, mentor: mentor.data });
        return;
    } catch (error) {
        console.log("Error ending mentorship:", error);
        res.status(500).send({ error: "An error occurred while ending the mentorship." });
        return;
    }
};
