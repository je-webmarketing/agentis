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
    type_contrat?: string
    statut?: string
    echeance?: string
  }>
}

type AgentRelation = {
  id: string | number
  nom: string | null
}

type RawContratRow = {
  id: string | number
  agent_id: string | number
  type_contrat: string | null
  grade: string | null
  cadre_emploi: string | null
  date_debut: string | null
  date_fin: string | null
  temps_travail: string | null
  indice: string | null
  echelon: string | null
  statut: string | null
  created_at: string | null
  agent?: AgentRelation | AgentRelation[] | null
}

type ContratRow = Omit<RawContratRow, "agent"> & {
  agent?: AgentRelation | null
}

type EcheanceStatus =
  | "en_cours"
  | "bientot"
  | "expire"
  | "sans_fin"

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

function normalizeRows(rows: RawContratRow[] | null): ContratRow[] {
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

function getEcheanceStatus(row: ContratRow): EcheanceStatus {
  const days = getDaysUntil(row.date_fin)

  if (days === null) return "sans_fin"
  if (days < 0) return "expire"
  if (days <= 30) return "bientot"

  return "en_cours"
}

function getEcheanceBadge(row: ContratRow) {
  const status = getEcheanceStatus(row)

  if (status === "expire") {
    return {
      label: "Expiré",
      tone: "red" as const,
    }
  }

  if (status === "bientot") {
    return {
      label: "Sous 30 jours",
      tone: "yellow" as const,
    }
  }

  if (status === "en_cours") {
    return {
      label: "En cours",
      tone: "green" as const,
    }
  }

  return {
    label: "Sans date de fin",
    tone: "slate" as const,
  }
}

function getStatutBadge(statut?: string | null) {
  const normalized = normalize(statut)

  if (
    normalized === "actif" ||
    normalized === "en cours" ||
    normalized === "valide"
  ) {
    return {
      label: statut || "Actif",
      tone: "green" as const,
    }
  }

  if (
    normalized === "inactif" ||
    normalized === "termine" ||
    normalized === "expire"
  ) {
    return {
      label: statut || "Inactif",
      tone: "red" as const,
    }
  }

  return {
    label: statut || "Non renseigné",
    tone: "slate" as const,
  }
}

export default async function ContratsReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined

  const search = params?.recherche?.trim() || ""
  const selectedType = params?.type_contrat || "tous"
  const selectedStatut = params?.statut || "tous"
  const selectedEcheance = params?.echeance || "toutes"

  const { data, error } = await supabase
    .from("agent_contrats")
    .select(`
      id,
      agent_id,
      type_contrat,
      grade,
      cadre_emploi,
      date_debut,
      date_fin,
      temps_travail,
      indice,
      echelon,
      statut,
      created_at,
      agent:agent_id (
        id,
        nom
      )
    `)
    .order("date_debut", { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
        <div className="mx-auto w-full max-w-[1700px] space-y-6">
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

  const rows = normalizeRows((data || []) as RawContratRow[])

  const contractTypes = Array.from(
    new Set(
      rows
        .map((row) => row.type_contrat?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((first, second) => first.localeCompare(second, "fr"))

  const statuses = Array.from(
    new Set(
      rows
        .map((row) => row.statut?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((first, second) => first.localeCompare(second, "fr"))

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !search ||
      [
        row.agent?.nom,
        row.type_contrat,
        row.grade,
        row.cadre_emploi,
        row.temps_travail,
        row.indice,
        row.echelon,
        row.statut,
      ].some((value) =>
        normalize(value).includes(normalize(search))
      )

    const matchesType =
      selectedType === "tous" ||
      normalize(row.type_contrat) === normalize(selectedType)

    const matchesStatut =
      selectedStatut === "tous" ||
      normalize(row.statut) === normalize(selectedStatut)

    const matchesEcheance =
      selectedEcheance === "toutes" ||
      getEcheanceStatus(row) === selectedEcheance

    return (
      matchesSearch &&
      matchesType &&
      matchesStatut &&
      matchesEcheance
    )
  })

  const cdiCount = rows.filter(
    (row) => normalize(row.type_contrat) === "cdi"
  ).length

  const cddCount = rows.filter(
    (row) => normalize(row.type_contrat) === "cdd"
  ).length

  const expiringSoonCount = rows.filter(
    (row) => getEcheanceStatus(row) === "bientot"
  ).length

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <Link
          href="/dashboard/rapports"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
        >
          ← Retour aux rapports
        </Link>

        <ReportHeader
          title="Rapport Contrats"
          description="Suivi des contrats, dates, statuts et situations administratives des agents."
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
                placeholder="Agent, grade, cadre d'emploi..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Type de contrat
              </label>

              <select
                name="type_contrat"
                defaultValue={selectedType}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="tous">Tous les types</option>

                {contractTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Statut
              </label>

              <select
                name="statut"
                defaultValue={selectedStatut}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="tous">Tous les statuts</option>

                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
                <option value="en_cours">En cours</option>
                <option value="bientot">Sous 30 jours</option>
                <option value="expire">Expirés</option>
                <option value="sans_fin">Sans date de fin</option>
              </select>
            </div>

            <div className="flex items-end gap-3 xl:col-span-4">
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Afficher
              </button>

              <Link
                href="/dashboard/rapports/contrats"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
              >
                Réinitialiser
              </Link>
            </div>
          </FilterBar>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Contrats"
            value={rows.length}
            tone="blue"
          />

          <StatCard
            title="CDI"
            value={cdiCount}
            tone="green"
          />

          <StatCard
            title="CDD"
            value={cddCount}
            tone="violet"
          />

          <StatCard
            title="Sous 30 jours"
            value={expiringSoonCount}
            tone="yellow"
          />
        </section>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucun contrat"
            description="Aucun contrat ne correspond aux critères sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Contrat",
              "Grade",
              "Cadre d’emploi",
              "Temps de travail",
              "Début",
              "Fin",
              "Échelon / Indice",
              "Statut",
              "Échéance",
            ]}
          >
            {filteredRows.map((row) => {
              const statutBadge = getStatutBadge(row.statut)
              const echeanceBadge = getEcheanceBadge(row)

              return (
                <tr
                  key={row.id}
                  className="text-sm transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.agent?.nom || "Agent non renseigné"}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.type_contrat || "—"}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {row.grade || "—"}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {row.cadre_emploi || "—"}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {row.temps_travail || "—"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.date_debut)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.date_fin)}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {row.echelon || "—"}
                    {row.indice ? ` / ${row.indice}` : ""}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      label={statutBadge.label}
                      tone={statutBadge.tone}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      label={echeanceBadge.label}
                      tone={echeanceBadge.tone}
                    />
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