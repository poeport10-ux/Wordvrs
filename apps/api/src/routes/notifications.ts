import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ notifications: notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })) });
  })
);

notificationsRouter.post(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.userId) return res.status(404).json({ error: "Not found" });
    await prisma.notification.update({ where: { id: notification.id }, data: { read: true } });
    res.status(204).send();
  })
);

notificationsRouter.post(
  "/read-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.userId!, read: false }, data: { read: true } });
    res.status(204).send();
  })
);
