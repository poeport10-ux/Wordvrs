import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Book, Chapter } from "@wordvrs/shared";
import { api } from "../lib/api";
import { Badge, Button, Card, EmptyState, Input, Spinner } from "../components/ui";

function SortableChapter({ chapter, bookId, onDelete }: { chapter: Chapter; bookId: string; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <button {...attributes} {...listeners} className="cursor-grab text-muted" aria-label="Drag to reorder">
        ⠿
      </button>
      <Link to={`/books/${bookId}/chapters/${chapter.id}`} className="flex-1 min-w-0">
        <p className="truncate font-medium">{chapter.title}</p>
        <p className="text-xs text-muted">{chapter.wordCount.toLocaleString()} words</p>
      </Link>
      <Badge tone={chapter.status === "PUBLISHED" ? "success" : "muted"}>{chapter.status.toLowerCase()}</Badge>
      <button onClick={() => onDelete(chapter.id)} className="text-xs text-danger hover:underline">
        Delete
      </button>
    </div>
  );
}

export function ChaptersPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function load() {
    api.get<{ book: Book }>(`/books/${bookId}`).then((r) => setBook(r.book));
    api.get<{ chapters: Chapter[] }>(`/books/${bookId}/chapters`).then((r) => setChapters(r.chapters));
  }
  useEffect(load, [bookId]);

  async function addChapter() {
    if (!newTitle.trim()) return;
    const { chapter } = await api.post<{ chapter: Chapter }>(`/books/${bookId}/chapters`, { title: newTitle });
    setChapters((prev) => [...(prev ?? []), chapter]);
    setNewTitle("");
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm("Delete this chapter?")) return;
    await api.delete(`/books/${bookId}/chapters/${chapterId}`);
    setChapters((prev) => prev?.filter((c) => c.id !== chapterId) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !chapters) return;
    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex);
    setChapters(reordered);
    await api.post(`/books/${bookId}/chapters/reorder`, { chapterIds: reordered.map((c) => c.id) });
  }

  if (!chapters || !book) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{book.title}</h1>
        <p className="text-sm text-muted">Drag to reorder chapters.</p>
      </div>

      <Card>
        <div className="flex gap-2">
          <Input
            placeholder="New chapter title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addChapter()}
          />
          <Button onClick={addChapter}>Add chapter</Button>
        </div>
      </Card>

      {chapters.length === 0 ? (
        <EmptyState title="No chapters yet" description="Add your first chapter to start writing." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <SortableChapter key={chapter.id} chapter={chapter} bookId={bookId!} onDelete={deleteChapter} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
