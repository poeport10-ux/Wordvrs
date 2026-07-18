import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Book, Chapter } from "@wordvrs/shared";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Spinner } from "../components/ui";

export function ReadPage() {
  const { bookId, chapterId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    api.get<{ book: Book }>(`/books/${bookId}`).then((r) => setBook(r.book));
    api.get<{ chapters: Chapter[] }>(`/books/${bookId}/chapters`).then((r) => setChapters(r.chapters));
  }, [bookId]);

  useEffect(() => {
    api.get<{ chapter: Chapter }>(`/books/${bookId}/chapters/${chapterId}`).then((r) => {
      setChapter(r.chapter);
      if (user) {
        api.put("/library/progress", { bookId, chapterId, progressPercent: 0 }).catch(() => {});
      }
    });
    window.scrollTo(0, 0);
  }, [bookId, chapterId, user]);

  if (!chapter || !chapters || !book) return <Spinner />;

  const index = chapters.findIndex((c) => c.id === chapter.id);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;

  async function markComplete() {
    if (!user) return;
    await api.put("/library/progress", { bookId, chapterId: chapter!.id, progressPercent: 100 });
    if (next) navigate(`/read/${bookId}/${next.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link to={`/book/${book.slug}`} className="text-muted hover:underline">
          ← {book.title}
        </Link>
        <span className="text-muted">
          Chapter {index + 1} of {chapters.length}
        </span>
      </div>

      <h1 className="font-display text-2xl font-bold">{chapter.title}</h1>

      <div className="reader-content" dangerouslySetInnerHTML={{ __html: chapter.content }} />

      <div className="flex items-center justify-between border-t border-border pt-4">
        {prev ? (
          <Link to={`/read/${bookId}/${prev.id}`}>
            <Button variant="secondary">← Previous</Button>
          </Link>
        ) : (
          <span />
        )}
        <Button onClick={markComplete}>{next ? "Next chapter →" : "Finish book"}</Button>
      </div>
    </div>
  );
}
