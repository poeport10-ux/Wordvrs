import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Book } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Badge, Button, Card, Input, Spinner, Textarea } from "../components/ui";

const GENRES = ["Fantasy", "Sci-Fi", "Romance", "Mystery", "Thriller", "Literary Fiction", "Poetry", "Non-Fiction", "Young Adult", "Uncategorized"];

export function BookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<{ book: Book }>(`/books/${bookId}`).then((r) => setBook(r.book));
  }
  useEffect(load, [bookId]);

  async function save(patch: Partial<Book>) {
    if (!book) return;
    setSaving(true);
    try {
      const { book: updated } = await api.patch<{ book: Book }>(`/books/${book.id}`, patch);
      setBook(updated);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!book) return;
    const path = book.status === "PUBLISHED" ? "unpublish" : "publish";
    const { book: updated } = await api.post<{ book: Book }>(`/books/${book.id}/${path}`);
    setBook(updated);
  }

  async function handleDelete() {
    if (!book) return;
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    await api.delete(`/books/${book.id}`);
    navigate("/books");
  }

  if (!book) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{book.title}</h1>
            <Badge tone={book.status === "PUBLISHED" ? "success" : "muted"}>{book.status.toLowerCase()}</Badge>
          </div>
          <p className="text-sm text-muted">
            {book.chapterCount} chapters · {book.wordCount.toLocaleString()} words
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/books/${book.id}/chapters`}>
            <Button variant="secondary">Open chapters</Button>
          </Link>
          <Link to={`/books/${book.id}/craft`}>
            <Button variant="secondary">Characters &amp; world</Button>
          </Link>
          <Button onClick={togglePublish}>{book.status === "PUBLISHED" ? "Unpublish" : "Publish"}</Button>
        </div>
      </div>

      <Card className="space-y-4">
        <h3 className="font-display font-semibold">Book details</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Title</label>
          <Input defaultValue={book.title} onBlur={(e) => save({ title: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Description</label>
          <Textarea rows={4} defaultValue={book.description} onBlur={(e) => save({ description: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Genre</label>
            <select
              defaultValue={book.genre}
              onChange={(e) => save({ genre: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Visibility</label>
            <select
              defaultValue={book.visibility}
              onChange={(e) => save({ visibility: e.target.value as Book["visibility"] })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            >
              <option value="PUBLIC">Public</option>
              <option value="SUBSCRIBERS_ONLY">Subscribers only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>
        {saving && <p className="text-xs text-muted">Saving…</p>}
      </Card>

      <Card className="space-y-4">
        <h3 className="font-display font-semibold">Publishing &amp; monetization</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">ISBN</label>
            <Input defaultValue={book.isbn ?? ""} placeholder="978-0-000-00000-0" onBlur={(e) => save({ isbn: e.target.value || null })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Price (USD, blank = free)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              defaultValue={book.priceCents ? (book.priceCents / 100).toFixed(2) : ""}
              onBlur={(e) => save({ priceCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
            />
          </div>
        </div>
        <p className="text-xs text-muted">
          Cover design, print-on-demand, and audiobook production are managed from the{" "}
          <Link to="/publishing" className="text-primary hover:underline">
            Publishing toolkit
          </Link>
          .
        </p>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-danger">Danger zone</h3>
        <p className="mt-1 text-sm text-muted">Deleting a book removes it and all its chapters permanently.</p>
        <Button variant="danger" className="mt-3" onClick={handleDelete}>
          Delete book
        </Button>
      </Card>
    </div>
  );
}
