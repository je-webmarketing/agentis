"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  MapPin,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  ShieldCheck,
  UserRoundSearch,
  UsersRound,
  Workflow,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"

type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const mainItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Cockpit RH",
    href: "/dashboard/cockpit",
    icon: Gauge,
  },
  {
    label: "Planning",
    href: "/dashboard/planning",
    icon: CalendarDays,
    exact: true,
  },
  {
  label: "Besoins en effectifs",
  href: "/dashboard/planning/besoins",
  icon: ClipboardList,
},
  {
    label: "Historique planning",
    href: "/dashboard/planning/historique",
    icon: History,
  },
]

const rhItems: NavigationItem[] = [
  {
    label: "Agents",
    href: "/dashboard/agents",
    icon: UsersRound,
    exact: true,
  },
  {
    label: "Historique RH",
    href: "/dashboard/agents/historique",
    icon: UserRoundSearch,
  },
  {
    label: "Absences",
    href: "/dashboard/absences",
    icon: Clock3,
  },
  {
    label: "Temps & 1607h",
    href: "/dashboard/temps",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Documents RH",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    label: "Rapports RH",
    href: "/dashboard/rapports",
    icon: Workflow,
  },
]

const organisationItems: NavigationItem[] = [
  {
    label: "Sites",
    href: "/dashboard/sites",
    icon: MapPin,
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: Network,
  },
  {
    label: "Postes",
    href: "/dashboard/postes",
    icon: Building2,
  },
  {
    label: "Structures",
    href: "/dashboard/structures",
    icon: ShieldCheck,
  },
  {
    label: "Périscolaire",
    href: "/dashboard/periscolaire",
    icon: School,
  },
]

export default function AgentSidebar() {
  const pathname = usePathname()

  const isPlanningPage =
    pathname === "/dashboard/planning" ||
    pathname.startsWith("/dashboard/planning/")

  const [collapsed, setCollapsed] = useState(isPlanningPage)

  useEffect(() => {
    setCollapsed(isPlanningPage)
  }, [isPlanningPage])

  function isActive(item: NavigationItem) {
    if (item.exact) {
      return pathname === item.href
    }

    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    )
  }

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-sm transition-[width] duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        title={collapsed ? "Déplier le menu" : "Replier le menu"}
        aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
        className="absolute -right-4 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-md transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      <header
        className={`border-b border-slate-200 ${
          collapsed ? "px-3 py-5" : "px-6 py-6"
        }`}
      >
        <Link
          href="/dashboard"
          className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm">
              <Network className="h-6 w-6" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-[0.16em] text-amber-600">
                  AGENTIS
                </p>

                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  RH Intelligence
                </p>
              </div>
            )}
          </div>
        </Link>
      </header>

      <nav
        className={`flex-1 overflow-y-auto py-5 ${
          collapsed ? "space-y-5 px-2" : "space-y-7 px-4"
        }`}
        aria-label="Navigation principale"
      >
        <MenuGroup title="Pilotage" collapsed={collapsed}>
          {mainItems.map((item) => (
            <MenuLink
              key={item.href}
              item={item}
              active={isActive(item)}
              collapsed={collapsed}
            />
          ))}
        </MenuGroup>

        <MenuGroup title="Ressources humaines" collapsed={collapsed}>
          {rhItems.map((item) => (
            <MenuLink
              key={item.href}
              item={item}
              active={isActive(item)}
              collapsed={collapsed}
            />
          ))}
        </MenuGroup>

        <MenuGroup title="Organisation" collapsed={collapsed}>
          {organisationItems.map((item) => (
            <MenuLink
              key={item.href}
              item={item}
              active={isActive(item)}
              collapsed={collapsed}
            />
          ))}
        </MenuGroup>
      </nav>

      <footer className="border-t border-slate-200 p-3">
        <div
          className={`rounded-2xl border border-slate-200 bg-slate-50 ${
            collapsed ? "p-2" : "p-4"
          }`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <ShieldCheck className="h-4 w-4" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  Administrateur
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  AGENTIS v1.0
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
              Développé par{" "}
              <span className="font-semibold text-amber-600">
                JE-Webmarketing
              </span>
            </p>
          )}
        </div>
      </footer>
    </aside>
  )
}

function MenuGroup({
  title,
  children,
  collapsed,
}: {
  title: string
  children: React.ReactNode
  collapsed: boolean
}) {
  return (
    <section>
      {!collapsed && (
        <h2 className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </h2>
      )}

      {collapsed && (
        <div className="mx-auto mb-2 h-px w-8 bg-slate-200" />
      )}

      <div className="space-y-1.5">
        {children}
      </div>
    </section>
  )
}

function MenuLink({
  item,
  active,
  collapsed,
}: {
  item: NavigationItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center rounded-xl border text-sm font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-amber-400 ${
        collapsed
          ? "justify-center px-2 py-2.5"
          : "gap-3 px-3 py-2.5"
      } ${
        active
          ? "border-amber-300 bg-amber-50 text-amber-800 shadow-sm"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {active && !collapsed && (
        <span
          className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-amber-500"
          aria-hidden="true"
        />
      )}

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
          active
            ? "border-amber-200 bg-white text-amber-700"
            : "border-slate-200 bg-white text-slate-500 group-hover:border-slate-300 group-hover:text-slate-800"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      {!collapsed && (
        <span className="truncate">
          {item.label}
        </span>
      )}
    </Link>
  )
}