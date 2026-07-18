import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Chapter } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Badge, Button, Spinner } from "../components/ui";

type SaveState = "idle" | "saving" | "saved";

export function ChapterEditorPage() {
  const { bookId, chapterId } = useParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing…" })],
    content: "",
    editorProps: { attributes: { class: "prose-editor" } },
    onUpdate: () => scheduleSave(),
  });

  useEffect(() => {
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

  if (!chapter) return <Spinner />;

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

      <div className="flex items-center gap-3 border-b border-border pb-3 text-xs text-muted">
        <span>{chapter.wordCount.toLocaleString()} words</span>
        <button onClick={saveVersionSnapshot} className="hover:text-primary hover:underline">
          Save version snapshot
        </button>
        <Button variant="secondary" className="ml-auto px-3 py-1 text-xs" onClick={togglePublish}>
          {chapter.status === "PUBLISHED" ? "Unpublish chapter" : "Publish chapter"}
        </Button>
      </div>

      <div className="prose-editor min-h-[60vh] rounded-xl2 border border-border bg-surface p-6 leading-relaxed">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
