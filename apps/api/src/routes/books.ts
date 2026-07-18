import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { serializeBook, serializePublicAuthor } from "../lib/serialize.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { uniqueSlug } from "../lib/text.js";
import { notify } from "../lib/notify.js";

export const booksRouter = Router();

const bookInclude = { chapters: { select: { wordCount: true } }, reviews: { select: { rating: true } } } as const;

async function withAuthor(book: Awaited<ReturnType<typeof prisma.book.findFirstOrThrow>> & { chapters: { wordCount: number }[]; reviews: { rating: number }[] }) {
  const author = await prisma.user.findUniqueOrThrow({ where: { id: book.authorId } });
  const [followerCount, bookCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: author.id } }),
    prisma.book.count({ where: { authorId: author.id, status: "PUBLISHED" } }),
  ]);
  return serializeBook(book, { author: serializePublicAuthor(author, followerCount, bookCount) });
}

// ---- Writer: my books (drafts + published) ----
booksRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const books = await prisma.book.findMany({
      where: { authorId: req.userId! },
      include: bookInclude,
      orderBy: { updatedAt: "desc" },
    });
    res.json({ books: books.map((b) => serializeBook(b)) });
  })
);

const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  genre: z.string().max(60).optional(),
  mode: z.enum(["NOVEL", "POETRY", "SCRIPT", "INTERACTIVE"]).optional(),
});

booksRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createBookSchema.parse(req.body);
    const slug = uniqueSlug(data.title, Math.random().toString(36).slice(2, 8));

    const book = await prisma.book.create({
      data: {
        authorId: req.userId!,
        title: data.title,
        description: data.description ?? "",
        genre: data.genre ?? "Uncategorized",
        mode: data.mode ?? "NOVEL",
        slug,
      },
      include: bookInclude,
    });

    await prisma.user.update({ where: { id: req.userId! }, data: { isAuthor: true } });

    res.status(201).json({ book: serializeBook(book) });
  })
);

const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  coverUrl: z.string().url().optional().nullable(),
  genre: z.string().max(60).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  mode: z.enum(["NOVEL", "POETRY", "SCRIPT", "INTERACTIVE"]).optional(),
  visibility: z.enum(["PUBLIC", "SUBSCRIBERS_ONLY", "PRIVATE"]).optional(),
  isbn: z.string().max(20).optional().nullable(),
  priceCents: z.number().int().min(0).max(1_000_000).optional().nullable(),
});

async function loadOwnedBook(bookId: string, authorId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId }, include: bookInclude });
  if (!book || book.authorId !== authorId) return null;
  return book;
}

booksRouter.patch(
  "/:bookId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owned = await loadOwnedBook(req.params.bookId, req.userId!);
    if (!owned) return res.status(404).json({ error: "Book not found" });

    const data = updateBookSchema.parse(req.body);
    const book = await prisma.book.update({ where: { id: owned.id }, data, include: bookInclude });
    res.json({ book: serializeBook(book) });
  })
);

booksRouter.post(
  "/:bookId/publish",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owned = await loadOwnedBook(req.params.bookId, req.userId!);
    if (!owned) return res.status(404).json({ error: "Book not found" });

    const book = await prisma.book.update({
      where: { id: owned.id },
      data: {
        status: "PUBLISHED",
        visibility: owned.visibility === "PRIVATE" ? "PUBLIC" : owned.visibility,
        publishedAt: owned.publishedAt ?? new Date(),
      },
      include: bookInclude,
    });

    const followers = await prisma.follow.findMany({ where: { followingId: req.userId! } });
    await Promise.all(
      followers.map((f) => notify(f.followerId, "BOOK_PUBLISHED", { bookId: book.id, title: book.title }))
    );

    res.json({ book: serializeBook(book) });
  })
);

booksRouter.post(
  "/:bookId/unpublish",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owned = await loadOwnedBook(req.params.bookId, req.userId!);
    if (!owned) return res.status(404).json({ error: "Book not found" });

    const book = await prisma.book.update({
      where: { id: owned.id },
      data: { status: "UNPUBLISHED" },
      include: bookInclude,
    });
    res.json({ book: serializeBook(book) });
  })
);

booksRouter.delete(
  "/:bookId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owned = await loadOwnedBook(req.params.bookId, req.userId!);
    if (!owned) return res.status(404).json({ error: "Book not found" });
    await prisma.book.delete({ where: { id: owned.id } });
    res.status(204).send();
  })
);

// ---- Reader: discover / detail ----
booksRouter.get(
  "/discover",
  asyncHandler(async (req, res) => {
    const { genre, q, sort } = req.query as { genre?: string; q?: string; sort?: string };
    const where: Prisma.BookWhereInput = {
      status: "PUBLISHED",
      visibility: { in: ["PUBLIC", "SUBSCRIBERS_ONLY"] },
      ...(genre ? { genre } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { tags: { has: q } },
            ],
          }
        : {}),
    };

    if (sort === "trending") {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const books = await prisma.book.findMany({
        where,
        include: {
          ...bookInclude,
          purchases: { where: { createdAt: { gte: since } }, select: { id: true } },
        },
        take: 200,
      });
      const ranked = books
        .map((b) => ({ book: b, score: b.purchases.length * 2 + b.reviews.length }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 60)
        .map((r) => r.book);
      const withAuthors = await Promise.all(ranked.map((b) => withAuthor(b)));
      return res.json({ books: withAuthors });
    }

    const books = await prisma.book.findMany({
      where,
      include: bookInclude,
      orderBy: sort === "newest" ? { publishedAt: "desc" } : { updatedAt: "desc" },
      take: 60,
    });
    const withAuthors = await Promise.all(books.map((b) => withAuthor(b)));
    res.json({ books: withAuthors });
  })
);

booksRouter.get(
  "/feed",
  requireAuth,
  asyncHandler(async (req, res) => {
    const following = await prisma.follow.findMany({ where: { followerId: req.userId! } });
    const followingIds = following.map((f) => f.followingId);

    const books = await prisma.book.findMany({
      where: {
        status: "PUBLISHED",
        visibility: { in: ["PUBLIC", "SUBSCRIBERS_ONLY"] },
        ...(followingIds.length ? { authorId: { in: followingIds } } : {}),
      },
      include: bookInclude,
      orderBy: { publishedAt: "desc" },
      take: 30,
    });

    let result = books;
    if (result.length < 10) {
      const more = await prisma.book.findMany({
        where: { status: "PUBLISHED", visibility: { in: ["PUBLIC", "SUBSCRIBERS_ONLY"] } },
        include: bookInclude,
        orderBy: { publishedAt: "desc" },
        take: 30,
      });
      const seen = new Set(result.map((b) => b.id));
      result = [...result, ...more.filter((b) => !seen.has(b.id))];
    }

    const withAuthors = await Promise.all(result.slice(0, 30).map((b) => withAuthor(b)));
    res.json({ books: withAuthors });
  })
);

booksRouter.get(
  "/slug/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const book = await prisma.book.findUnique({ where: { slug: req.params.slug }, include: bookInclude });
    if (!book) return res.status(404).json({ error: "Book not found" });
    if (book.status !== "PUBLISHED" && book.authorId !== req.userId) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ book: await withAuthor(book) });
  })
);

booksRouter.get(
  "/:bookId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const book = await prisma.book.findUnique({ where: { id: req.params.bookId }, include: bookInclude });
    if (!book) return res.status(404).json({ error: "Book not found" });
    if (book.status !== "PUBLISHED" && book.authorId !== req.userId) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ book: await withAuthor(book) });
  })
);
