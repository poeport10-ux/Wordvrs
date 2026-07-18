import { Link } from "react-router-dom";
import { Button } from "../components/ui";

const FEATURES = [
  ["\u{1F4D6}", "Ebook reader", "A fast, distraction-free reading experience with highlights and bookmarks."],
  ["\u{1F3A7}", "Audiobook player", "Listen on the go, pick up exactly where you left off."],
  ["\u{1F9ED}", "Powerful discovery", "Personalized recommendations across every genre."],
  ["\u{1F4B0}", "Support authors directly", "Buy books or subscribe to your favorite writers."],
  ["\u{1F465}", "Community", "Reviews, comments, book clubs, and live author events."],
  ["\u{1F4F1}", "Read anywhere", "Offline downloads, dark mode, accessibility built in."],
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cosmic bg-bg text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary shadow-glow" />
          <span className="font-display text-lg font-bold">WordVrs Reader</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/register">
            <Button>Start reading</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
          Discover your next
          <br />
          <span className="text-secondary">favorite story.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          WordVrs Reader is the best place to discover, read, listen to, and support independent authors — with an
          account shared across the whole WordVrs universe.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register">
            <Button className="px-6 py-3 text-base">Create your account</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([icon, title, desc]) => (
          <div key={title} className="rounded-xl2 border border-border bg-surface/80 p-6 shadow-card">
            <div className="text-2xl">{icon}</div>
            <h3 className="mt-3 font-display font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
