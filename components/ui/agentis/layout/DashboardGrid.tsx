import { ReactNode } from "react"

export default function DashboardGrid({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      }}
    >
      {children}
    </div>
  )
}