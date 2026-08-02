import Link from "next/link"
import { supabase } from "@/lib/supabase"

import ReportHeader from "@/components/agentis/reports/ReportHeader"
import ActionBar from "@/components/agentis/ui/ActionBar"
import DataTable from "@/components/agentis/ui/DataTable"
import EmptyState from "@/components/agentis/ui/EmptyState"
import FilterBar from "@/components/agentis/ui/FilterBar"
import StatCard from "@/components/agentis/ui/StatCard"
import StatusBadge from "@/components/agentis/ui/StatusBadge"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<{
    date_debut?: string
    date_fin?: string
    site?: string
  }>
}

type RawReplacementRow = {
  id: string | number
  date: string
  statut: string | null
  heure_debut: string | null
  heure_fin: string | null
  service: string | null
  commentaire: string | null
  agent_id: string | number | null
  site_id: string | number | null
  agent?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null
  site?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null
}

type ReplacementRow = Omit<RawReplacementRow, "agent" | "site"> & {
  agent?: {
    id: string | number
    nom: string | null
  } | null
  site?: {
    id: string | number
    nom: string | null
  } | null
}

type SiteRow = {
  id: string | number
  nom: string
}

function normalize(value?: string | null) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || ""
  )
}

function isReplacement(status?: string | null) {
  const normalized = normalize(status)

  return (
    normalized === "remplace" ||
    normalized === "remplacement"
  )
}

function formatDate(value?: string | null) {
  if (!value) return "—"

  return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatTime(value?: string | null) {
  if (!value) return "—"

  return value.slice(0, 5).replace(":", "h")
}

function getDefaultPeriod() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function normalizeRows(rows: RawReplacementRow[] | null): ReplacementRow[] {
  return (rows || []).map((row) => ({
    ...row,
    agent: Array.isArray(row.agent)
      ? row.agent[0] ?? null
      : row.agent ?? null,
    site: Array.isArray(row.site)
      ? row.site[0] ?? null
      : row.site ?? null,
  }))
}

export default async function RemplacementsReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined
  const defaultPeriod = getDefaultPeriod()

  const startDate = params?.date_debut || defaultPeriod.start
  const endDate = params?.date_fin || defaultPeriod.end
  const selectedSite = params?.site || "tous"

  let planningQuery = supabase
    .from("planning_journalier")
    .select(`
      id,
      date,
      statut,
      heure_debut,
      heure_fin,
      service,
      commentaire,
      agent_id,
      site_id,
      agent:agent_id (
        id,
        nom
      ),
      site:site_id (
        id,
        nom
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true })

  if (selectedSite !== "tous") {
    planningQuery = planningQuery.eq("site_id", selectedSite)
  }

  const [
    { data: planning, error: planningError },
    { data: sites, error: sitesError },
  ] = await Promise.all([
    planningQuery,
    supabase
      .from("sites")
      .select("id, nom")
      .order("nom", { ascending: true }),
  ])

  const error = planningError || sitesError

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
          <Link
            href="/dashboard/rapports"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            ← Retour aux rapports
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            Impossible de charger le rapport : {error.message}
          </div>
        </div>
      </main>
    )
  }

  const rows = normalizeRows(
    (planning || []) as RawReplacementRow[]
  ).filter((row) => isReplacement(row.statut))

  const uniqueAgents = new Set(
    rows
      .map((row) => row.agent_id)
      .filter((value) => value !== null)
      .map(String)
  ).size

  const uniqueSites = new Set(
    rows
      .map((row) => row.site_id)
      .filter((value) => value !== null)
      .map(String)
  ).size

  const replacementsWithComment = rows.filter(
    (row) => Boolean(row.commentaire?.trim())
  ).length

  const siteRows = (sites || []) as SiteRow[]

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <Link
          href="/dashboard/rapports"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
        >
          ← Retour aux rapports
        </Link>

        <ReportHeader
          title="Rapport Remplacements"
          description="Suivi des affectations enregistrées comme remplacements sur une période donnée."
        />

        <form method="GET">
          <FilterBar title="Filtres du rapport">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Date de début
              </label>

              <input
                type="date"
                name="date_debut"
                defaultValue={startDate}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Date de fin
              </label>

              <input
                type="date"
                name="date_fin"
                defaultValue={endDate}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Site
              </label>

              <select
                name="site"
                defaultValue={selectedSite}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="tous">Tous les sites</option>

                {siteRows.map((site) => (
                  <option key={site.id} value={String(site.id)}>
                    {site.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Afficher
              </button>
            </div>
          </FilterBar>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Remplacements"
            value={rows.length}
            tone="violet"
          />

          <StatCard
            title="Agents concernés"
            value={uniqueAgents}
            tone="blue"
          />

          <StatCard
            title="Sites concernés"
            value={uniqueSites}
            tone="cyan"
          />

          <StatCard
            title="Avec commentaire"
            value={replacementsWithComment}
            tone="yellow"
          />
        </section>

        <ActionBar title="Détail des remplacements">
          <Link
            href={`/dashboard/rapports/planning?date=${startDate}`}
            className="rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-3 font-semibold text-cyan-800 transition hover:border-cyan-400"
          >
            Voir le planning du début de période
          </Link>
        </ActionBar>

        {rows.length === 0 ? (
          <EmptyState
            title="Aucun remplacement"
            description="Aucun remplacement n’a été enregistré sur la période et le site sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Date",
              "Agent",
              "Site",
              "Service",
              "Horaire",
              "Statut",
              "Commentaire",
            ]}
          >
            {rows.map((row) => (
              <tr
                key={row.id}
                className="text-sm transition hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {formatDate(row.date)}
                </td>

                <td className="px-6 py-4 font-medium text-slate-900">
                  {row.agent?.nom || "Agent non renseigné"}
                </td>

                <td className="px-6 py-4 text-slate-700">
                  {row.site?.nom || "—"}
                </td>

                <td className="px-6 py-4 text-slate-700">
                  {row.service || "—"}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                  {formatTime(row.heure_debut)}
                  {" – "}
                  {formatTime(row.heure_fin)}
                </td>

                <td className="px-6 py-4">
                  <StatusBadge
                    label="Remplacement"
                    tone="violet"
                  />
                </td>

                <td className="max-w-[360px] px-6 py-4 text-slate-600">
                  {row.commentaire || "—"}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </main>
  )
}