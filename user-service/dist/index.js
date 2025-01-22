"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateOTP, getOtpExpiration, sendOTP } = require("./middleware/auth");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
// Controllers
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password, number, age } = req.body;
    const hashedPassword = yield bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiration = getOtpExpiration();
    const existingUser = yield prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        res.status(400).json({ message: "User already exists" });
    }
    try {
        const user = yield prisma.user.create({
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
        yield sendOTP(number, otp);
        console.log("OTP sent successfully");
        console.log("User created successfully");
        res.json({ message: "OTP sent successfully", user });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to create user" });
    }
});
const loginUsingOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { number } = req.body;
        const otp = generateOTP();
        const otpExpiration = getOtpExpiration();
        const user = yield prisma.user.findFirst({ where: { number } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        yield prisma.user.update({
            where: { number },
            data: { otp, otpExpiration },
        });
        yield sendOTP(number, otp);
        console.log("OTP sent");
        res.json({ message: "OTP sent successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});
const loginUsingPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier, password } = req.body;
        const user = yield prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { number: identifier }],
            },
        });
        if (!user || !(yield bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
        res.json({ token, user });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to login" });
    }
});
const verify = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { number, otp } = req.body;
    try {
        const user = yield prisma.user.findUnique({ where: { number } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!user.otpExpiration || user.otp !== otp || new Date() > user.otpExpiration) {
            res.status(400).json({ message: "Invalid or expired OTP" });
            return;
        }
        yield prisma.user.update({
            where: { number },
            data: { otp: null, otpExpiration: null },
        });
        const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
        res.json({ message: "OTP verified successfully", token, user });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to verify OTP" });
        return;
    }
});
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany();
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier } = req.params;
        const user = yield prisma.user.findFirst({
            where: {
                OR: [
                    { number: identifier },
                    { email: identifier },
                    { id: identifier },
                ],
            },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        console.log("User found successfully");
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});
const myProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id) {
            res.status(401).json({ message: 'User not authenticated' });
        }
        const user = yield prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Routes
app.post("/api/user/create", createUser);
app.post("/api/user/login-otp", loginUsingOTP);
app.post("/api/user/login-password", loginUsingPassword);
app.post("/api/user/verify", verify);
app.get("/api/user", getUsers);
app.post("/api/user/:identifier", getUser);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});
