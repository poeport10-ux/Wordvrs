import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeBook, serializePublicAuthor } from "../lib/serialize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const searchRouter = Router();

const bookInclude = { chapters: { select: { wordCount: true } }, reviews: { select: { rating: true } } } as const;

// One shared search endpoint powers both the Writer "find a collaborator" flow
// and the Reader "discover" search bar.
searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json({ books: [], authors: [] });

    const [books, authors] = await Promise.all([
      prisma.book.findMany({
        where: {
          status: "PUBLISHED",
          visibility: { in: ["PUBLIC", "SUBSCRIBERS_ONLY"] },
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { genre: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ],
        },
        include: bookInclude,
        take: 20,
      }),
      prisma.user.findMany({
        where: {
          isAuthor: true,
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 20,
      }),
    ]);

    const authorsWithStats = await Promise.all(
      authors.map(async (a) => {
        const [followerCount, bookCount] = await Promise.all([
          prisma.follow.count({ where: { followingId: a.id } }),
          prisma.book.count({ where: { authorId: a.id, status: "PUBLISHED" } }),
        ]);
        return serializePublicAuthor(a, followerCount, bookCount);
      })
    );

    res.json({ books: books.map((b) => serializeBook(b)), authors: authorsWithStats });
  })
);
