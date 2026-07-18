import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { notify } from "../lib/notify.js";

export const eventsRouter = Router();

function serializeEvent(
  e: {
    id: string;
    hostId: string;
    host?: { id: string; username: string; displayName: string; avatarUrl: string | null };
    bookId: string | null;
    title: string;
    description: string;
    scheduledAt: Date;
    linkUrl: string | null;
    createdAt: Date;
    rsvps?: { userId: string }[];
  },
  viewerId?: string
) {
  return {
    id: e.id,
    hostId: e.hostId,
    host: e.host,
    bookId: e.bookId,
    title: e.title,
    description: e.description,
    scheduledAt: e.scheduledAt.toISOString(),
    linkUrl: e.linkUrl,
    rsvpCount: e.rsvps?.length ?? 0,
    isAttending: viewerId ? (e.rsvps?.some((r) => r.userId === viewerId) ?? false) : undefined,
    createdAt: e.createdAt.toISOString(),
  };
}

// Upcoming events across the platform — surfaced in Reader Discover and on author profiles.
eventsRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { hostUsername } = req.query as { hostUsername?: string };
    const events = await prisma.event.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        ...(hostUsername ? { host: { username: hostUsername } } : {}),
      },
      include: {
        host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        rsvps: { select: { userId: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 50,
    });
    res.json({ events: events.map((e) => serializeEvent(e, req.userId)) });
  })
);

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  linkUrl: z.string().url().optional().nullable(),
  bookId: z.string().optional().nullable(),
});

eventsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createEventSchema.parse(req.body);

    if (data.bookId) {
      const book = await prisma.book.findUnique({ where: { id: data.bookId } });
      if (!book || book.authorId !== req.userId) {
        return res.status(400).json({ error: "You can only attach events to your own books" });
      }
    }

    const event = await prisma.event.create({
      data: {
        hostId: req.userId!,
        title: data.title,
        description: data.description ?? "",
        scheduledAt: new Date(data.scheduledAt),
        linkUrl: data.linkUrl ?? null,
        bookId: data.bookId ?? null,
      },
      include: {
        host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        rsvps: { select: { userId: true } },
      },
    });

    const followers = await prisma.follow.findMany({ where: { followingId: req.userId! } });
    await Promise.all(
      followers.map((f) => notify(f.followerId, "NEW_EVENT", { eventId: event.id, title: event.title }))
    );

    res.status(201).json({ event: serializeEvent(event, req.userId) });
  })
);

eventsRouter.delete(
  "/:eventId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
    if (!event || event.hostId !== req.userId) return res.status(404).json({ error: "Event not found" });
    await prisma.event.delete({ where: { id: event.id } });
    res.status(204).send();
  })
);

eventsRouter.post(
  "/:eventId/rsvp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    await prisma.eventRSVP.upsert({
      where: { eventId_userId: { eventId: event.id, userId: req.userId! } },
      create: { eventId: event.id, userId: req.userId! },
      update: {},
    });
    res.status(204).send();
  })
);

eventsRouter.delete(
  "/:eventId/rsvp",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.eventRSVP
      .delete({ where: { eventId_userId: { eventId: req.params.eventId, userId: req.userId! } } })
      .catch(() => null);
    res.status(204).send();
  })
);
