import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, ComingSoon, Spinner } from "../components/ui";

interface DashboardStats {
  revenue: { totalPurchaseRevenueCents: number; monthlyRecurringRevenueCents: number };
  subscribers: number;
}

export function RevenuePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard").then(setStats);
  }, []);

  if (!stats) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Revenue</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Book sales</p>
          <p className="mt-2 font-display text-3xl font-bold">
            ${(stats.revenue.totalPurchaseRevenueCents / 100).toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Monthly recurring</p>
          <p className="mt-2 font-display text-3xl font-bold">
            ${(stats.revenue.monthlyRecurringRevenueCents / 100).toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Active subscribers</p>
          <p className="mt-2 font-display text-3xl font-bold">{stats.subscribers}</p>
        </Card>
      </div>
      <ComingSoon
        title="Payout & tax tools"
        description="Bank payouts, tax forms, and per-book royalty breakdowns integrate with a real payment processor (e.g. Stripe Connect) in a later milestone. Purchases and subscriptions are tracked today so this can be wired in without a data migration."
      />
    </div>
  );
}
