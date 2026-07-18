import { useEffect, useState } from "react";
import type { Book } from "@wordvrs/shared";
import { api } from "../lib/api";
import { BookCard } from "../components/BookCard";
import { EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    api.get<{ books: Book[] }>("/books/feed").then((r) => setBooks(r.books));
  }, []);

  if (!books) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back, {user?.displayName?.split(" ")[0]}</h1>
        <p className="text-sm text-muted">New from authors you follow, and picks for you.</p>
      </div>
      {books.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Follow some authors or explore Discover to find your next read." />
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
