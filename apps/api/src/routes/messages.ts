import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { notify } from "../lib/notify.js";

export const messagesRouter = Router();

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

messagesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ userAId: req.userId! }, { userBId: req.userId! }] },
      include: {
        userA: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        userB: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        otherUser: c.userAId === req.userId ? c.userB : c.userA,
        lastMessage: c.messages[0]
          ? { ...c.messages[0], createdAt: c.messages[0].createdAt.toISOString() }
          : null,
      })),
    });
  })
);

messagesRouter.get(
  "/:conversationId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.conversationId } });
    if (!conversation || (conversation.userAId !== req.userId && conversation.userBId !== req.userId)) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });
    res.json({ messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) });
  })
);

const sendSchema = z.object({ toUsername: z.string(), text: z.string().min(1).max(4000) });

messagesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = sendSchema.parse(req.body);
    const recipient = await prisma.user.findUnique({ where: { username: data.toUsername } });
    if (!recipient) return res.status(404).json({ error: "User not found" });
    if (recipient.id === req.userId) return res.status(400).json({ error: "You can't message yourself" });

    const [userAId, userBId] = orderedPair(req.userId!, recipient.id);
    const conversation = await prisma.conversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
    });

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: req.userId!, text: data.text },
    });

    await notify(recipient.id, "NEW_MESSAGE", { conversationId: conversation.id, senderId: req.userId });
    res.status(201).json({ message: { ...message, createdAt: message.createdAt.toISOString() } });
  })
);
