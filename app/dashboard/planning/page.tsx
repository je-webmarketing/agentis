import Link from "next/link"
import { supabase } from "@/lib/supabase"
import ExportPlanningPdfButton from "./ExportPlanningPdfButton"

function statusClass(status: string) {
  switch (status) {
    case "Présent":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    case "Absent":
    case "Absence":
      return "bg-red-500/15 text-red-300 border-red-500/30"
    case "Remplacé":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30"
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30"
  }
}

type SearchParams = {
  date?: string
  site?: string
  agent?: string
}

type PlanningItem = {
  id: string | number
  date: string
  agent_id: string | number | null
  site_id: string | number | null
  service: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string
  commentaire: string | null
  agents?: {
    nom: string | null
  } | null
  sites?: {
    nom: string | null
  } | null
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = await searchParams

  const selectedDate = params?.date || ""
  const selectedSite = params?.site || ""
  const searchAgent = params?.agent || ""

  const { data: planning, error } = await supabase
    .from("planning_journalier")
    .select(`
      *,
      agents:agent_id (
        nom
      ),
      sites:site_id (
        nom
      )
    `)
    .order("date", { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">{error.message}</div>
  }

  const rows = (planning || []) as PlanningItem[]

  const sites: string[] = Array.from(
    new Set(
      rows
        .map((item) => item.sites?.nom)
        .filter((site): site is string => Boolean(site))
    )
  ).sort()

  const filteredPlanning = rows.filter((item) => {
    const matchDate = selectedDate ? item.date === selectedDate : true
    const matchSite = selectedSite ? item.sites?.nom === selectedSite : true
    const matchAgent = searchAgent
      ? item.agents?.nom?.toLowerCase().includes(searchAgent.toLowerCase())
      : true

    return matchDate && matchSite && matchAgent
  })

  const presents = filteredPlanning.filter((item) => item.statut === "Présent").length

  const absents = filteredPlanning.filter(
    (item) => item.statut === "Absent" || item.statut === "Absence"
  ).length

  const remplaces = filteredPlanning.filter((item) => item.statut === "Remplacé").length

  const pdfRows = filteredPlanning.map((item) => ({
    agent: item.agents?.nom || "Agent non renseigné",
    site: item.sites?.nom || "Site non renseigné",
    date: item.date || "",
    heure_debut: item.heure_debut || null,
    heure_fin: item.heure_fin || null,
    statut: item.statut || "",
  }))

  const planningByAgent = filteredPlanning.reduce<Record<string, PlanningItem[]>>(
    (acc, item) => {
      const agentName = item.agents?.nom || "Agent non renseigné"

      if (!acc[agentName]) {
        acc[agentName] = []
      }

      acc[agentName].push(item)

      return acc
    },
    {}
  )

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
          <p className="text-sm text-yellow-400 font-semibold mb-1">AGENTIS</p>
          <h1 className="text-3xl font-bold">Planning journalier</h1>
          <p className="text-slate-400 mt-1">
            Affectations importées depuis Excel
          </p>
        </div>

        <div className="flex gap-3">
          <ExportPlanningPdfButton
            rows={pdfRows}
            selectedDate={selectedDate}
            total={filteredPlanning.length}
            presents={presents}
            absents={absents}
            remplaces={remplaces}
          />

          <Link
            href="/dashboard/planning/import"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
          >
            Import Planning
          </Link>

          <Link
            href="/dashboard/planning/new"
            className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
          >
            + Ajouter une affectation
          </Link>
        </div>
      </div>

      <form className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Date</label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-2 text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Site</label>
          <select
            name="site"
            defaultValue={selectedSite}
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-2 text-slate-100"
          >
            <option value="">Tous les sites</option>
            {sites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Agent</label>
          <input
            type="text"
            name="agent"
            defaultValue={searchAgent}
            placeholder="Rechercher un agent"
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-2 text-slate-100"
          />
        </div>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
          >
            Filtrer
          </button>

          <Link
            href="/dashboard/planning"
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
          >
            Réinitialiser
          </Link>
        </div>
      </form>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">Total affectations</p>
          <p className="text-3xl font-bold text-white">
            {filteredPlanning.length}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
          <p className="text-slate-400 text-sm">Présents</p>
          <p className="text-3xl font-bold text-emerald-300">{presents}</p>
        </div>

        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-slate-400 text-sm">Absents</p>
          <p className="text-3xl font-bold text-red-300">{absents}</p>
        </div>

        <div className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-4">
          <p className="text-slate-400 text-sm">Remplacés</p>
          <p className="text-3xl font-bold text-purple-300">{remplaces}</p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-6 bg-[#111827] border-b border-slate-800">
          <div className="p-4">Agent</div>
          <div className="p-4">Site</div>
          <div className="p-4">Date</div>
          <div className="p-4">Début</div>
          <div className="p-4">Fin</div>
          <div className="p-4">Statut</div>
        </div>

        {filteredPlanning.length === 0 ? (
          <div className="p-6 text-slate-400">
            Aucun planning trouvé avec ces filtres.
          </div>
        ) : (
          filteredPlanning.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-6 border-b border-slate-800 last:border-b-0"
            >
              <div className="p-4">
                {item.agents?.nom || "Agent non renseigné"}
              </div>
              <div className="p-4">
                {item.sites?.nom || "Site non renseigné"}
              </div>
              <div className="p-4">{item.date}</div>
              <div className="p-4">{item.heure_debut || "-"}</div>
              <div className="p-4">{item.heure_fin || "-"}</div>
              <div className="p-4">
                <span
                  className={`px-3 py-2 rounded-xl border text-xs font-medium ${statusClass(
                    item.statut
                  )}`}
                >
                  {item.statut}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="bg-[#111827] border-b border-slate-800 p-4">
          <h2 className="text-xl font-bold text-yellow-400">
            Vue hebdomadaire par agent
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Synthèse visuelle des affectations importées
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#020817]">
              <tr className="border-b border-slate-800">
                <th className="text-left p-4">Agent</th>
                <th className="text-left p-4">Affectations</th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(planningByAgent).map(([agentName, items]) => (
                <tr
                  key={agentName}
                  className="border-b border-slate-800 last:border-b-0"
                >
                  <td className="p-4 font-semibold text-slate-100 whitespace-nowrap">
                    {agentName}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`min-w-[140px] rounded-xl border px-3 py-2 text-xs ${statusClass(
                            item.statut
                          )}`}
                        >
                          <p className="font-semibold">{item.date}</p>
                          <p>{item.sites?.nom || "Site non renseigné"}</p>
                          <p>
                            {item.heure_debut || "-"} / {item.heure_fin || "-"}
                          </p>
                          <p className="font-bold mt-1">{item.statut}</p>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPlanning.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-6 text-slate-400">
                    Aucune donnée à afficher dans la vue hebdomadaire.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}