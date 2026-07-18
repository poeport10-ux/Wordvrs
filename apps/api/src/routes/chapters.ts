import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { countWords } from "../lib/text.js";
import { notify } from "../lib/notify.js";

export const chaptersRouter = Router({ mergeParams: true });

function serializeChapter(c: {
  id: string;
  bookId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  status: string;
  choices: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    bookId: c.bookId,
    title: c.title,
    content: c.content,
    order: c.order,
    wordCount: c.wordCount,
    status: c.status,
    choices: (c.choices as { label: string; targetChapterId: string }[] | null) ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function loadBook(bookId: string) {
  return prisma.book.findUnique({ where: { id: bookId } });
}

// List chapters: owner sees everything, everyone else only published chapters of a published book.
chaptersRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const book = await loadBook(req.params.bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const isOwner = book.authorId === req.userId;
    if (!isOwner && book.status !== "PUBLISHED") return res.status(404).json({ error: "Book not found" });

    const chapters = await prisma.chapter.findMany({
      where: { bookId: book.id, ...(isOwner ? {} : { status: "PUBLISHED" }) },
      orderBy: { order: "asc" },
    });
    res.json({ chapters: chapters.map(serializeChapter) });
  })
);

chaptersRouter.get(
  "/:chapterId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const chapter = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
    if (!chapter || chapter.bookId !== req.params.bookId) return res.status(404).json({ error: "Chapter not found" });

    const book = await loadBook(chapter.bookId);
    const isOwner = book?.authorId === req.userId;
    if (!isOwner && chapter.status !== "PUBLISHED") return res.status(404).json({ error: "Chapter not found" });

    res.json({ chapter: serializeChapter(chapter) });
  })
);

async function requireOwnedBook(bookId: string, userId: string) {
  const book = await loadBook(bookId);
  if (!book || book.authorId !== userId) return null;
  return book;
}

chaptersRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const data = z.object({ title: z.string().min(1).max(200) }).parse(req.body);
    const last = await prisma.chapter.findFirst({ where: { bookId: book.id }, orderBy: { order: "desc" } });

    const chapter = await prisma.chapter.create({
      data: { bookId: book.id, title: data.title, order: (last?.order ?? -1) + 1 },
    });
    res.status(201).json({ chapter: serializeChapter(chapter) });
  })
);

const choiceSchema = z.object({
  label: z.string().min(1).max(120),
  targetChapterId: z.string(),
});

const updateChapterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  choices: z.array(choiceSchema).max(8).nullable().optional(),
});

chaptersRouter.patch(
  "/:chapterId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const existing = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
    if (!existing || existing.bookId !== book.id) return res.status(404).json({ error: "Chapter not found" });

    const data = updateChapterSchema.parse(req.body);
    const wasPublished = existing.status === "PUBLISHED";
    const { choices, ...rest } = data;

    const chapter = await prisma.chapter.update({
      where: { id: existing.id },
      data: {
        ...rest,
        ...(choices !== undefined ? { choices: (choices as Prisma.InputJsonValue) ?? Prisma.JsonNull } : {}),
        ...(data.content !== undefined ? { wordCount: countWords(data.content) } : {}),
      },
    });

    if (!wasPublished && chapter.status === "PUBLISHED") {
      const followers = await prisma.follow.findMany({ where: { followingId: req.userId! } });
      await Promise.all(
        followers.map((f) =>
          notify(f.followerId, "NEW_CHAPTER", { bookId: book.id, chapterId: chapter.id, title: chapter.title })
        )
      );
    }

    res.json({ chapter: serializeChapter(chapter) });
  })
);

chaptersRouter.post(
  "/:chapterId/versions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const chapter = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
    if (!chapter || chapter.bookId !== book.id) return res.status(404).json({ error: "Chapter not found" });

    const version = await prisma.chapterVersion.create({
      data: {
        chapterId: chapter.id,
        content: chapter.content,
        wordCount: chapter.wordCount,
        savedById: req.userId!,
      },
    });
    res.status(201).json({ version: { ...version, createdAt: version.createdAt.toISOString() } });
  })
);

chaptersRouter.get(
  "/:chapterId/versions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const versions = await prisma.chapterVersion.findMany({
      where: { chapterId: req.params.chapterId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ versions: versions.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })) });
  })
);

chaptersRouter.post(
  "/reorder",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const data = z.object({ chapterIds: z.array(z.string()) }).parse(req.body);
    await prisma.$transaction(
      data.chapterIds.map((id, index) =>
        prisma.chapter.updateMany({ where: { id, bookId: book.id }, data: { order: index } })
      )
    );
    res.status(204).send();
  })
);

chaptersRouter.delete(
  "/:chapterId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const chapter = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
    if (!chapter || chapter.bookId !== book.id) return res.status(404).json({ error: "Chapter not found" });

    await prisma.chapter.delete({ where: { id: chapter.id } });
    res.status(204).send();
  })
);
