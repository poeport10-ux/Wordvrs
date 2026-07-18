import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import type { Book, Chapter, Comment, Review } from "@wordvrs/shared";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Spinner, Textarea } from "../components/ui";

export function BookDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    api.get<{ book: Book }>(`/books/slug/${slug}`).then((r) => {
      setBook(r.book);
      api.get<{ chapters: Chapter[] }>(`/books/${r.book.id}/chapters`).then((c) => setChapters(c.chapters));
      api.get<{ reviews: Review[] }>(`/books/${r.book.id}/reviews`).then((rv) => setReviews(rv.reviews));
      api.get<{ comments: Comment[] }>(`/books/${r.book.id}/comments`).then((c) => setComments(c.comments));
      if (r.book.author) {
        api
          .get<{ isFollowing: boolean }>(`/users/${r.book.author.username}`)
          .then((res) => setIsFollowing(res.isFollowing))
          .catch(() => {});
      }
    });
  }, [slug]);

  async function toggleFollow() {
    if (!book?.author) return;
    if (isFollowing) {
      await api.delete(`/users/${book.author.username}/follow`);
    } else {
      await api.post(`/users/${book.author.username}/follow`);
    }
    setIsFollowing(!isFollowing);
  }

  async function addToLibrary() {
    if (!book) return;
    if (book.priceCents) {
      await api.post(`/books/${book.id}/purchase`);
    } else {
      await api.post("/library", { bookId: book.id, type: "FREE" });
    }
    setInLibrary(true);
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!book) return;
    const { review } = await api.post<{ review: Review }>(`/books/${book.id}/reviews`, { rating, text: reviewText });
    setReviews((prev) => [review, ...(prev ?? []).filter((r) => r.userId !== review.userId)]);
    setReviewText("");
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    if (!book || !commentText.trim()) return;
    const { comment } = await api.post<{ comment: Comment }>(`/books/${book.id}/comments`, { text: commentText });
    setComments((prev) => [comment, ...(prev ?? [])]);
    setCommentText("");
  }

  if (!book) return <Spinner />;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="flex aspect-[3/4] items-center justify-center rounded-xl2 bg-cosmic bg-surface2 p-4 text-center shadow-card">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <span className="font-display font-semibold text-muted">{book.title}</span>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">{book.title}</h1>
          {book.author && (
            <Link to={`/author/${book.author.username}`} className="text-sm text-secondary hover:underline">
              by {book.author.displayName}
            </Link>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="muted">{book.genre}</Badge>
            <Badge tone="muted">{book.mode.toLowerCase()}</Badge>
            {book.averageRating && <span className="text-sm text-accent">★ {book.averageRating.toFixed(1)} ({book.reviewCount})</span>}
          </div>
          <p className="mt-4 max-w-2xl text-sm text-muted">{book.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {chapters && chapters.length > 0 && (
              <Link to={`/read/${book.id}/${chapters[0].id}`}>
                <Button>Start reading</Button>
              </Link>
            )}
            <Button variant="secondary" onClick={addToLibrary}>
              {inLibrary ? "In your library ✓" : book.priceCents ? `Buy for $${(book.priceCents / 100).toFixed(2)}` : "Add to library"}
            </Button>
            {user && user.id !== book.authorId && (
              <Button variant={isFollowing ? "secondary" : "primary"} onClick={toggleFollow}>
                {isFollowing ? "Following ✓" : "Follow author"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card>
        <h3 className="font-display font-semibold">Chapters</h3>
        <div className="mt-3 space-y-1">
          {chapters?.map((c, i) => (
            <Link
              key={c.id}
              to={`/read/${book.id}/${c.id}`}
              className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface2"
            >
              <span>
                {i + 1}. {c.title}
              </span>
              <span className="text-xs text-muted">{c.wordCount.toLocaleString()} words</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold">Reviews</h3>
        {user && (
          <form onSubmit={submitReview} className="mt-3 space-y-2">
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
            <Textarea placeholder="Share your thoughts…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <Button type="submit">Post review</Button>
          </form>
        )}
        <div className="mt-4 space-y-3">
          {reviews?.map((r) => (
            <div key={r.id} className="border-t border-border pt-3">
              <p className="text-sm font-medium">{r.user?.displayName} · {"★".repeat(r.rating)}</p>
              <p className="text-sm text-muted">{r.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold">Comments</h3>
        {user && (
          <form onSubmit={submitComment} className="mt-3 flex gap-2">
            <Textarea
              placeholder="Join the discussion…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Post</Button>
          </form>
        )}
        <div className="mt-4 space-y-3">
          {comments?.map((c) => (
            <div key={c.id} className="border-t border-border pt-3">
              <p className="text-sm font-medium">{c.user?.displayName}</p>
              <p className="text-sm text-muted">{c.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
