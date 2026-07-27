import type { LucideIcon } from 'lucide-react'

export default function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="border border-border bg-card rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-[#F0E2B6] flex items-center justify-center mb-3">
        <Icon size={18} className="text-[#0B2545]" />
      </div>
      <p className="font-medium text-primary mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
