import express from "express"
import authMiddleware from "./middleware/auth";
import { createMentorship,endMentorship } from "./mentorshipController";
import { Router } from 'express';
const router = Router();

router.post("/api/mentorship/create",authMiddleware,createMentorship)
router.put("/api/mentorship/end",authMiddleware,endMentorship)

export default router;