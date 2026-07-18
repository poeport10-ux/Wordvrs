import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Book } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Badge, Button, Card, EmptyState, Input, Spinner } from "../components/ui";

export function BooksPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"NOVEL" | "POETRY" | "SCRIPT">("NOVEL");
  const navigate = useNavigate();

  function load() {
    api.get<{ books: Book[] }>("/books/mine").then((r) => setBooks(r.books));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { book } = await api.post<{ book: Book }>("/books", { title, mode });
    setTitle("");
    setCreating(false);
    navigate(`/books/${book.id}`);
  }

  if (!books) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Books</h1>
          <p className="text-sm text-muted">All your novels, poetry collections, and scripts.</p>
        </div>
        <Button onClick={() => setCreating((v) => !v)}>{creating ? "Cancel" : "+ New book"}</Button>
      </div>

      {creating && (
        <Card>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Nebula Heir" autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
              >
                <option value="NOVEL">Novel</option>
                <option value="POETRY">Poetry</option>
                <option value="SCRIPT">Script</option>
              </select>
            </div>
            <Button type="submit">Create</Button>
          </form>
        </Card>
      )}

      {books.length === 0 ? (
        <EmptyState title="No books yet" description="Start your first novel, poetry collection, or script." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card
              key={book.id}
              className="cursor-pointer hover:border-primary/50"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-semibold">{book.title}</h3>
                <Badge tone={book.status === "PUBLISHED" ? "success" : "muted"}>{book.status.toLowerCase()}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{book.genre} · {book.mode.toLowerCase()}</p>
              <p className="mt-3 text-xs text-muted">
                {book.chapterCount} chapters · {book.wordCount.toLocaleString()} words
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
