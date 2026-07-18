import { Link } from "react-router-dom";
import type { Book } from "@wordvrs/shared";
import { Badge } from "./ui";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link
      to={`/book/${book.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl2 border border-border bg-surface shadow-card transition hover:border-secondary/50"
    >
      <div className="flex aspect-[3/4] items-center justify-center bg-cosmic bg-surface2 p-4 text-center">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm font-semibold text-muted">{book.title}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 font-display text-sm font-semibold group-hover:text-secondary">{book.title}</p>
        <p className="text-xs text-muted">{book.author?.displayName}</p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Badge tone="muted">{book.genre}</Badge>
          {book.averageRating ? <span className="text-xs text-accent">★ {book.averageRating.toFixed(1)}</span> : null}
          {!book.priceCents && <Badge tone="success">Free</Badge>}
        </div>
      </div>
    </Link>
  );
}
