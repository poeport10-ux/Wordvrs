import { useAuth } from "../context/AuthContext";
import { Card, ComingSoon } from "../components/ui";

export function MarketingPage() {
  const { user } = useAuth();

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
      <ComingSoon
        title="Marketing toolkit"
        description="Newsletter campaigns, promo codes, cross-promotion with other authors, and merchandise storefronts. Author branding and profile live today; campaign tooling builds on top of the same shared notification system."
      />
    </div>
  );
}
