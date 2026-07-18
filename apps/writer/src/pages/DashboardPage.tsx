import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Card, Spinner } from "../components/ui";

interface DashboardStats {
  books: number;
  drafts: number;
  published: number;
  followers: number;
  subscribers: number;
  unreadNotifications: number;
  revenue: { totalPurchaseRevenueCents: number; monthlyRecurringRevenueCents: number };
}

interface WritingGoal {
  dailyWordTarget: number;
  currentStreak: number;
  longestStreak: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [goal, setGoal] = useState<WritingGoal | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard").then(setStats);
    api.get<{ goal: WritingGoal }>("/goals").then((r) => setGoal(r.goal));
  }, []);

  if (!stats) return <Spinner />;

  const cards = [
    { label: "Books", value: stats.books, to: "/books" },
    { label: "Drafts", value: stats.drafts, to: "/books" },
    { label: "Followers", value: stats.followers, to: "/followers" },
    { label: "Subscribers", value: stats.subscribers, to: "/subscribers" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back, {user?.displayName?.split(" ")[0]}</h1>
        <p className="text-sm text-muted">Here's how your WordVrs universe is doing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="hover:border-primary/50">
              <p className="text-xs uppercase tracking-wide text-muted">{c.label}</p>
              <p className="mt-2 font-display text-3xl font-bold">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Total revenue</p>
          <p className="mt-2 font-display text-3xl font-bold">
            ${(stats.revenue.totalPurchaseRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-muted">
            + ${(stats.revenue.monthlyRecurringRevenueCents / 100).toFixed(2)}/mo from subscribers
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Writing streak</p>
          <p className="mt-2 font-display text-3xl font-bold">{goal?.currentStreak ?? 0} days</p>
          <p className="mt-1 text-xs text-muted">
            Longest streak {goal?.longestStreak ?? 0} days · Goal {goal?.dailyWordTarget ?? 500} words/day
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="font-display font-semibold">Quick actions</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/books" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg">
            + New book
          </Link>
          <Link to="/publishing" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
            Publishing toolkit
          </Link>
          <Link to="/settings" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
            Author profile
          </Link>
        </div>
      </Card>
    </div>
  );
}
