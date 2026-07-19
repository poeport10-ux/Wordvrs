// Domain types shared between the Writer app, Reader app, and the API.
// These mirror the Prisma models in apps/api/prisma/schema.prisma.

export type BookMode = "NOVEL" | "POETRY" | "SCRIPT" | "INTERACTIVE";
export type BookStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
export type BookVisibility = "PUBLIC" | "SUBSCRIBERS_ONLY" | "PRIVATE";
export type ChapterStatus = "DRAFT" | "PUBLISHED";
export type LibraryItemType = "PURCHASED" | "FREE" | "WISHLIST";
export type NotificationType =
  | "NEW_FOLLOWER"
  | "NEW_SUBSCRIBER"
  | "NEW_CHAPTER"
  | "NEW_COMMENT"
  | "NEW_REVIEW"
  | "NEW_MESSAGE"
  | "BOOK_PUBLISHED"
  | "NEW_EVENT";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  isAuthor: boolean;
  theme: "LIGHT" | "DARK" | "SYSTEM";
  createdAt: string;
}

export interface AuthorPublicProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  followerCount: number;
  bookCount: number;
}

export interface Book {
  id: string;
  authorId: string;
  author?: AuthorPublicProfile;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  genre: string;
  tags: string[];
  mode: BookMode;
  status: BookStatus;
  visibility: BookVisibility;
  isbn: string | null;
  priceCents: number | null;
  wordCount: number;
  chapterCount: number;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ChapterChoice {
  label: string;
  targetChapterId: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  status: ChapterStatus;
  // Only meaningful for Book.mode === "INTERACTIVE": branching choices to other chapters.
  choices: ChapterChoice[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  bookId: string;
  name: string;
  role: string | null;
  description: string;
  imageUrl: string | null;
}

export interface WorldElement {
  id: string;
  bookId: string;
  name: string;
  category: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  bookId: string;
  title: string;
  description: string;
  date: string | null;
  order: number;
}

export interface Note {
  id: string;
  bookId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  user?: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  rating: number;
  text: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  bookId: string;
  chapterId: string | null;
  userId: string;
  user?: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  parentId: string | null;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface LibraryItem {
  id: string;
  userId: string;
  bookId: string;
  book?: Book;
  type: LibraryItemType;
  addedAt: string;
}

export interface ReadingProgress {
  userId: string;
  bookId: string;
  chapterId: string;
  progressPercent: number;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

export interface ReadingGoal {
  id: string;
  userId: string;
  dailyMinutesTarget: number;
  currentStreak: number;
  longestStreak: number;
  lastReadingDate: string | null;
  updatedAt: string;
}

export interface WvEvent {
  id: string;
  hostId: string;
  host?: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  bookId: string | null;
  title: string;
  description: string;
  scheduledAt: string;
  linkUrl: string | null;
  rsvpCount: number;
  isAttending?: boolean;
  createdAt: string;
}
