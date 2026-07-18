import { Link } from "react-router-dom";
import { Button } from "../components/ui";

const FEATURES = [
  ["✍️", "AI writing assistant", "Suggestions that support your voice, never replace it."],
  ["\u{1F4D6}", "Novel, poetry & script modes", "Purpose-built editors for every form."],
  ["\u{1F5C2}️", "Chapter organization", "Drag-and-drop structure, version history, autosave."],
  ["\u{1F30C}", "Publish everywhere", "Ebook, print-on-demand, and audiobook from one draft."],
  ["\u{1F4B0}", "Royalties & analytics", "See what's working and get paid for it."],
  ["\u{1F91D}", "Collaboration", "Bring in editors and beta readers, moderate comments."],
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cosmic bg-bg text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary shadow-glow" />
          <span className="font-display text-lg font-bold">WordVrs Writer</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/register">
            <Button>Start writing</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
          Write, publish, and get paid.
          <br />
          <span className="text-primary">All from one cosmic desk.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          WordVrs Writer is the complete platform for poets, novelists, and storytellers — from first draft to
          royalty check. Publishing a book here makes it instantly available to readers on WordVrs Reader.
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
