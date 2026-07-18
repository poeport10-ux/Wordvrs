import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const readingGoalsRouter = Router();

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function isYesterday(a: Date, b: Date) {
  const yesterday = new Date(b);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(a, yesterday);
}

readingGoalsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const goal = await prisma.readingGoal.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId! },
      update: {},
    });
    res.json({ goal: { ...goal, updatedAt: goal.updatedAt.toISOString() } });
  })
);

readingGoalsRouter.patch(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = z.object({ dailyMinutesTarget: z.number().int().min(5).max(600) }).parse(req.body);
    const goal = await prisma.readingGoal.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId!, ...data },
      update: data,
    });
    res.json({ goal: { ...goal, updatedAt: goal.updatedAt.toISOString() } });
  })
);

// Called whenever the reader makes progress on a chapter, to advance their streak.
readingGoalsRouter.post(
  "/log-reading-session",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.readingGoal.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId! },
      update: {},
    });

    const now = new Date();
    let currentStreak = existing.currentStreak;

    if (!existing.lastReadingDate) {
      currentStreak = 1;
    } else if (isSameDay(existing.lastReadingDate, now)) {
      currentStreak = existing.currentStreak || 1;
    } else if (isYesterday(existing.lastReadingDate, now)) {
      currentStreak = existing.currentStreak + 1;
    } else {
      currentStreak = 1;
    }

    const goal = await prisma.readingGoal.update({
      where: { userId: req.userId! },
      data: {
        currentStreak,
        longestStreak: Math.max(existing.longestStreak, currentStreak),
        lastReadingDate: now,
      },
    });
    res.json({ goal: { ...goal, updatedAt: goal.updatedAt.toISOString() } });
  })
);
