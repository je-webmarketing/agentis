import {
  AlertTriangle,
  Building2,
  CalendarDays,
  RefreshCcw,
  Users,
} from "lucide-react"

export default function PlanningHeader() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#020817] p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-yellow-300">
            <CalendarDays className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
              Planning opérationnel
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Vue journalière des affectations
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Pilotez les agents, les sites, les absences et les remplacements en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <HeaderKpi
            icon={<Building2 className="h-5 w-5" />}
            label="Sites"
            value="12"
            color="text-cyan-300"
          />
          <HeaderKpi
            icon={<Users className="h-5 w-5" />}
            label="Agents"
            value="107"
            color="text-emerald-300"
          />
          <HeaderKpi
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Alertes"
            value="0"
            color="text-yellow-300"
          />
          <HeaderKpi
            icon={<RefreshCcw className="h-5 w-5" />}
            label="Remplacements"
            value="0"
            color="text-violet-300"
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
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="min-w-[140px] rounded-2xl border border-slate-700 bg-white/5 p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
    </div>
  )
}