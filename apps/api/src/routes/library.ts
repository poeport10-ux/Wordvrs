import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeBook } from "../lib/serialize.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const libraryRouter = Router();

const bookInclude = { chapters: { select: { wordCount: true } }, reviews: { select: { rating: true } } } as const;

libraryRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { type } = req.query as { type?: string };
    const items = await prisma.libraryItem.findMany({
      where: { userId: req.userId!, ...(type ? { type: type as never } : {}) },
      include: { book: { include: bookInclude } },
      orderBy: { addedAt: "desc" },
    });
    res.json({
      items: items.map((i) => ({
        id: i.id,
        type: i.type,
        addedAt: i.addedAt.toISOString(),
        book: serializeBook(i.book),
      })),
    });
  })
);

const addSchema = z.object({ bookId: z.string(), type: z.enum(["FREE", "WISHLIST"]).default("WISHLIST") });

libraryRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = addSchema.parse(req.body);
    const book = await prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const item = await prisma.libraryItem.upsert({
      where: { userId_bookId_type: { userId: req.userId!, bookId: book.id, type: data.type } },
      create: { userId: req.userId!, bookId: book.id, type: data.type },
      update: {},
    });
    res.status(201).json({ item });
  })
);

libraryRouter.delete(
  "/:itemId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await prisma.libraryItem.findUnique({ where: { id: req.params.itemId } });
    if (!item || item.userId !== req.userId) return res.status(404).json({ error: "Not found" });
    await prisma.libraryItem.delete({ where: { id: item.id } });
    res.status(204).send();
  })
);

// ---- Reading progress ----
const progressSchema = z.object({ bookId: z.string(), chapterId: z.string(), progressPercent: z.number().min(0).max(100) });

libraryRouter.put(
  "/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = progressSchema.parse(req.body);
    const progress = await prisma.readingProgress.upsert({
      where: { userId_bookId: { userId: req.userId!, bookId: data.bookId } },
      create: { userId: req.userId!, ...data },
      update: { chapterId: data.chapterId, progressPercent: data.progressPercent },
    });
    res.json({ progress: { ...progress, updatedAt: progress.updatedAt.toISOString() } });
  })
);

libraryRouter.get(
  "/progress/:bookId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const progress = await prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId: req.userId!, bookId: req.params.bookId } },
    });
    res.json({ progress: progress ? { ...progress, updatedAt: progress.updatedAt.toISOString() } : null });
  })
);

// ---- Bookmarks ----
libraryRouter.get(
  "/bookmarks/:chapterId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.userId!, chapterId: req.params.chapterId },
    });
    res.json({ bookmarks });
  })
);

libraryRouter.post(
  "/bookmarks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = z.object({ chapterId: z.string(), position: z.number().int().min(0).default(0) }).parse(req.body);
    const bookmark = await prisma.bookmark.create({ data: { userId: req.userId!, ...data } });
    res.status(201).json({ bookmark });
  })
);

libraryRouter.delete(
  "/bookmarks/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookmark = await prisma.bookmark.findUnique({ where: { id: req.params.id } });
    if (!bookmark || bookmark.userId !== req.userId) return res.status(404).json({ error: "Not found" });
    await prisma.bookmark.delete({ where: { id: bookmark.id } });
    res.status(204).send();
  })
);

// ---- Highlights ----
libraryRouter.get(
  "/highlights/:chapterId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const highlights = await prisma.highlight.findMany({
      where: { userId: req.userId!, chapterId: req.params.chapterId },
    });
    res.json({ highlights });
  })
);

const highlightSchema = z.object({
  chapterId: z.string(),
  text: z.string().min(1).max(2000),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  note: z.string().max(2000).optional(),
});

libraryRouter.post(
  "/highlights",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = highlightSchema.parse(req.body);
    const highlight = await prisma.highlight.create({ data: { userId: req.userId!, ...data } });
    res.status(201).json({ highlight });
  })
);

libraryRouter.delete(
  "/highlights/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const highlight = await prisma.highlight.findUnique({ where: { id: req.params.id } });
    if (!highlight || highlight.userId !== req.userId) return res.status(404).json({ error: "Not found" });
    await prisma.highlight.delete({ where: { id: highlight.id } });
    res.status(204).send();
  })
);
