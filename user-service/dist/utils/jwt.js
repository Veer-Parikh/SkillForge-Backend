"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.SECRET_KEY;
const verifyToken = (token) => {
    if (!token) {
        throw new Error("Token is required for verification.");
    }
    return jsonwebtoken_1.default.verify(token, SECRET_KEY); // Ensure SECRET_KEY is valid
};
exports.verifyToken = verifyToken;
