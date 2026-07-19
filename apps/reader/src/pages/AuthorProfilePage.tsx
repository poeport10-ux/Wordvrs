import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { AuthorPublicProfile, Book, WvEvent } from "@wordvrs/shared";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { BookCard } from "../components/BookCard";
import { Badge, Button, Card, EmptyState, Spinner } from "../components/ui";

export function AuthorProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const username = params.username ?? user?.username;

  const [author, setAuthor] = useState<AuthorPublicProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [events, setEvents] = useState<WvEvent[] | null>(null);

  useEffect(() => {
    if (!username) return;
    api.get<{ author: AuthorPublicProfile; isFollowing: boolean }>(`/users/${username}`).then((r) => {
      setAuthor(r.author);
      setIsFollowing(r.isFollowing);
    });
    api.get<{ books: Book[] }>("/books/discover").then((r) => {
      setBooks(r.books.filter((b) => b.author?.username === username));
    });
    api.get<{ events: WvEvent[] }>("/events", { hostUsername: username }).then((r) => setEvents(r.events));
  }, [username]);

  async function toggleFollow() {
    if (!author) return;
    if (isFollowing) await api.delete(`/users/${author.username}/follow`);
    else await api.post(`/users/${author.username}/follow`);
    setIsFollowing(!isFollowing);
  }

  async function rsvp(eventId: string) {
    await api.post(`/events/${eventId}/rsvp`);
    setEvents((prev) => prev?.map((e) => (e.id === eventId ? { ...e, isAttending: true, rsvpCount: e.rsvpCount + 1 } : e)) ?? null);
  }

  if (!author) return <Spinner />;

  const isSelf = user?.username === author.username;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 font-display text-2xl font-semibold text-secondary">
          {author.displayName[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{author.displayName}</h1>
          <p className="text-sm text-muted">
            @{author.username} · {author.bookCount} books · {author.followerCount} followers
          </p>
        </div>
        {!isSelf && (
          <Button variant={isFollowing ? "secondary" : "primary"} onClick={toggleFollow}>
            {isFollowing ? "Following ✓" : "Follow"}
          </Button>
        )}
      </div>
      {author.bio && <p className="max-w-2xl text-sm text-muted">{author.bio}</p>}

      {events && events.length > 0 && (
        <Card className="space-y-2">
          <h3 className="font-display font-semibold">Upcoming events</h3>
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs text-muted">{new Date(ev.scheduledAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="muted">{ev.rsvpCount} going</Badge>
                <Button variant={ev.isAttending ? "secondary" : "primary"} className="px-3 py-1 text-xs" onClick={() => rsvp(ev.id)} disabled={ev.isAttending}>
                  {ev.isAttending ? "Going ✓" : "RSVP"}
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <h2 className="font-display text-lg font-semibold">Published books</h2>
      {!books ? (
        <Spinner />
      ) : books.length === 0 ? (
        <EmptyState title="No published books yet" />
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
