"use client";

import React, { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Edit3,
  Trash2,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { BioLink } from "@/types/bio";
import { renderBioIcon } from "@/components/bio/BioIcons";

// ─── Single sortable link item ────────────────────────────────────────────────
interface SortableLinkItemProps {
  link: BioLink;
  index: number;
  total: number;
  isDragOverlay?: boolean;
  onToggle: (id: string) => void;
  onEdit: (link: BioLink) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
}

function SortableLinkItem({
  link,
  index,
  total,
  isDragOverlay = false,
  onToggle,
  onEdit,
  onDelete,
  onMove,
}: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none",
  };

  const content = (
    <div
      className={`rounded-2xl border transition-all p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        !link.isActive
          ? "opacity-60 bg-zinc-950/40 border-white/5"
          : isDragOverlay
          ? "bg-zinc-800/95 border-accent/50 shadow-2xl scale-[1.02] ring-2 ring-accent/30"
          : "bg-zinc-900/70 border-white/10 hover:border-white/20"
      }`}
    >
      {/* Left: Drag handle + Keyboard arrows + Info */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="flex-shrink-0 p-1.5 rounded-lg text-brand-500 hover:text-brand-200 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          title="Drag to reorder"
          aria-label={`Drag to reorder: ${link.title}`}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Keyboard-accessible arrow fallbacks */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            className="p-0.5 rounded text-brand-500 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
            title="Move up"
            aria-label={`Move ${link.title} up`}
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMove(index, "down")}
            disabled={index === total - 1}
            className="p-0.5 rounded text-brand-500 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
            title="Move down"
            aria-label={`Move ${link.title} down`}
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        {/* Platform icon */}
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent shrink-0">
          {renderBioIcon(link.icon, "w-5 h-5")}
        </div>

        {/* Title + URL */}
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{link.title}</h4>
          <p className="text-xs text-brand-400 font-mono truncate max-w-xs">{link.url}</p>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
        {/* Click counter */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-[11px] font-mono text-brand-300">
          <MousePointerClick className="w-3 h-3 text-accent" />
          <span>{link.clicks || 0}</span>
        </div>

        {/* Active toggle */}
        <button
          onClick={() => onToggle(link.id)}
          className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
            link.isActive ? "bg-emerald-500" : "bg-zinc-700"
          }`}
          title={link.isActive ? "Active — click to disable" : "Disabled — click to enable"}
          aria-label={link.isActive ? `Disable ${link.title}` : `Enable ${link.title}`}
          aria-pressed={link.isActive}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white transition-transform ${
              link.isActive ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(link)}
          className="p-1.5 rounded-lg text-brand-400 hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
          title="Edit link"
          aria-label={`Edit ${link.title}`}
        >
          <Edit3 className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(link.id)}
          className="p-1.5 rounded-lg text-brand-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          title="Delete link"
          aria-label={`Delete ${link.title}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (isDragOverlay) return content;

  return (
    <div ref={setNodeRef} style={style}>
      {content}
    </div>
  );
}

// ─── Sortable list container ───────────────────────────────────────────────────
interface SortableLinkListProps {
  links: BioLink[];
  onReorder: (reorderedLinks: BioLink[]) => void;
  onToggle: (id: string) => void;
  onEdit: (link: BioLink) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
}

export default function SortableLinkList({
  links,
  onReorder,
  onToggle,
  onEdit,
  onDelete,
  onMove,
}: SortableLinkListProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require 8px movement to avoid accidental drags when clicking controls
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(links, oldIndex, newIndex).map((l, idx) => ({
        ...l,
        order: idx,
      }));
      onReorder(reordered);
    },
    [links, onReorder]
  );

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const activeLink = activeId ? links.find((l) => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={links.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="space-y-3"
          role="list"
          aria-label="Links — drag handles or arrows to reorder"
        >
          {links.map((link, idx) => (
            <div key={link.id} role="listitem">
              <SortableLinkItem
                link={link}
                index={idx}
                total={links.length}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
              />
            </div>
          ))}
        </div>
      </SortableContext>

      {/* DragOverlay — ghost card while dragging */}
      <DragOverlay>
        {activeLink ? (
          <SortableLinkItem
            link={activeLink}
            index={0}
            total={links.length}
            isDragOverlay
            onToggle={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onMove={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
