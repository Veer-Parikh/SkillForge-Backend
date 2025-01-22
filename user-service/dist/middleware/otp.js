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
const otpGenerator = require('otp-generator');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const prisma = new PrismaClient();
const apiKey = process.env.FAST2SMS_API_KEY;
const sendOTP = (number, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const message = `Your OTP is: ${otp}`;
    const data = {
        sender_id: 'FSTSMS',
        message: message,
        language: 'english',
        route: 'p',
        numbers: number,
    };
    try {
        const response = yield axios.post(`https://www.fast2sms.com/dev/bulkV2`, data, {
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
});
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const getOtpExpiration = () => {
    return new Date(new Date().getTime() + 5 * 60000); // 5 minutes from now
};
module.exports = { sendOTP, generateOTP, getOtpExpiration };
