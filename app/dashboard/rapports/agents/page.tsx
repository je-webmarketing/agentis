import Link from "next/link"
import { redirect } from "next/navigation"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"

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
    search?: string
    statut?: string
  }>
}

type Relation = {
  id: string | number
  nom: string | null
}

type RawAgentRow = {
  id: string | number
  nom: string | null
  statut: string | null
  temps: string | number | null

  poste:
    | Relation
    | Relation[]
    | null

  service:
    | Relation
    | Relation[]
    | null

  site:
    | Relation
    | Relation[]
    | null
}

type AgentRow = Omit<
  RawAgentRow,
  "poste" | "service" | "site"
> & {
  poste: Relation | null
  service: Relation | null
  site: Relation | null
}

function normalizeRelation(
  value: Relation | Relation[] | null
): Relation | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function normalizeText(
  value: string | null | undefined
): string {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function formatTemps(
  value: string | number | null
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—"
  }

  if (typeof value === "number") {
    return `${value} h`
  }

  return value
}

export default async function AgentsReportPage({
  searchParams,
}: PageProps) {
  /*
   * =======================================================
   * SUPABASE SERVEUR
   *
   * Important :
   * permet aux RLS de connaître auth.uid()
   * et donc le périmètre du rôle connecté.
   * =======================================================
   */

  const supabase =
    await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  /*
   * =======================================================
   * PARAMÈTRES DU RAPPORT
   * =======================================================
   */

  const params = searchParams
    ? await searchParams
    : undefined

  const search =
    params?.search?.trim() || ""

  const statut =
    params?.statut?.trim() || "tous"

  /*
   * =======================================================
   * AGENTS
   *
   * Aucun filtre de rôle n'est codé ici.
   *
   * La RLS public.agents applique déjà :
   *
   * super_admin       -> tous
   * admin_rh          -> tous
   * responsable_rh    -> structure
   * responsable_site  -> site
   * chef_service      -> service
   * agent             -> lui-même
   * =======================================================
   */

  const {
    data,
    error,
  } = await supabase
    .from("agents")
    .select(`
      id,
      nom,
      statut,
      temps,
      poste:poste_id (
        id,
        nom
      ),
      service:service_id (
        id,
        nom
      ),
      site:site_id (
        id,
        nom
      )
    `)
    .order("nom", {
      ascending: true,
    })

  if (error) {
    return (
      <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
        <div className="mx-auto w-full max-w-[1800px] space-y-6">
          <Link
            href="/dashboard/rapports"
            className="inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
          >
            ← Retour aux rapports
          </Link>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            Impossible de charger le rapport :{" "}
            {error.message}
          </div>
        </div>
      </main>
    )
  }

  /*
   * =======================================================
   * NORMALISATION
   * =======================================================
   */

  const rows: AgentRow[] = (
    (data || []) as RawAgentRow[]
  ).map((row) => ({
    ...row,
    poste:
      normalizeRelation(row.poste),
    service:
      normalizeRelation(row.service),
    site:
      normalizeRelation(row.site),
  }))

  /*
   * =======================================================
   * FILTRES UTILISATEUR
   * =======================================================
   */

  const filteredRows =
    rows.filter((row) => {
      const matchesSearch =
        !search ||
        [
          row.nom,
          row.poste?.nom,
          row.service?.nom,
          row.site?.nom,
        ].some((value) =>
          normalizeText(value).includes(
            normalizeText(search)
          )
        )

      const matchesStatus =
        statut === "tous" ||
        normalizeText(
          row.statut
        ) === normalizeText(statut)

      return (
        matchesSearch &&
        matchesStatus
      )
    })

  /*
   * =======================================================
   * STATISTIQUES
   * =======================================================
   */

  const activeAgents =
    rows.filter(
      (row) =>
        normalizeText(
          row.statut
        ) === "actif"
    ).length

  const inactiveAgents =
    rows.filter(
      (row) =>
        normalizeText(
          row.statut
        ) !== "actif"
    ).length

  const incompleteAgents =
    rows.filter(
      (row) =>
        !row.poste ||
        !row.service ||
        !row.site
    ).length

  /*
   * =======================================================
   * AFFICHAGE
   * =======================================================
   */

  return (
    <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <Link
          href="/dashboard/rapports"
          className="inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
        >
          ← Retour aux rapports
        </Link>

        <ReportHeader
          title="Rapport Liste des agents"
          description="Vue consolidée des agents, de leur statut et de leur rattachement organisationnel."
        />

        <form method="GET">
          <FilterBar title="Filtres du rapport">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Recherche
              </label>

              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Nom, site, service ou poste..."
                className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Statut
              </label>

              <select
                name="statut"
                defaultValue={statut}
                className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400"
              >
                <option value="tous">
                  Tous les statuts
                </option>

                <option value="Actif">
                  Actifs
                </option>

                <option value="Inactif">
                  Inactifs
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
              >
                Afficher
              </button>
            </div>
          </FilterBar>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Agents"
            value={rows.length}
          />

          <StatCard
            title="Actifs"
            value={activeAgents}
            tone="green"
          />

          <StatCard
            title="Inactifs"
            value={inactiveAgents}
            tone="red"
          />

          <StatCard
            title="Dossiers incomplets"
            value={incompleteAgents}
          />
        </section>

        <ActionBar title="Liste des agents">
          <span className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300">
            {filteredRows.length} résultat
            {filteredRows.length > 1
              ? "s"
              : ""}
          </span>
        </ActionBar>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucun agent trouvé"
            description="Aucun agent ne correspond aux filtres sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Statut",
              "Site principal",
              "Service",
              "Poste",
              "Temps",
            ]}
          >
            {filteredRows.map(
              (row) => {
                const isActive =
                  normalizeText(
                    row.statut
                  ) === "actif"

                return (
                  <tr
                    key={String(
                      row.id
                    )}
                    className="border-t border-slate-800 text-sm transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 font-medium text-white">
                      {row.nom ||
                        "Agent non renseigné"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        label={
                          row.statut ||
                          "Non renseigné"
                        }
                        tone={
                          isActive
                            ? "green"
                            : "red"
                        }
                      />
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {row.site
                        ?.nom ||
                        "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {row.service
                        ?.nom ||
                        "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {row.poste
                        ?.nom ||
                        "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {formatTemps(
                        row.temps
                      )}
                    </td>
                  </tr>
                )
              }
            )}
          </DataTable>
        )}
      </div>
    </main>
  )
}