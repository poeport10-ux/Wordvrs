import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Book } from "@wordvrs/shared";
import { api } from "../lib/api";
import { BookCard } from "../components/BookCard";
import { EmptyState, Input, Spinner } from "../components/ui";

const GENRES = ["All", "Fantasy", "Sci-Fi", "Romance", "Mystery", "Thriller", "Literary Fiction", "Poetry", "Non-Fiction", "Young Adult"];

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [genre, setGenre] = useState("All");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    api
      .get<{ books: Book[] }>("/books/discover", {
        q: q || undefined,
        genre: genre !== "All" ? genre : undefined,
        sort: "newest",
      })
      .then((r) => setBooks(r.books));
  }, [q, genre]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Discover</h1>
      <Input
        placeholder="Search titles, genres, tags…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setSearchParams(e.target.value ? { q: e.target.value } : {});
        }}
      />
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              genre === g ? "bg-secondary text-bg" : "bg-surface2 text-muted hover:text-text"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {!books ? (
        <Spinner />
      ) : books.length === 0 ? (
        <EmptyState title="No books found" description="Try a different search or genre." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
