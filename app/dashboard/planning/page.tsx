import Link from "next/link"
import { supabase } from "@/lib/supabase"
import ExportPlanningPdfButton from "./ExportPlanningPdfButton"
import PlanningHeader from "@/components/agentis/planning/PlanningHeader"
import PlanningToolbar from "@/components/agentis/planning/PlanningToolbar"
import PlanningGrid from "@/components/agentis/planning/PlanningGrid"
import PlanningSidebar from "@/components/agentis/planning/PlanningSidebar"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
  agents?: { nom: string | null } | null
  sites?: { nom: string | null } | null
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = await searchParams

  const selectedDate =
  params?.date || new Date().toISOString().slice(0, 10)
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
  .eq("date", selectedDate)
  .order("heure_debut", { ascending: true })

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
  const matchSite = selectedSite
    ? item.sites?.nom === selectedSite
    : true

  const matchAgent = searchAgent
    ? item.agents?.nom
        ?.toLowerCase()
        .includes(searchAgent.toLowerCase())
    : true

  return matchSite && matchAgent
})

  const presents = filteredPlanning.filter(
    (item) => item.statut === "Présent"
  ).length

  const absents = filteredPlanning.filter(
    (item) => item.statut === "Absent" || item.statut === "Absence"
  ).length

  const remplaces = filteredPlanning.filter(
    (item) => item.statut === "Remplacé"
  ).length

  const pdfRows = filteredPlanning.map((item) => ({
    agent: item.agents?.nom || "Agent non renseigné",
    site: item.sites?.nom || "Site non renseigné",
    date: item.date || "",
    heure_debut: item.heure_debut || null,
    heure_fin: item.heure_fin || null,
    statut: item.statut || "",
  }))

  return (
    <main className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex px-4 py-2 rounded-xl border border-slate-700 bg-[#111827] hover:border-yellow-500/50 hover:text-yellow-300 transition"
        >
          ← Retour Dashboard
        </Link>

        <PlanningHeader />

        <PlanningToolbar />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-sm text-slate-400">
            Export, import et ajout manuel restent disponibles pendant la refonte du planning.
          </div>

          <div className="flex flex-wrap gap-3">
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

        <form
          className="grid gap-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-4"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
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

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          <PlanningStat title="Total affectations" value={filteredPlanning.length} />
          <PlanningStat title="Présents" value={presents} color="emerald" />
          <PlanningStat title="Absents" value={absents} color="red" />
          <PlanningStat title="Remplacés" value={remplaces} color="purple" />
        </div>

        <div
          className="grid gap-6 items-start"
          style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}
        >
         <PlanningGrid selectedDate={selectedDate} />

          <PlanningSidebar selectedDate={selectedDate} />
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-[#111827] border-b border-slate-800 p-4">
            <h2 className="text-xl font-bold text-yellow-400">
              Données importées
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Vue technique conservée pendant la migration vers le planning opérationnel.
            </p>
          </div>

          <div
            className="grid bg-[#111827] border-b border-slate-800 text-sm font-semibold text-slate-300"
            style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
          >
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
                className="grid border-b border-slate-800 last:border-b-0 text-sm"
                style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
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
      </div>
    </main>
  )
}

function PlanningStat({
  title,
  value,
  color = "slate",
}: {
  title: string
  value: number
  color?: "slate" | "emerald" | "red" | "purple"
}) {
  const styles = {
    slate: "bg-slate-800 border-slate-700 text-white",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    red: "bg-red-500/10 border-red-500/30 text-red-300",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  }

  return (
    <div className={`rounded-2xl border p-4 ${styles[color]}`}>
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}