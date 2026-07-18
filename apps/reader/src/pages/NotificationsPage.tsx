import { useEffect, useState } from "react";
import type { Notification } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Button, Card, EmptyState, Spinner } from "../components/ui";

const LABELS: Record<string, string> = {
  NEW_FOLLOWER: "started following you",
  NEW_SUBSCRIBER: "subscribed to you",
  NEW_CHAPTER: "New chapter published from an author you follow",
  NEW_COMMENT: "commented on your book",
  NEW_REVIEW: "left a review",
  NEW_MESSAGE: "sent you a message",
  BOOK_PUBLISHED: "published a new book",
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  function load() {
    api.get<{ notifications: Notification[] }>("/notifications").then((r) => setNotifications(r.notifications));
  }
  useEffect(load, []);

  async function markAllRead() {
    await api.post("/notifications/read-all");
    load();
  }

  if (!notifications) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        <Button variant="secondary" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="You're all caught up" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <p className="text-sm">{LABELS[n.type] ?? n.type}</p>
              <p className="mt-1 text-xs text-muted">{new Date(n.createdAt).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
