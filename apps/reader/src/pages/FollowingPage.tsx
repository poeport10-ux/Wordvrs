import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AuthorPublicProfile } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Card, EmptyState, Spinner } from "../components/ui";

export function FollowingPage() {
  const [authors, setAuthors] = useState<AuthorPublicProfile[] | null>(null);

  useEffect(() => {
    api.get<{ authors: AuthorPublicProfile[] }>("/users/me/following").then((r) => setAuthors(r.authors));
  }, []);

  if (!authors) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Following</h1>
      {authors.length === 0 ? (
        <EmptyState title="You're not following anyone yet" description="Follow authors to see their new releases in your Home feed." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {authors.map((a) => (
            <Link key={a.id} to={`/author/${a.username}`}>
              <Card className="flex items-center gap-3 hover:border-secondary/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 font-display font-semibold text-secondary">
                  {a.displayName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{a.displayName}</p>
                  <p className="text-xs text-muted">{a.bookCount} books · {a.followerCount} followers</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
