import { clsx } from 'clsx'
import type { MovementType } from '../types'

const MOVEMENT_STYLES: Record<MovementType, string> = {
  INBOUND: 'bg-green-100 text-green-700',
  ORDER_RESERVE: 'bg-blue-100 text-blue-700',
  ORDER_PICK: 'bg-orange-100 text-orange-700',
  ORDER_CANCEL: 'bg-red-100 text-red-700',
  SPOILAGE: 'bg-gray-100 text-gray-600',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-700',
}

export function MovementChip({ type }: { type: MovementType }) {
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', MOVEMENT_STYLES[type])}>
      {type.replace(/_/g, ' ')}
    </span>
  )
}
