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
const createUser = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, number, age } = req.body;
  if (!email || !password || !firstName || !number) {
    res.status(400).json({ message: "Missing required fields" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpiration = getOtpExpiration();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        number,
        password: hashedPassword,
        age,
        lastName,
        otp,
        otpExpiration,
      },
    });

    await sendOTP(number, otp);
    console.log("OTP sent successfully");
    console.log("User created successfully");
    res.json({ message: "OTP sent successfully", user });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create user" });
    return;
  }
};

const loginUsingOTP = async (req: Request, res: Response): Promise<void>=> {
  try {
    const { number } = req.body;

    const otp = generateOTP();
    const otpExpiration = getOtpExpiration();

    const user = await prisma.user.findFirst({ where: { number } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    await prisma.user.update({
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

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { number: identifier }],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
    res.json({ token, user });
    console.log("login successful")
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to login" });
  }
};

const verify = async (req: Request, res: Response): Promise<void>=> {
  const { number, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { number } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.otpExpiration || user.otp !== otp || new Date() > user.otpExpiration) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    await prisma.user.update({
      where: { number },
      data: { otp: null, otpExpiration: null },
    });

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
    res.json({ message: "OTP verified successfully", token, user });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify OTP" });
    return;
  }
};

const getUsers = async (req: Request, res: Response): Promise<void>=> {
  try {
    const users = await prisma.user.findMany({
      include:{Mentorship:true}
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getUser = async (req: Request, res: Response): Promise<void>=> {
  try {
    const { identifier } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { number: identifier },
          { email:{
              contains:identifier
            }
          },
          { id: identifier },
          { firstName: identifier },
          { lastName: identifier }
        ],
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    console.log("User found successfully");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const myProfile = async (req: myRequest, res: Response): Promise<void> => {
  try {
    const id = req.user?.id;
    if (!id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include:{Mentorship:true}
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};


app.post("/api/user/create", createUser);
app.post("/api/user/login-otp", loginUsingOTP);
app.post("/api/user/login-password", loginUsingPassword);
app.post("/api/user/verify", verify);
app.get("/api/user", getUsers);
app.post("/api/user/:identifier", getUser);
app.get("/api/user/myProfile",authMiddleware,myProfile)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});

import mentorshipRoutes from "./mentorshipRoutes"
app.use("/",mentorshipRoutes)