import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
const jwt = require("jsonwebtoken");
const { generateOTP, getOtpExpiration, sendOTP } = require("./middleware/otp");
import { myRequest } from "./types/types";
const prisma = new PrismaClient();

const createMentorship = async (req: myRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    try {
        const mentorship = await prisma.mentorship.create({
            data:{
                mentorId:req.body.mentorId,
                userId:userId,
            }
        })
        console.log("successfully added as your mentor");
        res.json({message:"Mentor added successfully",mentorship});
        return;
    } catch (error){    
        console.error(error);
        res.status(500).json({ error: "Failed to verify OTP" });
        return;
    }
}

const endMentorship = async (req:myRequest,res:Response) : Promise<void> =>{
    try{
        const mentorship = await prisma.mentorship.update({
            where:{
                id:req.body.id
            },
            data:{
                endAt:new Date()
            }
        });
        console.log("mentorship ended");
        res.send(mentorship);
        return;
    } catch(error) {
        console.log(error)
        res.send(error);
        return;
    }
}