"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const mainItems = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Cockpit RH", href: "/dashboard/cockpit", icon: "◆" },
]

const rhItems = [
  { label: "Agents", href: "/dashboard/agents", icon: "A" },
  { label: "Planning", href: "/dashboard/planning", icon: "P" },
  { label: "Absences", href: "/dashboard/absences", icon: "C" },
  { label: "Temps & 1607h", href: "/dashboard/temps", icon: "T" },
  { label: "Documents RH", href: "/dashboard/documents", icon: "D" },
  { label: "Rapports RH", href: "/dashboard/rapports", icon: "R" },
]

const organisationItems = [
  { label: "Sites", href: "/dashboard/sites", icon: "S" },
  { label: "Services", href: "/dashboard/services", icon: "V" },
  { label: "Postes", href: "/dashboard/postes", icon: "M" },
  { label: "Structures", href: "/dashboard/structures", icon: "O" },
]

export default function AgentSidebar() {
  const pathname = usePathname()

  return (
    <aside className="h-screen w-72 border-r border-yellow-500/20 bg-[#020817] text-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="text-2xl font-bold tracking-[0.25em] text-yellow-300">
          AGENTIS
        </div>
        <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
          RH Intelligence
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        <MenuGroup title="Pilotage">
          {mainItems.map((item) => (
            <MenuLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </MenuGroup>

        <MenuGroup title="Ressources Humaines">
          {rhItems.map((item) => (
            <MenuLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </MenuGroup>

        <MenuGroup title="Organisation">
          {organisationItems.map((item) => (
            <MenuLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </MenuGroup>
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <div>Administrateur</div>
        <div className="mt-1">AGENTIS v1.0</div>
        <div className="mt-2 text-yellow-300">By JE-Webmarketing</div>
      </div>
    </aside>
  )
}

function MenuGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function MenuLink({
  item,
  active,
}: {
  item: {
    label: string
    href: string
    icon: string
  }
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
        active
          ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30"
          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  )
}