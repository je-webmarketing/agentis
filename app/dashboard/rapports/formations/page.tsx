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
    statut?: string
  }>
}

type NamedRelation = {
  id: string | number
  nom: string | null
}

type RawFormationRow = {
  id: string | number
  agent_id: string | number
  formation: string | null
  organisme: string | null
  date_formation: string | null
  date_expiration: string | null
  commentaire: string | null
  created_at: string | null
  agent?: NamedRelation | NamedRelation[] | null
}

type FormationRow = Omit<RawFormationRow, "agent"> & {
  agent?: NamedRelation | null
}

type FormationStatus =
  | "valide"
  | "bientot"
  | "expiree"
  | "sans_expiration"

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

function normalizeRows(rows: RawFormationRow[] | null): FormationRow[] {
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

function getStatus(row: FormationRow): FormationStatus {
  const days = getDaysUntil(row.date_expiration)

  if (days === null) return "sans_expiration"
  if (days < 0) return "expiree"
  if (days <= 30) return "bientot"

  return "valide"
}

function getBadge(row: FormationRow) {
  const status = getStatus(row)

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

export default async function FormationsReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined

  const search = params?.recherche?.trim() || ""
  const selectedStatus = params?.statut || "tous"

  const { data, error } = await supabase
    .from("agent_formations")
    .select(`
      id,
      agent_id,
      formation,
      organisme,
      date_formation,
      date_expiration,
      commentaire,
      created_at,
      agent:agent_id (
        id,
        nom
      )
    `)
    .order("date_formation", { ascending: false })

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

  const rows = normalizeRows((data || []) as RawFormationRow[])

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !search ||
      [
        row.agent?.nom,
        row.formation,
        row.organisme,
        row.commentaire,
      ].some((value) =>
        normalize(value).includes(normalize(search))
      )

    const matchesStatus =
      selectedStatus === "tous" ||
      getStatus(row) === selectedStatus

    return matchesSearch && matchesStatus
  })

  const expiredCount = rows.filter(
    (row) => getStatus(row) === "expiree"
  ).length

  const expiringSoonCount = rows.filter(
    (row) => getStatus(row) === "bientot"
  ).length

  const validCount = rows.filter(
    (row) => getStatus(row) === "valide"
  ).length

  const agentsConcerned = new Set(
    rows.map((row) => String(row.agent_id))
  ).size

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
          title="Rapport Formations"
          description="Suivi des formations, organismes et échéances de renouvellement des agents."
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
                placeholder="Agent, formation, organisme..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Statut
              </label>

              <select
                name="statut"
                defaultValue={selectedStatus}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="tous">Tous les statuts</option>
                <option value="valide">Valides</option>
                <option value="bientot">À renouveler sous 30 jours</option>
                <option value="expiree">Expirées</option>
                <option value="sans_expiration">Sans expiration</option>
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

            <div className="flex items-end">
              <Link
                href="/dashboard/rapports/formations"
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
              >
                Réinitialiser
              </Link>
            </div>
          </FilterBar>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Formations"
            value={rows.length}
            tone="blue"
          />

          <StatCard
            title="Agents concernés"
            value={agentsConcerned}
            tone="cyan"
          />

          <StatCard
            title="Valides"
            value={validCount}
            tone="green"
          />

          <StatCard
            title="À surveiller"
            value={expiredCount + expiringSoonCount}
            tone="red"
          />
        </section>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucune formation"
            description="Aucune formation ne correspond aux critères sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Formation",
              "Organisme",
              "Date",
              "Expiration",
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
                    {row.agent?.nom || "Agent non renseigné"}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.formation || "Formation non renseignée"}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {row.organisme || "—"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.date_formation)}
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

                  <td className="max-w-[360px] px-6 py-4 text-slate-600">
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