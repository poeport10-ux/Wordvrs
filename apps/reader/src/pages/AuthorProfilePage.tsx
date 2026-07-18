import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { AuthorPublicProfile, Book } from "@wordvrs/shared";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { BookCard } from "../components/BookCard";
import { Button, EmptyState, Spinner } from "../components/ui";

export function AuthorProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const username = params.username ?? user?.username;

  const [author, setAuthor] = useState<AuthorPublicProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    if (!username) return;
    api.get<{ author: AuthorPublicProfile; isFollowing: boolean }>(`/users/${username}`).then((r) => {
      setAuthor(r.author);
      setIsFollowing(r.isFollowing);
    });
    api.get<{ books: Book[] }>("/books/discover").then((r) => {
      setBooks(r.books.filter((b) => b.author?.username === username));
    });
  }, [username]);

  async function toggleFollow() {
    if (!author) return;
    if (isFollowing) await api.delete(`/users/${author.username}/follow`);
    else await api.post(`/users/${author.username}/follow`);
    setIsFollowing(!isFollowing);
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
