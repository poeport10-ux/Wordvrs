import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, EmptyState, Input, Textarea } from "../components/ui";

type Tab = "characters" | "world" | "timeline" | "notes";

interface CharacterItem {
  id: string;
  name: string;
  role: string | null;
  description: string;
}
interface WorldItem {
  id: string;
  name: string;
  category: string;
  description: string;
}
interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string | null;
}
interface NoteItem {
  id: string;
  title: string;
  content: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "characters", label: "Characters" },
  { key: "world", label: "World-building" },
  { key: "timeline", label: "Timeline" },
  { key: "notes", label: "Notes & research" },
];

export function BookCraftPage() {
  const { bookId } = useParams();
  const [tab, setTab] = useState<Tab>("characters");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Characters &amp; world</h1>
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.key ? "border-b-2 border-primary text-primary" : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "characters" && <CharactersTab bookId={bookId!} />}
      {tab === "world" && <WorldTab bookId={bookId!} />}
      {tab === "timeline" && <TimelineTab bookId={bookId!} />}
      {tab === "notes" && <NotesTab bookId={bookId!} />}
    </div>
  );
}

function CharactersTab({ bookId }: { bookId: string }) {
  const [items, setItems] = useState<CharacterItem[] | null>(null);
  const [form, setForm] = useState({ name: "", role: "", description: "" });

  function load() {
    api.get<{ characters: CharacterItem[] }>(`/books/${bookId}/characters`).then((r) => setItems(r.characters));
  }
  useEffect(load, [bookId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.post(`/books/${bookId}/characters`, form);
    setForm({ name: "", role: "", description: "" });
    load();
  }
  async function remove(id: string) {
    await api.delete(`/books/${bookId}/characters/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <Card as="form" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Role (protagonist, antagonist…)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
        <Textarea
          className="mt-3"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Button type="submit" className="mt-3">
          Add character
        </Button>
      </Card>
      {items?.length === 0 && <EmptyState title="No characters yet" />}
      <div className="grid gap-3 sm:grid-cols-2">
        {items?.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{c.name}</p>
                {c.role && <p className="text-xs text-muted">{c.role}</p>}
              </div>
              <button onClick={() => remove(c.id)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">{c.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WorldTab({ bookId }: { bookId: string }) {
  const [items, setItems] = useState<WorldItem[] | null>(null);
  const [form, setForm] = useState({ name: "", category: "Location", description: "" });

  function load() {
    api.get<{ worldElements: WorldItem[] }>(`/books/${bookId}/world`).then((r) => setItems(r.worldElements));
  }
  useEffect(load, [bookId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.post(`/books/${bookId}/world`, form);
    setForm({ name: "", category: "Location", description: "" });
    load();
  }
  async function remove(id: string) {
    await api.delete(`/books/${bookId}/world/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <Card as="form" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          >
            <option>Location</option>
            <option>Culture</option>
            <option>Magic system</option>
            <option>Technology</option>
            <option>Politics</option>
          </select>
        </div>
        <Textarea
          className="mt-3"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Button type="submit" className="mt-3">
          Add element
        </Button>
      </Card>
      {items?.length === 0 && <EmptyState title="No world-building notes yet" />}
      <div className="grid gap-3 sm:grid-cols-2">
        {items?.map((w) => (
          <Card key={w.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{w.name}</p>
                <p className="text-xs text-muted">{w.category}</p>
              </div>
              <button onClick={() => remove(w.id)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">{w.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TimelineTab({ bookId }: { bookId: string }) {
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [form, setForm] = useState({ title: "", date: "", description: "" });

  function load() {
    api.get<{ timelineEvents: TimelineItem[] }>(`/books/${bookId}/timeline`).then((r) => setItems(r.timelineEvents));
  }
  useEffect(load, [bookId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await api.post(`/books/${bookId}/timeline`, form);
    setForm({ title: "", date: "", description: "" });
    load();
  }
  async function remove(id: string) {
    await api.delete(`/books/${bookId}/timeline/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <Card as="form" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Date / era" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <Textarea
          className="mt-3"
          placeholder="What happens?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Button type="submit" className="mt-3">
          Add event
        </Button>
      </Card>
      {items?.length === 0 && <EmptyState title="No timeline events yet" />}
      <div className="space-y-3">
        {items?.map((t) => (
          <Card key={t.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{t.title}</p>
              {t.date && <p className="text-xs text-muted">{t.date}</p>}
              <p className="mt-1 text-sm text-muted">{t.description}</p>
            </div>
            <button onClick={() => remove(t.id)} className="shrink-0 text-xs text-danger hover:underline">
              Remove
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotesTab({ bookId }: { bookId: string }) {
  const [items, setItems] = useState<NoteItem[] | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });

  function load() {
    api.get<{ notes: NoteItem[] }>(`/books/${bookId}/notes`).then((r) => setItems(r.notes));
  }
  useEffect(load, [bookId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await api.post(`/books/${bookId}/notes`, form);
    setForm({ title: "", content: "" });
    load();
  }
  async function remove(id: string) {
    await api.delete(`/books/${bookId}/notes/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <Card as="form" onSubmit={submit}>
        <Input placeholder="Note title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea
          className="mt-3"
          placeholder="Research, ideas, reminders…"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <Button type="submit" className="mt-3">
          Add note
        </Button>
      </Card>
      {items?.length === 0 && <EmptyState title="No notes yet" />}
      <div className="grid gap-3 sm:grid-cols-2">
        {items?.map((n) => (
          <Card key={n.id}>
            <div className="flex items-start justify-between">
              <p className="font-medium">{n.title}</p>
              <button onClick={() => remove(n.id)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{n.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
