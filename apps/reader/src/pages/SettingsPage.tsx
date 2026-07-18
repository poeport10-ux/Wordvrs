import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { Button, Card, Input, Textarea } from "../components/ui";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    await api.patch("/users/me", { displayName, bio });
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
          WordVrs Reader respects your system's reduced-motion and text-size preferences automatically.
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
