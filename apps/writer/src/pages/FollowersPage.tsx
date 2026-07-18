import { useEffect, useState } from "react";
import type { AuthorPublicProfile } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Card, EmptyState, Spinner } from "../components/ui";

export function FollowersPage() {
  const [followers, setFollowers] = useState<AuthorPublicProfile[] | null>(null);

  useEffect(() => {
    api.get<{ followers: AuthorPublicProfile[] }>("/users/me/followers").then((r) => setFollowers(r.followers));
  }, []);

  if (!followers) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Followers</h1>
      {followers.length === 0 ? (
        <EmptyState title="No followers yet" description="Publish a book to start growing your readership." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {followers.map((f) => (
            <Card key={f.id} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-display font-semibold text-primary">
                {f.displayName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{f.displayName}</p>
                <p className="text-xs text-muted">@{f.username}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
