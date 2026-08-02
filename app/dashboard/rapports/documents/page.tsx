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
    categorie?: string
    echeance?: string
  }>
}

type AgentRelation = {
  id: string | number
  nom: string | null
}

type RawDocumentRow = {
  id: string | number
  agent_id: string | number
  categorie: string | null
  nom: string | null
  fichier_url: string | null
  date_document: string | null
  date_expiration: string | null
  commentaire: string | null
  created_at?: string | null
  agent?: AgentRelation | AgentRelation[] | null
}

type DocumentRow = Omit<RawDocumentRow, "agent"> & {
  agent?: AgentRelation | null
}

type EcheanceStatus =
  | "valide"
  | "bientot"
  | "expire"
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

function normalizeRows(rows: RawDocumentRow[] | null): DocumentRow[] {
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

function getEcheanceStatus(row: DocumentRow): EcheanceStatus {
  const days = getDaysUntil(row.date_expiration)

  if (days === null) return "sans_expiration"
  if (days < 0) return "expire"
  if (days <= 30) return "bientot"

  return "valide"
}

function getBadge(row: DocumentRow) {
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

export default async function DocumentsReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined

  const search = params?.recherche?.trim() || ""
  const selectedCategorie = params?.categorie || "toutes"
  const selectedEcheance = params?.echeance || "toutes"

  const { data, error } = await supabase
    .from("agent_documents")
    .select(`
      id,
      agent_id,
      categorie,
      nom,
      fichier_url,
      date_document,
      date_expiration,
      commentaire,
      created_at,
      agent:agent_id (
        id,
        nom
      )
    `)
    .order("date_document", { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
        <div className="mx-auto w-full max-w-[1650px] space-y-6">
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

  const rows = normalizeRows((data || []) as RawDocumentRow[])

  const categories = Array.from(
    new Set(
      rows
        .map((row) => row.categorie?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((first, second) => first.localeCompare(second, "fr"))

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !search ||
      [
        row.agent?.nom,
        row.categorie,
        row.nom,
        row.commentaire,
      ].some((value) =>
        normalize(value).includes(normalize(search))
      )

    const matchesCategorie =
      selectedCategorie === "toutes" ||
      normalize(row.categorie) === normalize(selectedCategorie)

    const matchesEcheance =
      selectedEcheance === "toutes" ||
      getEcheanceStatus(row) === selectedEcheance

    return (
      matchesSearch &&
      matchesCategorie &&
      matchesEcheance
    )
  })

  const expiringSoonCount = rows.filter(
    (row) => getEcheanceStatus(row) === "bientot"
  ).length

  const expiredCount = rows.filter(
    (row) => getEcheanceStatus(row) === "expire"
  ).length

  const agentsConcerned = new Set(
    rows.map((row) => String(row.agent_id))
  ).size

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-[1650px] space-y-6">
        <Link
          href="/dashboard/rapports"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
        >
          ← Retour aux rapports
        </Link>

        <ReportHeader
          title="Rapport Documents RH"
          description="Suivi des documents RH, catégories et échéances associées aux agents."
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
                placeholder="Agent, document, catégorie..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Catégorie
              </label>

              <select
                name="categorie"
                defaultValue={selectedCategorie}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="toutes">Toutes les catégories</option>

                {categories.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {categorie}
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
                <option value="valide">Valides</option>
                <option value="bientot">Sous 30 jours</option>
                <option value="expire">Expirés</option>
                <option value="sans_expiration">
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
                href="/dashboard/rapports/documents"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
              >
                Effacer
              </Link>
            </div>
          </FilterBar>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Documents"
            value={rows.length}
            tone="blue"
          />

          <StatCard
            title="Agents concernés"
            value={agentsConcerned}
            tone="cyan"
          />

          <StatCard
            title="Sous 30 jours"
            value={expiringSoonCount}
            tone="yellow"
          />

          <StatCard
            title="Expirés"
            value={expiredCount}
            tone="red"
          />
        </section>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucun document RH"
            description="Aucun document ne correspond aux critères sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Document",
              "Catégorie",
              "Date du document",
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
                    {row.nom || "Document non renseigné"}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {row.categorie || "—"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(row.date_document)}
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