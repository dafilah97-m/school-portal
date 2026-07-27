import type { CareerPath } from '@/lib/landing-content'

export default function CareerPathCard({ path }: { path: CareerPath }) {
  return (
    <div className="border border-border bg-card rounded-xl p-5">
      <p className="font-medium text-primary mb-2">{path.field}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {path.subjects.map((subject) => (
          <span
            key={subject}
            className="text-xs px-2 py-0.5 rounded-full bg-[#F0E2B6] text-[#0B2545] font-medium"
          >
            {subject}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{path.description}</p>
    </div>
  )
}
