import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, EmptyState, Spinner } from "../components/ui";

interface SubscriberEntry {
  id: string;
  tier: string;
  priceCents: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string };
}

export function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberEntry[] | null>(null);

  useEffect(() => {
    api.get<{ subscribers: SubscriberEntry[] }>("/users/me/subscribers").then((r) => setSubscribers(r.subscribers));
  }, []);

  if (!subscribers) return <Spinner />;

  const mrr = subscribers.reduce((sum, s) => sum + s.priceCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Subscribers</h1>
        <p className="text-sm text-muted">
          {subscribers.length} paying supporters · ${(mrr / 100).toFixed(2)}/mo
        </p>
      </div>
      {subscribers.length === 0 ? (
        <EmptyState title="No subscribers yet" description="Offer a membership tier to earn recurring support." />
      ) : (
        <div className="space-y-2">
          {subscribers.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{s.user.displayName}</p>
                <p className="text-xs text-muted">@{s.user.username} · {s.tier}</p>
              </div>
              <p className="font-display font-semibold">${(s.priceCents / 100).toFixed(2)}/mo</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
