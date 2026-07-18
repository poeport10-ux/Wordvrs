import { useEffect, useState } from "react";
import type { Book, LibraryItemType } from "@wordvrs/shared";
import { api } from "../lib/api";
import { BookCard } from "../components/BookCard";
import { EmptyState, Spinner } from "../components/ui";

interface LibraryEntry {
  id: string;
  type: LibraryItemType;
  book: Book;
}

const TABS: { key: LibraryItemType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PURCHASED", label: "Purchased" },
  { key: "FREE", label: "Free" },
  { key: "WISHLIST", label: "Wishlist" },
];

export function LibraryPage() {
  const [items, setItems] = useState<LibraryEntry[] | null>(null);
  const [tab, setTab] = useState<LibraryItemType | "ALL">("ALL");

  useEffect(() => {
    api.get<{ items: LibraryEntry[] }>("/library", tab !== "ALL" ? { type: tab } : undefined).then((r) => setItems(r.items));
  }, [tab]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Library</h1>
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.key ? "border-b-2 border-secondary text-secondary" : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="Your library is empty" description="Add books from Discover to read them anytime, even offline." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((i) => (
            <BookCard key={i.id} book={i.book} />
          ))}
        </div>
      )}
    </div>
  );
}
