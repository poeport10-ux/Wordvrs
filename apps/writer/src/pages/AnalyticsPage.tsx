import { useEffect, useState } from "react";
import type { Book } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Card, ComingSoon, Spinner } from "../components/ui";

export function AnalyticsPage() {
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    api.get<{ books: Book[] }>("/books/mine").then((r) => setBooks(r.books));
  }, []);

  if (!books) return <Spinner />;

  const totalWords = books.reduce((sum, b) => sum + b.wordCount, 0);
  const totalReviews = books.reduce((sum, b) => sum + b.reviewCount, 0);
  const avgRating = books.filter((b) => b.averageRating != null);
  const overallRating = avgRating.length
    ? avgRating.reduce((sum, b) => sum + (b.averageRating ?? 0), 0) / avgRating.length
    : null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Total words written</p>
          <p className="mt-2 font-display text-3xl font-bold">{totalWords.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Reviews received</p>
          <p className="mt-2 font-display text-3xl font-bold">{totalReviews}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Average rating</p>
          <p className="mt-2 font-display text-3xl font-bold">{overallRating ? overallRating.toFixed(1) : "—"}</p>
        </Card>
      </div>
      <div className="space-y-2">
        {books.map((b) => (
          <Card key={b.id} className="flex items-center justify-between">
            <p className="font-medium">{b.title}</p>
            <p className="text-sm text-muted">
              {b.wordCount.toLocaleString()} words · {b.reviewCount} reviews
              {b.averageRating ? ` · ${b.averageRating.toFixed(1)}★` : ""}
            </p>
          </Card>
        ))}
      </div>
      <ComingSoon
        title="Reader-behavior analytics"
        description="Read-through rates, drop-off points per chapter, and traffic sources will build on the reading-progress data the Reader app already records."
      />
    </div>
  );
}
