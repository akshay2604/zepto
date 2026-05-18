interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: string
}

export function KpiCard({ label, value, sub, accent = 'text-violet-600' }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
