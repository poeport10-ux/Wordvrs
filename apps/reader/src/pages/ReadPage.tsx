import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Book, Chapter } from "@wordvrs/shared";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Spinner } from "../components/ui";
import { isSpeechSupported, speak, stopSpeaking } from "../lib/speech";

interface ReadingSettings {
  fontSize: "sm" | "md" | "lg" | "xl";
  lineSpacing: "normal" | "relaxed" | "loose";
  dyslexiaFriendly: boolean;
  highContrast: boolean;
}

const SETTINGS_KEY = "wordvrs_reading_settings";
const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: "md",
  lineSpacing: "relaxed",
  dyslexiaFriendly: false,
  highContrast: false,
};

const FONT_SIZE_CLASS: Record<ReadingSettings["fontSize"], string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};
const LINE_SPACING_CLASS: Record<ReadingSettings["lineSpacing"], string> = {
  normal: "leading-normal",
  relaxed: "leading-loose",
  loose: "leading-[2.2]",
};

function loadSettings(): ReadingSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function ReadPage() {
  const { bookId, chapterId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [settings, setSettings] = useState<ReadingSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    api.get<{ book: Book }>(`/books/${bookId}`).then((r) => setBook(r.book));
    api.get<{ chapters: Chapter[] }>(`/books/${bookId}/chapters`).then((r) => setChapters(r.chapters));
  }, [bookId]);

  useEffect(() => {
    api.get<{ chapter: Chapter }>(`/books/${bookId}/chapters/${chapterId}`).then((r) => {
      setChapter(r.chapter);
      if (user) {
        api.put("/library/progress", { bookId, chapterId, progressPercent: 0 }).catch(() => {});
        api.post("/reading-goals/log-reading-session").catch(() => {});
      }
    });
    stopSpeaking();
    setSpeaking(false);
    window.scrollTo(0, 0);
  }, [bookId, chapterId, user]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  if (!chapter || !chapters || !book) return <Spinner />;

  const index = chapters.findIndex((c) => c.id === chapter.id);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;
  const isInteractive = book.mode === "INTERACTIVE" && chapter.choices && chapter.choices.length > 0;

  async function markComplete() {
    if (user) await api.put("/library/progress", { bookId, chapterId: chapter!.id, progressPercent: 100 });
    if (next) navigate(`/read/${bookId}/${next.id}`);
  }

  async function chooseBranch(targetChapterId: string) {
    if (user) await api.put("/library/progress", { bookId, chapterId: chapter!.id, progressPercent: 100 });
    navigate(`/read/${bookId}/${targetChapterId}`);
  }

  function toggleSpeech() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    speak(chapter!.content, () => setSpeaking(false));
    setSpeaking(true);
  }

  return (
    <div
      className={`mx-auto max-w-2xl space-y-6 ${
        settings.highContrast ? "bg-black text-yellow-300 rounded-xl2 p-6 -mx-4 sm:mx-auto" : ""
      }`}
    >
      <div className="flex items-center justify-between text-sm">
        <Link to={`/book/${book.slug}`} className={settings.highContrast ? "text-yellow-300 hover:underline" : "text-muted hover:underline"}>
          ← {book.title}
        </Link>
        <div className="flex items-center gap-3">
          <span className={settings.highContrast ? "text-yellow-300" : "text-muted"}>
            Chapter {index + 1} of {chapters.length}
          </span>
          {isSpeechSupported() && (
            <button onClick={toggleSpeech} className="hover:underline" title="Read aloud">
              {speaking ? "⏹" : "🔊"}
            </button>
          )}
          <button onClick={() => setShowSettings((v) => !v)} className="hover:underline" title="Reading settings">
            Aa
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Font size</span>
            <div className="flex gap-1">
              {(["sm", "md", "lg", "xl"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSettings((v) => ({ ...v, fontSize: s }))}
                  className={`rounded px-2 py-1 text-xs ${settings.fontSize === s ? "bg-secondary text-bg" : "bg-surface2"}`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Line spacing</span>
            <div className="flex gap-1">
              {(["normal", "relaxed", "loose"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSettings((v) => ({ ...v, lineSpacing: s }))}
                  className={`rounded px-2 py-1 text-xs capitalize ${settings.lineSpacing === s ? "bg-secondary text-bg" : "bg-surface2"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between">
            <span>Dyslexia-friendly spacing</span>
            <input
              type="checkbox"
              checked={settings.dyslexiaFriendly}
              onChange={(e) => setSettings((v) => ({ ...v, dyslexiaFriendly: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>High contrast mode</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => setSettings((v) => ({ ...v, highContrast: e.target.checked }))}
            />
          </label>
        </div>
      )}

      <h1 className="font-display text-2xl font-bold">{chapter.title}</h1>

      <div
        className={`reader-content ${FONT_SIZE_CLASS[settings.fontSize]} ${LINE_SPACING_CLASS[settings.lineSpacing]} ${
          settings.dyslexiaFriendly ? "tracking-wide" : ""
        }`}
        style={settings.dyslexiaFriendly ? { wordSpacing: "0.2em" } : undefined}
        dangerouslySetInnerHTML={{ __html: chapter.content }}
      />

      <div className="flex items-center justify-between border-t border-border pt-4">
        {prev ? (
          <Link to={`/read/${bookId}/${prev.id}`}>
            <Button variant="secondary">← Previous</Button>
          </Link>
        ) : (
          <span />
        )}
        {isInteractive ? (
          <div className="flex flex-wrap justify-end gap-2">
            {chapter.choices!.map((choice, i) => (
              <Button key={i} onClick={() => chooseBranch(choice.targetChapterId)}>
                {choice.label}
              </Button>
            ))}
          </div>
        ) : (
          <Button onClick={markComplete}>{next ? "Next chapter →" : "Finish book"}</Button>
        )}
      </div>
    </div>
  );
}
