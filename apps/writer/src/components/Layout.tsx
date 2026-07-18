import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: "✨" },
  { to: "/books", label: "Books", icon: "\u{1F4DA}" },
  { to: "/revenue", label: "Revenue", icon: "\u{1F4B0}" },
  { to: "/analytics", label: "Analytics", icon: "\u{1F4C8}" },
  { to: "/followers", label: "Followers", icon: "\u{1F465}" },
  { to: "/subscribers", label: "Subscribers", icon: "⭐" },
  { to: "/messages", label: "Messages", icon: "✉️" },
  { to: "/publishing", label: "Publishing", icon: "\u{1F680}" },
  { to: "/marketing", label: "Marketing", icon: "\u{1F4E3}" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-full bg-cosmic bg-primary shadow-glow" />
          <span className="font-display text-lg font-bold">WordVrs Writer</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface2 hover:text-text"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-display text-sm font-semibold text-primary">
            {user?.displayName?.[0]?.toUpperCase() ?? "W"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.displayName}</p>
            <p className="truncate text-xs text-muted">@{user?.username}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted hover:bg-surface2"
          >
            {theme === "dark" ? "☀️ Light" : "\u{1F319} Dark"}
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
