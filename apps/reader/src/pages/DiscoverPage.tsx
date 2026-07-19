import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Book, WvEvent } from "@wordvrs/shared";
import { api } from "../lib/api";
import { BookCard } from "../components/BookCard";
import { Badge, Button, Card, EmptyState, Input, Spinner } from "../components/ui";

const GENRES = ["All", "Fantasy", "Sci-Fi", "Romance", "Mystery", "Thriller", "Literary Fiction", "Poetry", "Non-Fiction", "Young Adult"];
type SortOption = "newest" | "trending";

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [events, setEvents] = useState<WvEvent[] | null>(null);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    api
      .get<{ books: Book[] }>("/books/discover", {
        q: q || undefined,
        genre: genre !== "All" ? genre : undefined,
        sort,
      })
      .then((r) => setBooks(r.books));
  }, [q, genre, sort]);

  useEffect(() => {
    api.get<{ events: WvEvent[] }>("/events").then((r) => setEvents(r.events.slice(0, 5)));
  }, []);

  async function rsvp(eventId: string) {
    await api.post(`/events/${eventId}/rsvp`);
    setEvents((prev) => prev?.map((e) => (e.id === eventId ? { ...e, isAttending: true, rsvpCount: e.rsvpCount + 1 } : e)) ?? null);
  }

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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex gap-1 rounded-full bg-surface2 p-1 text-xs">
          {(["newest", "trending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-full px-3 py-1 font-medium capitalize ${sort === s ? "bg-secondary text-bg" : "text-muted"}`}
            >
              {s}
            </button>
          ))}
        </div>
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

      {events && events.length > 0 && (
        <Card className="space-y-3">
          <h3 className="font-display font-semibold">Upcoming author events</h3>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-xs text-muted">
                    {ev.host?.displayName} · {new Date(ev.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="muted">{ev.rsvpCount} going</Badge>
                  <Button variant={ev.isAttending ? "secondary" : "primary"} className="px-3 py-1 text-xs" onClick={() => rsvp(ev.id)} disabled={ev.isAttending}>
                    {ev.isAttending ? "Going ✓" : "RSVP"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
