export default function RevenueCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1 tabular-nums">P{value.toFixed(2)}</p>
    </div>
  )
}
