import type { ReactNode } from "react"

import {
  AlertTriangle,
  Building2,
  CalendarDays,
  RefreshCcw,
  Users,
} from "lucide-react"

export default function PlanningHeader() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-600">
            <CalendarDays className="h-5 w-5" />

            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
              Planning opérationnel
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Vue journalière des affectations
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Pilotez les agents, les sites, les absences et les remplacements en temps réel.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeaderKpi
            icon={<Building2 className="h-5 w-5" />}
            label="Sites"
            value="12"
            tone="cyan"
          />

          <HeaderKpi
            icon={<Users className="h-5 w-5" />}
            label="Agents"
            value="107"
            tone="emerald"
          />

          <HeaderKpi
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Alertes"
            value="0"
            tone="amber"
          />

          <HeaderKpi
            icon={<RefreshCcw className="h-5 w-5" />}
            label="Remplacements"
            value="0"
            tone="violet"
          />
        </div>
      </div>
    </section>
  )
}

function HeaderKpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string | number
  tone: "cyan" | "emerald" | "amber" | "violet"
}) {
  const styles = {
    cyan: {
      border: "border-cyan-200",
      background: "bg-cyan-50",
      icon: "bg-white text-cyan-700",
      value: "text-cyan-800",
    },
    emerald: {
      border: "border-emerald-200",
      background: "bg-emerald-50",
      icon: "bg-white text-emerald-700",
      value: "text-emerald-800",
    },
    amber: {
      border: "border-amber-200",
      background: "bg-amber-50",
      icon: "bg-white text-amber-700",
      value: "text-amber-800",
    },
    violet: {
      border: "border-violet-200",
      background: "bg-violet-50",
      icon: "bg-white text-violet-700",
      value: "text-violet-800",
    },
  }

  const theme = styles[tone]

  return (
    <div
      className={`min-w-[140px] rounded-2xl border p-4 shadow-sm ${theme.border} ${theme.background}`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 shadow-sm ${theme.icon}`}
      >
        {icon}
      </div>

      <div className={`text-2xl font-bold ${theme.value}`}>
        {value}
      </div>

      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
    </div>
  )
}