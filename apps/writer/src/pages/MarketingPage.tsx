import { useEffect, useState, type FormEvent } from "react";
import type { WvEvent } from "@wordvrs/shared";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Badge, Button, Card, ComingSoon, EmptyState, Input, Textarea } from "../components/ui";

export function MarketingPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<WvEvent[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "", linkUrl: "" });

  function load() {
    if (!user) return;
    api.get<{ events: WvEvent[] }>("/events", { hostUsername: user.username }).then((r) => setEvents(r.events));
  }
  useEffect(load, [user]);

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt) return;
    await api.post("/events", {
      title: form.title,
      description: form.description,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      linkUrl: form.linkUrl || null,
    });
    setForm({ title: "", description: "", scheduledAt: "", linkUrl: "" });
    setCreating(false);
    load();
  }

  async function removeEvent(id: string) {
    await api.delete(`/events/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Marketing</h1>
      <Card>
        <h3 className="font-display font-semibold">Author profile</h3>
        <p className="mt-1 text-sm text-muted">
          This is what readers see when they visit your profile in WordVrs Reader.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 font-display text-xl font-semibold text-primary">
            {user?.displayName?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user?.displayName}</p>
            <p className="text-sm text-muted">@{user?.username}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">{user?.bio || "Add a bio from Settings to tell readers your story."}</p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold">Events</h3>
            <p className="text-sm text-muted">Q&amp;As, live readings, and virtual book tours. Followers get notified.</p>
          </div>
          <Button variant="secondary" onClick={() => setCreating((v) => !v)}>
            {creating ? "Cancel" : "+ New event"}
          </Button>
        </div>

        {creating && (
          <form onSubmit={createEvent} className="space-y-3 rounded-lg border border-border p-4">
            <Input placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea
              placeholder="What should readers expect?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
              <Input
                placeholder="Link (Zoom, YouTube live, etc.)"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              />
            </div>
            <Button type="submit">Schedule event</Button>
          </form>
        )}

        {events?.length === 0 && <EmptyState title="No upcoming events" description="Schedule a live Q&A or reading to connect with your readers." />}
        <div className="space-y-2">
          {events?.map((ev) => (
            <div key={ev.id} className="flex items-start justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs text-muted">{new Date(ev.scheduledAt).toLocaleString()}</p>
                <p className="mt-1 text-sm text-muted">{ev.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone="muted">{ev.rsvpCount} RSVPs</Badge>
                <button onClick={() => removeEvent(ev.id)} className="text-xs text-danger hover:underline">
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <ComingSoon
        title="Marketing toolkit"
        description="Newsletter campaigns, promo codes, cross-promotion with other authors, and merchandise storefronts. Author branding, profile, and events live today; campaign tooling builds on top of the same shared notification system."
      />
    </div>
  );
}
