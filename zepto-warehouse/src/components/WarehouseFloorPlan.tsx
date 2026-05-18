import { Zone, ZoneType } from '../types'

const CANVAS_W = 800
const CANVAS_H = 480

const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string; badge: string; text: string }> = {
  PRODUCE: { fill: '#dcfce7', stroke: '#16a34a', badge: '#16a34a', text: '#14532d' },
  CHILLED: { fill: '#cffafe', stroke: '#0891b2', badge: '#0891b2', text: '#164e63' },
  FROZEN:  { fill: '#e0e7ff', stroke: '#4f46e5', badge: '#4f46e5', text: '#1e1b4b' },
  AMBIENT: { fill: '#fef9c3', stroke: '#ca8a04', badge: '#ca8a04', text: '#713f12' },
}

interface Props {
  zones: Zone[]
  hoveredZone?: ZoneType | null
  onZoneHover?: (zone: ZoneType | null) => void
  onZoneClick?: (zone: ZoneType) => void
}

export function WarehouseFloorPlan({ zones, hoveredZone, onZoneHover, onZoneClick }: Props) {
  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className="w-full rounded-xl border border-gray-200 bg-gray-50"
      style={{ maxHeight: 480 }}
    >
      {/* outer border */}
      <rect x={1} y={1} width={CANVAS_W - 2} height={CANVAS_H - 2}
            fill="none" stroke="#e5e7eb" strokeWidth={2} rx={12} />

      {zones.map(zone => {
        const px = zone.x * CANVAS_W
        const py = zone.y * CANVAS_H
        const pw = zone.w * CANVAS_W
        const ph = zone.h * CANVAS_H
        const cx = px + pw / 2
        const cy = py + ph / 2
        const colors = ZONE_COLORS[zone.zoneType]
        const isHovered = hoveredZone === zone.zoneType

        return (
          <g
            key={zone.id}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onZoneHover?.(zone.zoneType)}
            onMouseLeave={() => onZoneHover?.(null)}
            onClick={() => onZoneClick?.(zone.zoneType)}
          >
            <rect
              x={px + 4} y={py + 4} width={pw - 8} height={ph - 8}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={isHovered ? 3 : 1.5}
              rx={8}
              opacity={isHovered ? 1 : 0.85}
            />

            {/* zone label */}
            <text
              x={cx} y={cy - (zone.orderCount > 0 ? 18 : 0)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={pw < 160 ? 13 : 16} fontWeight="600"
              fill={colors.text} style={{ userSelect: 'none' }}
            >
              {zone.name}
            </text>

            {/* order count badge */}
            {zone.orderCount > 0 && (
              <>
                <rect
                  x={cx - 22} y={cy + 4} width={44} height={22}
                  fill={colors.badge} rx={11}
                >
                  {zone.orderCount > 0 && (
                    <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
                  )}
                </rect>
                <text
                  x={cx} y={cy + 15}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={12} fontWeight="700" fill="white"
                  style={{ userSelect: 'none' }}
                >
                  {zone.orderCount} order{zone.orderCount !== 1 ? 's' : ''}
                </text>
              </>
            )}
          </g>
        )
      })}

      {/* entrance label */}
      <text x={CANVAS_W / 2} y={CANVAS_H - 8} textAnchor="middle"
            fontSize={11} fill="#9ca3af" style={{ userSelect: 'none' }}>
        ▲ ENTRANCE / PACKING STATION
      </text>
    </svg>
  )
}
