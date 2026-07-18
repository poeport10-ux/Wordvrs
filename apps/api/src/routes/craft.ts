import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const craftRouter = Router({ mergeParams: true });

async function requireOwnedBook(bookId: string, userId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book || book.authorId !== userId) return null;
  return book;
}

// ---- Characters ----
craftRouter.get(
  "/characters",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const characters = await prisma.character.findMany({ where: { bookId: book.id } });
    res.json({ characters });
  })
);

const characterSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(60).optional().nullable(),
  description: z.string().max(4000).optional(),
  imageUrl: z.string().url().optional().nullable(),
});

craftRouter.post(
  "/characters",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = characterSchema.parse(req.body);
    const character = await prisma.character.create({ data: { bookId: book.id, ...data } });
    res.status(201).json({ character });
  })
);

craftRouter.patch(
  "/characters/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = characterSchema.partial().parse(req.body);
    const character = await prisma.character.update({ where: { id: req.params.id }, data });
    res.json({ character });
  })
);

craftRouter.delete(
  "/characters/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    await prisma.character.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---- World elements ----
craftRouter.get(
  "/world",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const worldElements = await prisma.worldElement.findMany({ where: { bookId: book.id } });
    res.json({ worldElements });
  })
);

const worldSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().max(60).optional(),
  description: z.string().max(4000).optional(),
});

craftRouter.post(
  "/world",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = worldSchema.parse(req.body);
    const worldElement = await prisma.worldElement.create({ data: { bookId: book.id, ...data } });
    res.status(201).json({ worldElement });
  })
);

craftRouter.patch(
  "/world/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = worldSchema.partial().parse(req.body);
    const worldElement = await prisma.worldElement.update({ where: { id: req.params.id }, data });
    res.json({ worldElement });
  })
);

craftRouter.delete(
  "/world/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    await prisma.worldElement.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---- Timeline ----
craftRouter.get(
  "/timeline",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const timelineEvents = await prisma.timelineEvent.findMany({
      where: { bookId: book.id },
      orderBy: { order: "asc" },
    });
    res.json({ timelineEvents });
  })
);

const timelineSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  date: z.string().max(60).optional().nullable(),
});

craftRouter.post(
  "/timeline",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = timelineSchema.parse(req.body);
    const last = await prisma.timelineEvent.findFirst({ where: { bookId: book.id }, orderBy: { order: "desc" } });
    const timelineEvent = await prisma.timelineEvent.create({
      data: { bookId: book.id, ...data, order: (last?.order ?? -1) + 1 },
    });
    res.status(201).json({ timelineEvent });
  })
);

craftRouter.patch(
  "/timeline/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = timelineSchema.partial().parse(req.body);
    const timelineEvent = await prisma.timelineEvent.update({ where: { id: req.params.id }, data });
    res.json({ timelineEvent });
  })
);

craftRouter.delete(
  "/timeline/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    await prisma.timelineEvent.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---- Notes ----
craftRouter.get(
  "/notes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const notes = await prisma.note.findMany({ where: { bookId: book.id }, orderBy: { createdAt: "desc" } });
    res.json({ notes });
  })
);

const noteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(20000).optional(),
});

craftRouter.post(
  "/notes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = noteSchema.parse(req.body);
    const note = await prisma.note.create({ data: { bookId: book.id, ...data } });
    res.status(201).json({ note });
  })
);

craftRouter.patch(
  "/notes/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    const data = noteSchema.partial().parse(req.body);
    const note = await prisma.note.update({ where: { id: req.params.id }, data });
    res.json({ note });
  })
);

craftRouter.delete(
  "/notes/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await requireOwnedBook(req.params.bookId, req.userId!);
    if (!book) return res.status(404).json({ error: "Book not found" });
    await prisma.note.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
