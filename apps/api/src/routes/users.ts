import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializePublicAuthor, serializeUser } from "../lib/serialize.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { notify } from "../lib/notify.js";

export const usersRouter = Router();

const updateMeSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  isAuthor: z.boolean().optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
});

usersRouter.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = updateMeSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.userId! }, data });
    res.json({ user: serializeUser(user) });
  })
);

usersRouter.get(
  "/:username",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const [followerCount, bookCount, isFollowing] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.book.count({ where: { authorId: user.id, status: "PUBLISHED" } }),
      req.userId
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
          })
        : null,
    ]);

    res.json({
      author: serializePublicAuthor(user, followerCount, bookCount),
      isFollowing: Boolean(isFollowing),
    });
  })
);

usersRouter.post(
  "/:username/follow",
  requireAuth,
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === req.userId) return res.status(400).json({ error: "You can't follow yourself" });

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: req.userId!, followingId: target.id } },
      create: { followerId: req.userId!, followingId: target.id },
      update: {},
    });
    await notify(target.id, "NEW_FOLLOWER", { followerId: req.userId });
    res.status(204).send();
  })
);

usersRouter.delete(
  "/:username/follow",
  requireAuth,
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!target) return res.status(404).json({ error: "User not found" });

    await prisma.follow
      .delete({ where: { followerId_followingId: { followerId: req.userId!, followingId: target.id } } })
      .catch(() => null);
    res.status(204).send();
  })
);

usersRouter.get(
  "/me/followers",
  requireAuth,
  asyncHandler(async (req, res) => {
    const follows = await prisma.follow.findMany({
      where: { followingId: req.userId! },
      include: { follower: true },
      orderBy: { createdAt: "desc" },
    });
    const followers = await Promise.all(
      follows.map(async (f) => {
        const [followerCount, bookCount] = await Promise.all([
          prisma.follow.count({ where: { followingId: f.followerId } }),
          prisma.book.count({ where: { authorId: f.followerId, status: "PUBLISHED" } }),
        ]);
        return serializePublicAuthor(f.follower, followerCount, bookCount);
      })
    );
    res.json({ followers });
  })
);

usersRouter.get(
  "/me/subscribers",
  requireAuth,
  asyncHandler(async (req, res) => {
    const subscriptions = await prisma.subscription.findMany({
      where: { authorId: req.userId!, status: "ACTIVE" },
      include: { subscriber: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      subscribers: subscriptions.map((s) => ({
        id: s.id,
        tier: s.tier,
        priceCents: s.priceCents,
        createdAt: s.createdAt.toISOString(),
        user: serializePublicAuthor(s.subscriber, 0, 0),
      })),
    });
  })
);

usersRouter.get(
  "/me/following",
  requireAuth,
  asyncHandler(async (req, res) => {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId! },
      include: { following: true },
      orderBy: { createdAt: "desc" },
    });
    const authors = await Promise.all(
      follows.map(async (f) => {
        const [followerCount, bookCount] = await Promise.all([
          prisma.follow.count({ where: { followingId: f.followingId } }),
          prisma.book.count({ where: { authorId: f.followingId, status: "PUBLISHED" } }),
        ]);
        return serializePublicAuthor(f.following, followerCount, bookCount);
      })
    );
    res.json({ authors });
  })
);
