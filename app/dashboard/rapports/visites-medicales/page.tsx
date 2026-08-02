import Link from "next/link"
import { supabase } from "@/lib/supabase"

import ReportHeader from "@/components/agentis/reports/ReportHeader"
import DataTable from "@/components/agentis/ui/DataTable"
import EmptyState from "@/components/agentis/ui/EmptyState"
import FilterBar from "@/components/agentis/ui/FilterBar"
import StatCard from "@/components/agentis/ui/StatCard"
import StatusBadge from "@/components/agentis/ui/StatusBadge"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<{
    recherche?: string
    aptitude?: string
    echeance?: string
  }>
}

type AgentRelation = {
  id: string | number
  nom: string | null
}

type RawVisiteRow = {
  id: string | number
  agent_id: string | number
  date_visite: string | null
  aptitude: string | null
  prochaine_visite: string | null
  commentaire: string | null
  created_at: string | null
  agent?: AgentRelation | AgentRelation[] | null
}

type VisiteRow = Omit<RawVisiteRow, "agent"> & {
  agent?: AgentRelation | null
}

type EcheanceStatus =
  | "valide"
  | "bientot"
  | "retard"
  | "sans_date"

function normalize(value?: string | null) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || ""
  )
}

function formatDate(value?: string | null) {
  if (!value) return "—"

  return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR")
}

function normalizeRows(rows: RawVisiteRow[] | null): VisiteRow[] {
  return (rows || []).map((row) => ({
    ...row,
    agent: Array.isArray(row.agent)
      ? row.agent[0] ?? null
      : row.agent ?? null,
  }))
}

function getDaysUntil(date?: string | null) {
  if (!date) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(`${date}T12:00:00`)
  target.setHours(0, 0, 0, 0)

  return Math.ceil(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

function getEcheanceStatus(row: VisiteRow): EcheanceStatus {
  const days = getDaysUntil(row.prochaine_visite)

  if (days === null) return "sans_date"
  if (days < 0) return "retard"
  if (days <= 30) return "bientot"

  return "valide"
}

function getEcheanceBadge(row: VisiteRow) {
  const status = getEcheanceStatus(row)

  if (status === "retard") {
    return {
      label: "En retard",
      tone: "red" as const,
    }
  }

  if (status === "bientot") {
    return {
      label: "Sous 30 jours",
      tone: "yellow" as const,
    }
  }

  if (status === "valide") {
    return {
      label: "À jour",
      tone: "green" as const,
    }
  }

  return {
    label: "Sans prochaine date",
    tone: "slate" as const,
  }
}

function getAptitudeBadge(aptitude?: string | null) {
  const normalized = normalize(aptitude)

  if (normalized === "apte") {
    return {
      label: aptitude || "Apte",
      tone: "green" as const,
    }
  }

  if (
    normalized.includes("inapte") ||
    normalized.includes("restriction")
  ) {
    return {
      label: aptitude || "À contrôler",
      tone: "red" as const,
    }
  }

  if (
    normalized.includes("reserve") ||
    normalized.includes("surveillance")
  ) {
    return {
      label: aptitude || "À surveiller",
      tone: "yellow" as const,
    }
  }

  return {
    label: aptitude || "Non renseignée",
    tone: "slate" as const,
  }
}

export default async function VisitesMedicalesReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined

  const search = params?.recherche?.trim() || ""
  const selectedAptitude = params?.aptitude || "toutes"
  const selectedEcheance = params?.echeance || "toutes"

  const { data, error } = await supabase
    .from("agent_visites_medicales")
    .select(`
      id,
      agent_id,
      date_visite,
      aptitude,
      prochaine_visite,
      commentaire,
      created_at,
      agent:agent_id (
        id,
        nom
      )
    `)
    .order("date_visite", { ascending: false })

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

  const rows = normalizeRows((data || []) as RawVisiteRow[])

  const aptitudes = Array.from(
    new Set(
      rows
        .map((row) => row.aptitude?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((first, second) =>
    first.localeCompare(second, "fr")
  )

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !search ||
      [
        row.agent?.nom,
        row.aptitude,
        row.commentaire,
      ].some((value) =>
        normalize(value).includes(normalize(search))
      )

    const matchesAptitude =
      selectedAptitude === "toutes" ||
      normalize(row.aptitude) === normalize(selectedAptitude)

    const matchesEcheance =
      selectedEcheance === "toutes" ||
      getEcheanceStatus(row) === selectedEcheance

    return (
      matchesSearch &&
      matchesAptitude &&
      matchesEcheance
    )
  })

  const aptesCount = rows.filter(
    (row) => normalize(row.aptitude) === "apte"
  ).length

  const expiringSoonCount = rows.filter(
    (row) => getEcheanceStatus(row) === "bientot"
  ).length

  const overdueCount = rows.filter(
    (row) => getEcheanceStatus(row) === "retard"
  ).length

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
          title="Rapport Visites médicales"
          description="Suivi des visites médicales, aptitudes et prochaines échéances des agents."
        />

        <form method="GET">
          <FilterBar title="Filtres du rapport">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Recherche
              </label>

              <input
                type="search"
                name="recherche"
                defaultValue={search}
                placeholder="Agent, aptitude, commentaire..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Aptitude
              </label>

              <select
                name="aptitude"
                defaultValue={selectedAptitude}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="toutes">Toutes les aptitudes</option>

                {aptitudes.map((aptitude) => (
                  <option key={aptitude} value={aptitude}>
                    {aptitude}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Échéance
              </label>

              <select
                name="echeance"
                defaultValue={selectedEcheance}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="toutes">Toutes les échéances</option>
                <option value="valide">À jour</option>
                <option value="bientot">Sous 30 jours</option>
                <option value="retard">En retard</option>
                <option value="sans_date">Sans prochaine date</option>
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Afficher
              </button>

              <Link
                href="/dashboard/rapports/visites-medicales"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
              >
                Effacer
              </Link>
            </div>
          </FilterBar>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Visites"
            value={rows.length}
            tone="blue"
          />

          <StatCard
            title="Aptes"
            value={aptesCount}
            tone="green"
          />

          <StatCard
            title="Sous 30 jours"
            value={expiringSoonCount}
            tone="yellow"
          />

          <StatCard
            title="En retard"
            value={overdueCount}
            tone="red"
          />
        </section>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucune visite médicale"
            description="Aucune visite médicale ne correspond aux critères sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Date de visite",
              "Aptitude",
              "Prochaine visite",
              "Échéance",
              "Commentaire",
            ]}
          >
            {filteredRows.map((row) => {
              const aptitudeBadge = getAptitudeBadge(row.aptitude)
              const echeanceBadge = getEcheanceBadge(row)

              return (
                <tr
                  key={row.id}
                  className="text-sm transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.agent?.nom || "Agent non renseigné"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.date_visite)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      label={aptitudeBadge.label}
                      tone={aptitudeBadge.tone}
                    />
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.prochaine_visite)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      label={echeanceBadge.label}
                      tone={echeanceBadge.tone}
                    />
                  </td>

                  <td className="max-w-[420px] px-6 py-4 text-slate-600">
                    {row.commentaire || "—"}
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </div>
    </main>
  )
}