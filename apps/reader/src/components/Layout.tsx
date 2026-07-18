import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV = [
  { to: "/home", label: "Home", icon: "\u{1F30C}" },
  { to: "/library", label: "Library", icon: "\u{1F4DA}" },
  { to: "/discover", label: "Discover", icon: "\u{1F9ED}" },
  { to: "/audiobooks", label: "Audiobooks", icon: "\u{1F3A7}" },
  { to: "/following", label: "Following", icon: "\u{1F465}" },
  { to: "/notifications", label: "Notifications", icon: "\u{1F514}" },
  { to: "/profile", label: "Profile", icon: "\u{1F464}" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-full bg-secondary shadow-glow" />
          <span className="font-display text-lg font-bold">WordVrs Reader</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-secondary/15 text-secondary" : "text-muted hover:bg-surface2 hover:text-text"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20 font-display text-sm font-semibold text-secondary">
            {user?.displayName?.[0]?.toUpperCase() ?? "R"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.displayName}</p>
            <p className="truncate text-xs text-muted">@{user?.username}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={toggleTheme} className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted hover:bg-surface2">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted hover:bg-surface2"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <form onSubmit={handleSearch} className="mb-6 md:hidden">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, authors…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </form>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
