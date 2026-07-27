import DashboardTopBar from '@/components/DashboardTopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DashboardTopBar />
      {children}
    </div>
  )
}
