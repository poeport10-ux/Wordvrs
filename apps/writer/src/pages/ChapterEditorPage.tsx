import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Book, Chapter, ChapterChoice } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Badge, Button, Card, Spinner } from "../components/ui";
import { isDictationSupported, startDictation } from "../lib/speech";
import { randomPrompt } from "../lib/prompts";

type SaveState = "idle" | "saving" | "saved";

export function ChapterEditorPage() {
  const { bookId, chapterId } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [dictating, setDictating] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const stopDictationRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing…" })],
    content: "",
    editorProps: { attributes: { class: "prose-editor" } },
    onUpdate: () => scheduleSave(),
  });

  useEffect(() => {
    api.get<{ book: Book }>(`/books/${bookId}`).then((r) => setBook(r.book));
    api.get<{ chapters: Chapter[] }>(`/books/${bookId}/chapters`).then((r) => setChapters(r.chapters));
    api.get<{ chapter: Chapter }>(`/books/${bookId}/chapters/${chapterId}`).then((r) => {
      setChapter(r.chapter);
      setTitle(r.chapter.title);
      editor?.commands.setContent(r.chapter.content || "<p></p>");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, editor]);

  const scheduleSave = useCallback(() => {
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!editor) return;
      const content = editor.getHTML();
      const { chapter: updated } = await api.patch<{ chapter: Chapter }>(`/books/${bookId}/chapters/${chapterId}`, {
        content,
      });
      setChapter(updated);
      setSaveState("saved");
      api.post("/goals/log-writing-session").catch(() => {});
    }, 1200);
  }, [editor, bookId, chapterId]);

  async function saveTitle() {
    const { chapter: updated } = await api.patch<{ chapter: Chapter }>(`/books/${bookId}/chapters/${chapterId}`, {
      title,
    });
    setChapter(updated);
  }

  async function togglePublish() {
    if (!chapter) return;
    const status = chapter.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const { chapter: updated } = await api.patch<{ chapter: Chapter }>(`/books/${bookId}/chapters/${chapterId}`, {
      status,
    });
    setChapter(updated);
  }

  async function saveVersionSnapshot() {
    await api.post(`/books/${bookId}/chapters/${chapterId}/versions`);
    setSaveState("saved");
  }

  function toggleDictation() {
    if (dictating) {
      stopDictationRef.current?.();
      setDictating(false);
      return;
    }
    const stop = startDictation(
      (text) => editor?.chain().focus().insertContent(`${text} `).run(),
      () => setDictating(false)
    );
    if (stop) {
      stopDictationRef.current = stop;
      setDictating(true);
    }
  }

  async function saveChoices(choices: ChapterChoice[] | null) {
    const { chapter: updated } = await api.patch<{ chapter: Chapter }>(`/books/${bookId}/chapters/${chapterId}`, {
      choices,
    });
    setChapter(updated);
  }

  function addChoice() {
    if (!chapter || !chapters) return;
    const otherChapter = chapters.find((c) => c.id !== chapter.id);
    if (!otherChapter) return;
    const next = [...(chapter.choices ?? []), { label: "Go on…", targetChapterId: otherChapter.id }];
    saveChoices(next);
  }

  function updateChoice(index: number, patch: Partial<ChapterChoice>) {
    if (!chapter?.choices) return;
    const next = chapter.choices.map((c, i) => (i === index ? { ...c, ...patch } : c));
    saveChoices(next);
  }

  function removeChoice(index: number) {
    if (!chapter?.choices) return;
    const next = chapter.choices.filter((_, i) => i !== index);
    saveChoices(next.length ? next : null);
  }

  if (!chapter || !book) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link to={`/books/${bookId}/chapters`} className="text-sm text-muted hover:underline">
          ← Back to chapters
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Autosave on"}
          </span>
          <Badge tone={chapter.status === "PUBLISHED" ? "success" : "muted"}>{chapter.status.toLowerCase()}</Badge>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        className="w-full bg-transparent font-display text-3xl font-bold outline-none"
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3 text-xs text-muted">
        <span>{chapter.wordCount.toLocaleString()} words</span>
        <button onClick={saveVersionSnapshot} className="hover:text-primary hover:underline">
          Save version snapshot
        </button>
        {isDictationSupported() && (
          <button onClick={toggleDictation} className={`hover:underline ${dictating ? "text-danger" : "hover:text-primary"}`}>
            {dictating ? "⏹ Stop dictation" : "🎤 Dictate"}
          </button>
        )}
        <button onClick={() => setPrompt(randomPrompt(prompt ?? undefined))} className="hover:text-primary hover:underline">
          💡 Writing prompt
        </button>
        <Button variant="secondary" className="ml-auto px-3 py-1 text-xs" onClick={togglePublish}>
          {chapter.status === "PUBLISHED" ? "Unpublish chapter" : "Publish chapter"}
        </Button>
      </div>

      {prompt && (
        <Card className="bg-cosmic bg-no-repeat text-sm">
          <span className="text-muted">Prompt: </span>
          {prompt}
        </Card>
      )}

      <div className="prose-editor min-h-[60vh] rounded-xl2 border border-border bg-surface p-6 leading-relaxed">
        <EditorContent editor={editor} />
      </div>

      {book.mode === "INTERACTIVE" && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold">Branching choices</h3>
            <Button variant="secondary" className="px-3 py-1 text-xs" onClick={addChoice} disabled={!chapters || chapters.length < 2}>
              + Add choice
            </Button>
          </div>
          <p className="text-xs text-muted">
            Give readers a fork in the story. If no choices are set, this chapter falls back to normal linear order.
          </p>
          {(chapter.choices ?? []).map((choice, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
              <input
                value={choice.label}
                onChange={(e) => updateChoice(i, { label: e.target.value })}
                placeholder="Choice label, e.g. 'Open the door'"
                className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
              />
              <select
                value={choice.targetChapterId}
                onChange={(e) => updateChoice(i, { targetChapterId: e.target.value })}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
              >
                {chapters?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button onClick={() => removeChoice(i)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
