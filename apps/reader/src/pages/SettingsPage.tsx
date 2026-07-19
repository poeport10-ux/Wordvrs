import { useEffect, useState } from "react";
import type { LibraryItemType, ReadingGoal } from "@wordvrs/shared";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { Badge, Button, Card, Input, Textarea } from "../components/ui";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saved, setSaved] = useState(false);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [libraryCount, setLibraryCount] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ goal: ReadingGoal }>("/reading-goals").then((r) => setGoal(r.goal));
    api.get<{ items: { type: LibraryItemType }[] }>("/library").then((r) => setLibraryCount(r.items.length));
  }, []);

  async function save() {
    await api.patch("/users/me", { displayName, bio });
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function updateDailyTarget(dailyMinutesTarget: number) {
    const { goal: updated } = await api.patch<{ goal: ReadingGoal }>("/reading-goals", { dailyMinutesTarget });
    setGoal(updated);
  }

  const badges = [
    { label: "First book in library", earned: (libraryCount ?? 0) >= 1 },
    { label: "Bookworm (10 books)", earned: (libraryCount ?? 0) >= 10 },
    { label: "7-day reading streak", earned: (goal?.currentStreak ?? 0) >= 7 },
    { label: "30-day reading streak", earned: (goal?.currentStreak ?? 0) >= 30 },
  ].filter((b) => b.earned);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Card className="space-y-4">
        <h3 className="font-display font-semibold">Profile</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Display name</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Bio</label>
          <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <Button onClick={save}>{saved ? "Saved ✓" : "Save changes"}</Button>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-display font-semibold">Reading goal</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-bold">{goal?.currentStreak ?? 0} days</p>
            <p className="text-xs text-muted">Longest streak {goal?.longestStreak ?? 0} days</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Daily target (minutes)</label>
            <Input
              type="number"
              min={5}
              max={600}
              defaultValue={goal?.dailyMinutesTarget ?? 20}
              onBlur={(e) => updateDailyTarget(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {badges.map((b) => (
              <Badge key={b.label} tone="accent">
                🏆 {b.label}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-display font-semibold">Appearance &amp; accessibility</h3>
        <div className="flex gap-2">
          <Button variant={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>
            ☀️ Light
          </Button>
          <Button variant={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>
            🌙 Dark
          </Button>
        </div>
        <p className="text-xs text-muted">
          Font size, line spacing, dyslexia-friendly spacing, high contrast, and read-aloud are available from any
          chapter's "Aa" menu while reading.
        </p>
      </Card>

      <Card className="space-y-2">
        <h3 className="font-display font-semibold">Account</h3>
        <p className="text-sm text-muted">Email: {user?.email}</p>
        <p className="text-sm text-muted">Username: @{user?.username}</p>
        <p className="text-xs text-muted">
          Your WordVrs account is shared with the Writer app — no separate sign-up needed.
        </p>
      </Card>
    </div>
  );
}
