'use client'

interface DayRow {
  day: string
  merch_revenue: number | null
  edu_vault_revenue: number | null
}

export default function RevenueChart({ data }: { data: DayRow[] }) {
  const rows = data.map((d) => ({
    day: d.day,
    merch: Number(d.merch_revenue || 0),
    edu: Number(d.edu_vault_revenue || 0),
  }))

  const max = Math.max(1, ...rows.map((r) => r.merch + r.edu))
  const chartHeight = 160
  const barWidth = 18
  const gap = 10

  return (
    <div className="viz-root border rounded-xl p-5">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-secondary: #52514e;
          --muted: #898781;
          --gridline: #e1e0d9;
          --series-1: #2a78d6;
          --series-2: #eb6834;
        }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            color-scheme: dark;
            --surface-1: #1a1a19;
            --text-secondary: #c3c2b7;
            --muted: #898781;
            --gridline: #2c2c2a;
            --series-1: #3987e5;
            --series-2: #d95926;
          }
        }
        :root[data-theme="dark"] .viz-root {
          color-scheme: dark;
          --surface-1: #1a1a19;
          --text-secondary: #c3c2b7;
          --muted: #898781;
          --gridline: #2c2c2a;
          --series-1: #3987e5;
          --series-2: #d95926;
        }
      `}</style>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Revenue by day</p>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--series-1)' }} />
            Merchandise
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--series-2)' }} />
            Edu-Vault
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No paid orders yet.
        </p>
      ) : (
        <svg
          width={rows.length * (barWidth + gap)}
          height={chartHeight + 24}
          className="max-w-full"
        >
          <line
            x1={0}
            y1={chartHeight}
            x2={rows.length * (barWidth + gap)}
            y2={chartHeight}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
          {rows.map((row, i) => {
            const merchHeight = (row.merch / max) * chartHeight
            const eduHeight = (row.edu / max) * chartHeight
            const x = i * (barWidth + gap)
            return (
              <g key={row.day}>
                <title>
                  {new Date(row.day).toLocaleDateString()}: Merch P{row.merch.toFixed(2)}, Edu-Vault P
                  {row.edu.toFixed(2)}
                </title>
                <rect
                  x={x}
                  y={chartHeight - merchHeight}
                  width={barWidth}
                  height={merchHeight}
                  rx={2}
                  fill="var(--series-1)"
                />
                <rect
                  x={x}
                  y={chartHeight - merchHeight - eduHeight - (eduHeight > 0 ? 2 : 0)}
                  width={barWidth}
                  height={eduHeight}
                  rx={2}
                  fill="var(--series-2)"
                />
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
