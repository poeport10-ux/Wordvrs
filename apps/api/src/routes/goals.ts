import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const goalsRouter = Router();

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function isYesterday(a: Date, b: Date) {
  const yesterday = new Date(b);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(a, yesterday);
}

goalsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const goal = await prisma.writingGoal.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId! },
      update: {},
    });
    res.json({ goal: { ...goal, updatedAt: goal.updatedAt.toISOString() } });
  })
);

goalsRouter.patch(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = z.object({ dailyWordTarget: z.number().int().min(50).max(50000) }).parse(req.body);
    const goal = await prisma.writingGoal.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId!, ...data },
      update: data,
    });
    res.json({ goal: { ...goal, updatedAt: goal.updatedAt.toISOString() } });
  })
);

// Called whenever the writer saves chapter content, to advance their streak.
goalsRouter.post(
  "/log-writing-session",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.writingGoal.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId! },
      update: {},
    });

    const now = new Date();
    let currentStreak = existing.currentStreak;

    if (!existing.lastWritingDate) {
      currentStreak = 1;
    } else if (isSameDay(existing.lastWritingDate, now)) {
      currentStreak = existing.currentStreak || 1;
    } else if (isYesterday(existing.lastWritingDate, now)) {
      currentStreak = existing.currentStreak + 1;
    } else {
      currentStreak = 1;
    }

    const goal = await prisma.writingGoal.update({
      where: { userId: req.userId! },
      data: {
        currentStreak,
        longestStreak: Math.max(existing.longestStreak, currentStreak),
        lastWritingDate: now,
      },
    });
    res.json({ goal: { ...goal, updatedAt: goal.updatedAt.toISOString() } });
  })
);
