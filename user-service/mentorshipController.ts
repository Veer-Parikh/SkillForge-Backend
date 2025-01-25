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
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    try {
        const mentorship = await prisma.mentorship.create({
            data:{
                mentorId,
                userId:userId,
            }
        })
        const mentor = await axios.put(`http://localhost:5000/api/mentor/addUser/${mentorId}`,{
            userId
        })
        console.log("successfully added as your mentor");
        res.json({message:"Mentor added successfully",mentorship,mentor});
        return;
    } catch (error){    
        console.error(error);
        res.status(500).json({ error: "Failed to verify OTP" });
        return;
    }
}

export const endMentorship = async (req:myRequest,res:Response) : Promise<void> =>{
    try{
        const mentorId = req.body.mentorId
        const mentorship = await prisma.mentorship.update({
            where:{
                id:req.body.id
            },
            data:{
                endAt:new Date()
            }
        });
        const mentor = await axios.put(`http://localhost:5000/api/mentor/removeUser/${mentorId}`,{
            userId:req.user?.id
        })
        console.log("mentorship ended");
        res.send({mentorship,mentor});
        return;
    } catch(error) {
        console.log(error)
        res.send(error);
        return;
    }
}