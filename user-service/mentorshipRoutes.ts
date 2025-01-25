import express from "express"
import authMiddleware from "./middleware/auth";
import { createMentorship,endMentorship } from "./mentorshipController";
const router = express.Router();

router.post("/api/mentorship/create",authMiddleware,createMentorship)
router.put("/api/mentorship/end",authMiddleware,endMentorship)