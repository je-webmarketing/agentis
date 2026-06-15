import Link from "next/link"
import { supabase } from "@/lib/supabase"
import AbsenceActions from "./actions"

function typeClass(type: string) {
  switch (type) {
    case "Congé":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30"
    case "RTT":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30"
    case "Formation":
      return "bg-blue-500/15 text-blue-300 border-blue-500/30"
    case "Maladie":
    case "Absence":
      return "bg-red-500/15 text-red-300 border-red-500/30"
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30"
  }
}

function validationClass(statut: string) {
  switch (statut) {
    case "Validée":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    case "Refusée":
      return "bg-red-500/15 text-red-300 border-red-500/30"
    default:
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
  }
}

export default async function AbsencesPage() {
  const { data: absences, error } = await supabase
    .from("absences")
    .select(`
      *,
      agents:agent_id (
        nom
      )
    `)
    .order("date_debut", { ascending: true })

  if (error) {
    return (
      <div className="p-8 text-red-500">
        {error.message}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Dashboard
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Absences</h1>
          <p className="text-slate-400 mt-1">
            Congés, RTT, formations et absences avec période
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div
          className="bg-[#111827] border-b border-slate-800"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr",
          }}
        >
          <div className="p-4">Agent</div>
          <div className="p-4">Type</div>
          <div className="p-4">Début</div>
          <div className="p-4">Fin</div>
          <div className="p-4">Validation</div>
          <div className="p-4">Actions</div>
        </div>

        {absences?.map((absence) => (
          <div
            key={absence.id}
            className="border-b border-slate-800 last:border-b-0"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr",
            }}
          >
            <div className="p-4 font-medium">
              {absence.agents?.nom}
            </div>

            <div className="p-4">
              <span
                className={`px-3 py-2 rounded-xl border text-xs font-medium ${typeClass(
                  absence.type
                )}`}
              >
                {absence.type}
              </span>
            </div>

            <div className="p-4">{absence.date_debut}</div>
            <div className="p-4">{absence.date_fin}</div>

            <div className="p-4">
              <span
                className={`px-3 py-2 rounded-xl border text-xs font-medium ${validationClass(
                  absence.statut_validation
                )}`}
              >
                {absence.statut_validation}
              </span>
            </div>

            <div className="p-4">
              <AbsenceActions
  id={absence.id}
  statut={absence.statut_validation}
/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}