'use client'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import type { Driver } from '@/lib/f1'
import { SortableDriver } from './sortable-driver'

type Props = { selected: string[]; lookup: (id: string) => Driver; onChange: (next: string[]) => void; disabled: boolean }

export function DriverOrderList({ selected, lookup, onChange, disabled }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  if (selected.length === 0) {
    return <div className="empty-grid"><GripVertical /><p>Select drivers from the entry list to start your order.</p></div>
  }

  function dragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return
    const from = selected.indexOf(String(event.active.id))
    const to = selected.indexOf(String(event.over.id))
    if (from >= 0 && to >= 0) onChange(arrayMove(selected, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
      <SortableContext items={selected} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2">
          {selected.map((id, index) => (
            <SortableDriver
              key={id}
              driver={lookup(id)}
              index={index}
              total={selected.length}
              disabled={disabled}
              move={(from, to) => onChange(arrayMove(selected, from, to))}
              remove={() => onChange(selected.filter((pick) => pick !== id))}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
