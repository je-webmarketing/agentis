import { ReactNode } from "react"

export default function DashboardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {children}
    </div>
  )
}