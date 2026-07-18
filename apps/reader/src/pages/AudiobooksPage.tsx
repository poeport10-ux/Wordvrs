import { ComingSoon } from "../components/ui";

export function AudiobooksPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Audiobooks</h1>
      <ComingSoon
        title="Audiobook player"
        description="Streaming and offline audiobook playback is on the roadmap, built on the same library and reading-progress system that already powers ebooks. Authors will be able to produce audiobooks from WordVrs Writer's Publishing toolkit."
      />
    </div>
  );
}
