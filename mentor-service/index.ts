import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "./middleware/auth";
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateOTP, getOtpExpiration, sendOTP } = require("./middleware/otp");
import { myRequest } from "./types/types";
// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
const prisma = new PrismaClient();

// Controllers
const createMentor = async (req: Request, res: Response): Promise<void> => {
  const { name , email, password, number, age, expertise, hourlyRate, availableFrom, availableTo } = req.body;
  const expertiseArray = expertise.split(" ")
  if (!email || !password || !number) {
    res.status(400).json({ message: "Missing required fields" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpiration = getOtpExpiration();

  const existingMentor = await prisma.mentor.findUnique({ where: { email } });
  if (existingMentor) {
    res.status(400).json({ message: "Mentor already exists" });
    return;
  }

  try {
    const mentor = await prisma.mentor.create({
      data: {
        expertise:expertiseArray,
        email,
        number,
        password: hashedPassword,
        name,
        hourlyRate,
        age,
        otp,
        otpExpiration,
        availableFrom,
        availableTo
      },
    });

    await sendOTP(number, otp);
    console.log("OTP sent successfully");
    console.log("Mentor created successfully");
    res.json({ message: "OTP sent successfully", mentor });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create mentor" });
    return;
  }
};

const loginUsingOTP = async (req: Request, res: Response): Promise<void>=> {
  try {
    const { number } = req.body;

    const otp = generateOTP();
    const otpExpiration = getOtpExpiration();

    const mentor = await prisma.mentor.findFirst({ where: { number } });
    if (!mentor) {
      res.status(404).json({ message: "Mentor not found" });
    }

    await prisma.mentor.update({
      where: { number },
      data: { otp, otpExpiration },
    });

    await sendOTP(number, otp);
    console.log("OTP sent");
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

const loginUsingPassword = async (req: Request, res: Response): Promise<void>=> {
  try {
    const { identifier, password } = req.body;

    const mentor = await prisma.mentor.findFirst({
      where: {
        OR: [{ email: identifier }, { number: identifier }],
      },
    });

    if (!mentor || !(await bcrypt.compare(password, mentor.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: mentor.id }, process.env.SECRET_KEY);
    res.json({ token, mentor });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to login" });
  }
};

const verify = async (req: Request, res: Response): Promise<void>=> {
  const { number, otp } = req.body;

  try {
    const mentor = await prisma.mentor.findUnique({ where: { number } });
    if (!mentor) {
      res.status(404).json({ message: "Mentor not found" });
      return;
    }

    if (!mentor.otpExpiration || mentor.otp !== otp || new Date() > mentor.otpExpiration) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    await prisma.mentor.update({
      where: { number },
      data: { otp: null, otpExpiration: null },
    });

    const token = jwt.sign({ id: mentor.id }, process.env.SECRET_KEY);
    res.json({ message: "OTP verified successfully", token, mentor });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify OTP" });
    return;
  }
};

const getMentors = async (req: Request, res: Response): Promise<void>=> {
  try {
    const mentors = await prisma.mentor.findMany();
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
};

const getMentor = async (req: Request, res: Response): Promise<void>=> {
  try {
    const { identifier } = req.params;

    const mentor = await prisma.mentor.findFirst({
      where: {
        OR: [
          { number: identifier },
          { email:{
              contains:identifier
            }
          },
          { id: identifier }
        ],
      },
    });

    if (!mentor) {
      res.status(404).json({ message: "Mentor not found" });
      return;
    }

    console.log("Mentor found successfully");
    res.json(mentor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const myProfile = async (req: myRequest, res: Response): Promise<void> => {
  try {
    const id = req.mentor?.id;
    if (!id) {
      res.status(401).json({ message: 'Mentor not authenticated' });
      return;
    }

    const mentor = await prisma.mentor.findUnique({
      where: { id },
    });

    if (!mentor) {
      res.status(404).json({ message: 'Mentor not found' });
      return;
    }

    res.json(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};


// Routes
app.post("/api/mentor/create", createMentor);
app.post("/api/mentor/login-otp", loginUsingOTP);
app.post("/api/mentor/login-password", loginUsingPassword);
app.post("/api/mentor/verify", verify);
app.get("/api/mentor", getMentors);
app.post("/api/mentor/:identifier",authMiddleware, getMentor);
app.get("/api/mentor/myProfile",authMiddleware,myProfile)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mentor service running on port ${PORT}`);
});
