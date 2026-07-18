import type { Book, User } from "@prisma/client";

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    coverImageUrl: user.coverImageUrl,
    isAuthor: user.isAuthor,
    theme: user.theme,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializePublicAuthor(user: User, followerCount: number, bookCount: number) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    coverImageUrl: user.coverImageUrl,
    followerCount,
    bookCount,
  };
}

export function serializeBook(
  book: Book & { chapters?: { wordCount: number }[]; reviews?: { rating: number }[] },
  extra?: { author?: ReturnType<typeof serializePublicAuthor> }
) {
  const chapterCount = book.chapters?.length ?? 0;
  const wordCount = book.chapters?.reduce((sum, c) => sum + c.wordCount, 0) ?? 0;
  const reviewCount = book.reviews?.length ?? 0;
  const averageRating = reviewCount
    ? book.reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : null;

  return {
    id: book.id,
    authorId: book.authorId,
    author: extra?.author,
    title: book.title,
    slug: book.slug,
    description: book.description,
    coverUrl: book.coverUrl,
    genre: book.genre,
    tags: book.tags,
    mode: book.mode,
    status: book.status,
    visibility: book.visibility,
    isbn: book.isbn,
    priceCents: book.priceCents,
    wordCount,
    chapterCount,
    averageRating,
    reviewCount,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    publishedAt: book.publishedAt?.toISOString() ?? null,
  };
}
