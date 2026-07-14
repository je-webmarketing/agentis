import { ReactNode } from "react"

type Props = {
  sidebar: ReactNode
  header: ReactNode
  tabs: ReactNode
  children: ReactNode
}

export default function AgentWorkspace({
  sidebar,
  header,
  tabs,
  children,
}: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      <aside className="xl:col-span-1 space-y-6">
        {sidebar}
      </aside>

      <main className="xl:col-span-2 space-y-6">

        {header}

        {tabs}

        <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
          {children}
        </div>

      </main>

    </div>
  )
}