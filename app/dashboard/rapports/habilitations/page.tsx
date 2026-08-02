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
    habilitation?: string
    echeance?: string
  }>
}

type AgentRelation = {
  id: string | number
  nom: string | null
}

type RawHabilitationRow = {
  id: string | number
  agent_id: string | number
  habilitation: string | null
  date_obtention: string | null
  date_expiration: string | null
  commentaire: string | null
  created_at: string | null
  agent?: AgentRelation | AgentRelation[] | null
}

type HabilitationRow = Omit<RawHabilitationRow, "agent"> & {
  agent?: AgentRelation | null
}

type EcheanceStatus =
  | "valide"
  | "bientot"
  | "expiree"
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

function normalizeRows(
  rows: RawHabilitationRow[] | null
): HabilitationRow[] {
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

function getEcheanceStatus(
  row: HabilitationRow
): EcheanceStatus {
  const days = getDaysUntil(row.date_expiration)

  if (days === null) return "sans_date"
  if (days < 0) return "expiree"
  if (days <= 30) return "bientot"

  return "valide"
}

function getBadge(row: HabilitationRow) {
  const status = getEcheanceStatus(row)

  if (status === "expiree") {
    return {
      label: "Expirée",
      tone: "red" as const,
    }
  }

  if (status === "bientot") {
    return {
      label: "À renouveler",
      tone: "yellow" as const,
    }
  }

  if (status === "valide") {
    return {
      label: "Valide",
      tone: "green" as const,
    }
  }

  return {
    label: "Sans expiration",
    tone: "slate" as const,
  }
}

export default async function HabilitationsReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined

  const search = params?.recherche?.trim() || ""
  const selectedHabilitation =
    params?.habilitation || "toutes"
  const selectedEcheance =
    params?.echeance || "toutes"

  const { data, error } = await supabase
    .from("agent_habilitations")
    .select(`
      id,
      agent_id,
      habilitation,
      date_obtention,
      date_expiration,
      commentaire,
      created_at,
      agent:agent_id (
        id,
        nom
      )
    `)
    .order("date_obtention", { ascending: false })

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
    (data || []) as RawHabilitationRow[]
  )

  const habilitations = Array.from(
    new Set(
      rows
        .map((row) => row.habilitation?.trim())
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
        row.habilitation,
        row.commentaire,
      ].some((value) =>
        normalize(value).includes(normalize(search))
      )

    const matchesHabilitation =
      selectedHabilitation === "toutes" ||
      normalize(row.habilitation) ===
        normalize(selectedHabilitation)

    const matchesEcheance =
      selectedEcheance === "toutes" ||
      getEcheanceStatus(row) === selectedEcheance

    return (
      matchesSearch &&
      matchesHabilitation &&
      matchesEcheance
    )
  })

  const validCount = rows.filter(
    (row) => getEcheanceStatus(row) === "valide"
  ).length

  const expiringSoonCount = rows.filter(
    (row) => getEcheanceStatus(row) === "bientot"
  ).length

  const expiredCount = rows.filter(
    (row) => getEcheanceStatus(row) === "expiree"
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
          title="Rapport Habilitations"
          description="Suivi des habilitations détenues par les agents et de leurs échéances de renouvellement."
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
                placeholder="Agent, habilitation, commentaire..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Habilitation
              </label>

              <select
                name="habilitation"
                defaultValue={selectedHabilitation}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="toutes">
                  Toutes les habilitations
                </option>

                {habilitations.map((habilitation) => (
                  <option
                    key={habilitation}
                    value={habilitation}
                  >
                    {habilitation}
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
                <option value="toutes">
                  Toutes les échéances
                </option>
                <option value="valide">Valides</option>
                <option value="bientot">
                  À renouveler sous 30 jours
                </option>
                <option value="expiree">Expirées</option>
                <option value="sans_date">
                  Sans date d’expiration
                </option>
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
                href="/dashboard/rapports/habilitations"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
              >
                Effacer
              </Link>
            </div>
          </FilterBar>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Habilitations"
            value={rows.length}
            tone="violet"
          />

          <StatCard
            title="Valides"
            value={validCount}
            tone="green"
          />

          <StatCard
            title="Sous 30 jours"
            value={expiringSoonCount}
            tone="yellow"
          />

          <StatCard
            title="Expirées"
            value={expiredCount}
            tone="red"
          />
        </section>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucune habilitation"
            description="Aucune habilitation ne correspond aux critères sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Habilitation",
              "Date d’obtention",
              "Date d’expiration",
              "Statut",
              "Commentaire",
            ]}
          >
            {filteredRows.map((row) => {
              const badge = getBadge(row)

              return (
                <tr
                  key={row.id}
                  className="text-sm transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.agent?.nom ||
                      "Agent non renseigné"}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.habilitation ||
                      "Habilitation non renseignée"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.date_obtention)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.date_expiration)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      label={badge.label}
                      tone={badge.tone}
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