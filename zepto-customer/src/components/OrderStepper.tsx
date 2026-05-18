import { clsx } from 'clsx'
import type { OrderStatus } from '../types'

const STEPS: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PICKING',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

export function OrderStepper({ status }: { status: OrderStatus }) {
  const activeIdx = STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isDone = idx < activeIdx
        const isActive = idx === activeIdx
        const isLast = idx === STEPS.length - 1

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border-2 transition-all',
                  isDone && 'bg-indigo-600 border-indigo-600 text-white',
                  isActive && 'bg-white border-indigo-600 text-indigo-600',
                  !isDone && !isActive && 'bg-gray-100 border-gray-300 text-gray-400',
                )}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={clsx(
                  'mt-1 text-center text-[10px] leading-tight whitespace-pre-line',
                  isActive ? 'text-indigo-600 font-semibold' : 'text-gray-400',
                )}
              >
                {step.replace(/_/g, '\n')}
              </span>
            </div>
            {!isLast && (
              <div
                className={clsx(
                  'h-0.5 flex-1 mb-5',
                  idx < activeIdx ? 'bg-indigo-600' : 'bg-gray-200',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
