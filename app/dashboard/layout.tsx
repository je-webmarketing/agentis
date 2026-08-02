import AgentSidebar from "@/components/agentis/layout/AgentSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AgentSidebar />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}