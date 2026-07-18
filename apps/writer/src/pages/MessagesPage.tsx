import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { Button, Card, EmptyState, Input, Spinner } from "../components/ui";

interface ConversationSummary {
  id: string;
  otherUser: { id: string; username: string; displayName: string };
  lastMessage: { text: string; createdAt: string } | null;
}
interface MessageItem {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[] | null>(null);
  const [toUsername, setToUsername] = useState("");
  const [text, setText] = useState("");

  function loadConversations() {
    api.get<{ conversations: ConversationSummary[] }>("/messages").then((r) => setConversations(r.conversations));
  }
  useEffect(loadConversations, []);

  useEffect(() => {
    if (!activeId) return;
    api.get<{ messages: MessageItem[] }>(`/messages/${activeId}`).then((r) => setMessages(r.messages));
  }, [activeId]);

  async function startConversation(e: FormEvent) {
    e.preventDefault();
    if (!toUsername.trim() || !text.trim()) return;
    await api.post("/messages", { toUsername, text });
    setToUsername("");
    setText("");
    loadConversations();
  }

  if (!conversations) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Messages</h1>
      <Card as="form" onSubmit={startConversation}>
        <h3 className="font-display font-semibold">New message</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="username" value={toUsername} onChange={(e) => setToUsername(e.target.value)} className="sm:w-48" />
          <Input placeholder="Say something…" value={text} onChange={(e) => setText(e.target.value)} className="flex-1" />
          <Button type="submit">Send</Button>
        </div>
      </Card>

      {conversations.length === 0 ? (
        <EmptyState title="No conversations yet" description="Messages from editors, collaborators, and readers show up here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`block w-full rounded-lg border p-3 text-left text-sm ${
                  activeId === c.id ? "border-primary bg-primary/10" : "border-border hover:bg-surface2"
                }`}
              >
                <p className="font-medium">{c.otherUser.displayName}</p>
                <p className="truncate text-xs text-muted">{c.lastMessage?.text ?? "No messages yet"}</p>
              </button>
            ))}
          </div>
          <div className="md:col-span-2">
            {activeId && messages ? (
              <Card className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-lg bg-surface2 p-2 text-sm">
                    {m.text}
                  </div>
                ))}
              </Card>
            ) : (
              <EmptyState title="Select a conversation" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
