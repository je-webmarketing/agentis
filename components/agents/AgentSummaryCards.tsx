import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  FileText,
} from "lucide-react"

type Props = {
  temps?: string
  contrat?: string
  prochaineAffectation?: string
  alertes?: number
}

export default function AgentSummaryCards({
  temps,
  contrat,
  prochaineAffectation,
  alertes = 0,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

      <Card
        icon={<Clock3 className="h-5 w-5" />}
        title="Temps de travail"
        value={temps || "35 h"}
        subtitle="1607 h annuelles"
        color="emerald"
      />

      <Card
        icon={<CalendarDays className="h-5 w-5" />}
        title="Prochaine affectation"
        value={prochaineAffectation || "Aujourd'hui"}
        subtitle="Planning"
        color="blue"
      />

      <Card
        icon={<FileText className="h-5 w-5" />}
        title="Contrat"
        value={contrat || "CDI"}
        subtitle="Situation actuelle"
        color="amber"
      />

      <Card
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Alertes RH"
        value={String(alertes)}
        subtitle={
          alertes === 0
            ? "Aucune alerte"
            : "À vérifier"
        }
        color="rose"
      />

    </div>
  )
}

function Card({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: "emerald" | "blue" | "amber" | "rose"
}) {
  const colors = {
    emerald:
      "bg-emerald-50 text-emerald-600",
    blue:
      "bg-blue-50 text-blue-600",
    amber:
      "bg-amber-50 text-amber-600",
    rose:
      "bg-rose-50 text-rose-600",
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>

        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </div>

      </div>

    </div>
  )
}