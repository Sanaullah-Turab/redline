'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react'
import type { Driver } from '@/lib/f1'
import { driverMeta, driverName } from './driver-label'

type Props = { driver: Driver; index: number; total: number; disabled: boolean; move: (from: number, to: number) => void; remove: () => void }

export function SortableDriver({ driver, index, total, disabled, move, remove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: driver.id, disabled })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`prediction-row ${isDragging ? 'opacity-60' : ''}`}>
      <span className="position">P{index + 1}</span>
      <button className="drag-handle" disabled={disabled} {...attributes} {...listeners} aria-label={`Drag ${driver.familyName}`}><GripVertical /></button>
      <span className="driver-number">{driver.number}</span>
      <span className="min-w-0 flex-1">
        <b>{driverName(driver)}</b>
        <small>{driverMeta(driver)}</small>
      </span>
      <span className="flex gap-1">
        <button type="button" className="icon-button" disabled={disabled || index === 0} onClick={() => move(index, index - 1)} aria-label="Move up"><ArrowUp /></button>
        <button type="button" className="icon-button" disabled={disabled || index === total - 1} onClick={() => move(index, index + 1)} aria-label="Move down"><ArrowDown /></button>
        <button type="button" className="icon-button" disabled={disabled} onClick={remove} aria-label="Remove driver"><X /></button>
      </span>
    </li>
  )
}
