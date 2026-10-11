"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDownIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/admin/ui/button";
import { cn } from "@/lib/utils";

/**
 * Drag-to-reorder list of items. Items are identified by a stable `_key` the parent assigns
 * (not by index), so reordering never remounts the editors inside.
 */
export type Keyed<T> = T & { _key: string };

let counter = 0;
export function newKey(): string {
  counter += 1;
  return `k${Date.now().toString(36)}${counter}`;
}

function SortableRow({
  id,
  title,
  index,
  open,
  onToggle,
  onRemove,
  children,
  collapsible,
}: {
  id: string;
  title: string;
  index: number;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  children: ReactNode;
  collapsible: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className={cn("frame", isDragging && "z-10 shadow-ambient")}>
      <div className="frame-inner bg-surface">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="flex size-8 cursor-grab touch-none items-center justify-center rounded-full text-ink-muted hover:bg-paper-2 active:cursor-grabbing"
          >
            <GripVerticalIcon size={16} strokeWidth={1.5} />
          </button>
          {collapsible ? (
            <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open}>
              <span className="font-mono text-[11px] text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
              <span className="truncate text-sm font-medium text-ink">{title}</span>
              <ChevronDownIcon size={14} strokeWidth={1.5} className={cn("ml-auto shrink-0 text-ink-muted transition-transform duration-500 ease-out-expo", open && "rotate-180")} />
            </button>
          ) : (
            <span className="font-mono text-[11px] text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
          )}
          <button type="button" onClick={onRemove} aria-label="Remove item" className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-accent/10 hover:text-accent-text">
            <Trash2Icon size={15} strokeWidth={1.5} />
          </button>
        </div>
        <div className={cn("px-3 pb-3", collapsible && !open && "hidden")}>{children}</div>
      </div>
    </li>
  );
}

export function Repeatable<T extends object>({
  items,
  onChange,
  renderItem,
  itemTitle,
  create,
  addLabel = "Add item",
  max,
  collapsible = true,
  sortable = true,
}: {
  items: Keyed<T>[];
  onChange: (items: Keyed<T>[]) => void;
  renderItem: (item: Keyed<T>, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  itemTitle: (item: Keyed<T>, index: number) => string;
  create: () => T;
  addLabel?: string;
  max?: number;
  collapsible?: boolean;
  sortable?: boolean;
}) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(items.length <= 3 ? items.map((i) => i._key) : []));
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i._key === active.id);
    const to = items.findIndex((i) => i._key === over.id);
    onChange(arrayMove(items, from, to));
  };

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const add = () => {
    const item = { ...create(), _key: newKey() } as Keyed<T>;
    onChange([...items, item]);
    setOpenKeys((prev) => new Set(prev).add(item._key));
  };

  const list = (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <SortableRow
          key={item._key}
          id={item._key}
          index={index}
          title={itemTitle(item, index) || `Item ${index + 1}`}
          open={!collapsible || openKeys.has(item._key)}
          onToggle={() => toggle(item._key)}
          onRemove={() => onChange(items.filter((i) => i._key !== item._key))}
          collapsible={collapsible}
        >
          {renderItem(item, (patch) => onChange(items.map((i) => (i._key === item._key ? { ...i, ...patch } : i))), index)}
        </SortableRow>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="rounded-2xl bg-paper-2 px-4 py-5 text-center text-sm text-ink-muted">Nothing here yet.</p>
      ) : sortable ? (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i._key)} strategy={verticalListSortingStrategy}>
            {list}
          </SortableContext>
        </DndContext>
      ) : (
        list
      )}
      <div>
        <Button size="sm" onClick={add} disabled={max !== undefined && items.length >= max} leading={<PlusIcon size={14} strokeWidth={1.5} />}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
