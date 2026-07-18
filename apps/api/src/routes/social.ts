import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { notify } from "../lib/notify.js";

export const socialRouter = Router();

// ---- Reviews ----
socialRouter.get(
  "/books/:bookId/reviews",
  asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { bookId: req.params.bookId },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ reviews: reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
  })
);

const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), text: z.string().max(4000).optional() });

socialRouter.post(
  "/books/:bookId/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = reviewSchema.parse(req.body);
    const book = await prisma.book.findUnique({ where: { id: req.params.bookId } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const review = await prisma.review.upsert({
      where: { bookId_userId: { bookId: book.id, userId: req.userId! } },
      create: { bookId: book.id, userId: req.userId!, rating: data.rating, text: data.text ?? "" },
      update: { rating: data.rating, text: data.text ?? "" },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });

    if (book.authorId !== req.userId) {
      await notify(book.authorId, "NEW_REVIEW", { bookId: book.id, reviewId: review.id });
    }
    res.status(201).json({ review: { ...review, createdAt: review.createdAt.toISOString() } });
  })
);

// ---- Comments ----
socialRouter.get(
  "/books/:bookId/comments",
  asyncHandler(async (req, res) => {
    const { chapterId } = req.query as { chapterId?: string };
    const comments = await prisma.comment.findMany({
      where: { bookId: req.params.bookId, chapterId: chapterId ?? null },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ comments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })) });
  })
);

const commentSchema = z.object({
  text: z.string().min(1).max(2000),
  chapterId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

socialRouter.post(
  "/books/:bookId/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = commentSchema.parse(req.body);
    const book = await prisma.book.findUnique({ where: { id: req.params.bookId } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const comment = await prisma.comment.create({
      data: {
        bookId: book.id,
        chapterId: data.chapterId ?? null,
        parentId: data.parentId ?? null,
        userId: req.userId!,
        text: data.text,
      },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });

    if (book.authorId !== req.userId) {
      await notify(book.authorId, "NEW_COMMENT", { bookId: book.id, commentId: comment.id });
    }
    res.status(201).json({ comment: { ...comment, createdAt: comment.createdAt.toISOString() } });
  })
);

socialRouter.delete(
  "/comments/:commentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
    if (!comment || comment.userId !== req.userId) return res.status(404).json({ error: "Comment not found" });
    await prisma.comment.delete({ where: { id: comment.id } });
    res.status(204).send();
  })
);

// ---- Subscriptions (mock payment - records intent, no real billing yet) ----
socialRouter.post(
  "/authors/:authorId/subscribe",
  requireAuth,
  asyncHandler(async (req, res) => {
    const author = await prisma.user.findUnique({ where: { id: req.params.authorId } });
    if (!author) return res.status(404).json({ error: "Author not found" });

    const subscription = await prisma.subscription.upsert({
      where: { subscriberId_authorId: { subscriberId: req.userId!, authorId: author.id } },
      create: { subscriberId: req.userId!, authorId: author.id },
      update: { status: "ACTIVE" },
    });
    await notify(author.id, "NEW_SUBSCRIBER", { subscriberId: req.userId });
    res.status(201).json({ subscription });
  })
);

socialRouter.post(
  "/books/:bookId/purchase",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await prisma.book.findUnique({ where: { id: req.params.bookId } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const purchase = await prisma.purchase.upsert({
      where: { userId_bookId: { userId: req.userId!, bookId: book.id } },
      create: { userId: req.userId!, bookId: book.id, priceCents: book.priceCents ?? 0 },
      update: {},
    });
    await prisma.libraryItem.upsert({
      where: { userId_bookId_type: { userId: req.userId!, bookId: book.id, type: "PURCHASED" } },
      create: { userId: req.userId!, bookId: book.id, type: "PURCHASED" },
      update: {},
    });
    res.status(201).json({ purchase });
  })
);
