import {
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react"

export type AgentPlanningItem = {
  id: number
  date: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
  service?: string | null
  sites?: {
    nom: string | null
  } | null
}

type Props = {
  planning: AgentPlanningItem[]
}

export default function PlanningTab({
  planning,
}: Props) {
  const sortedPlanning = [...planning].sort((a, b) => {
    const dateComparison = String(a.date || "").localeCompare(
      String(b.date || "")
    )

    if (dateComparison !== 0) {
      return dateComparison
    }

    return String(a.heure_debut || "").localeCompare(
      String(b.heure_debut || "")
    )
  })

  if (sortedPlanning.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <CalendarDays className="h-9 w-9 text-slate-300" />

        <p className="mt-4 font-semibold text-slate-700">
          Aucun planning disponible
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Aucune affectation n’est enregistrée pour cet agent.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Planning de l’agent
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {sortedPlanning.length} affectation
          {sortedPlanning.length > 1 ? "s" : ""} affichée
          {sortedPlanning.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {sortedPlanning.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {formatDate(item.date)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {formatTime(item.heure_debut)}
                      {" → "}
                      {formatTime(item.heure_fin)}
                    </span>

                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {item.sites?.nom || "Site non renseigné"}
                    </span>
                  </div>

                  {item.service && (
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {formatService(item.service)}
                    </p>
                  )}
                </div>
              </div>

              <StatusBadge status={item.statut} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status?: string | null
}) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()

  const style =
    normalized === "présent" ||
    normalized === "present"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "remplacé" ||
          normalized === "remplace"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : normalized === "absent" ||
            normalized === "absence"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-100 text-slate-600"

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      {status || "Statut non renseigné"}
    </span>
  )
}

function formatDate(value?: string | null) {
  if (!value) return "Date non renseignée"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatTime(value?: string | null) {
  if (!value) return "—"

  return value.slice(0, 5).replace(":", "h")
}

function formatService(value: string) {
  const labels: Record<string, string> = {
    matin: "Matin",
    midi_pri: "Midi primaire",
    midi_mat: "Midi maternelle",
    atsem: "ATSEM",
    restauration: "Restauration",
    soir: "Soir",
  }

  return labels[value] || value
}