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

import {
  PresenceReportService,
  type PresenceReportRow,
} from "@/lib/services/reports/PresenceReportService"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<{
    date?: string
  }>
}

type RawPlanningRow = Omit<
  PresenceReportRow,
  "agent" | "site"
> & {
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

function formatDate(value: string) {
  return new Date(
    `${value}T12:00:00`
  ).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatTime(
  value?: string | null
) {
  if (!value) {
    return "—"
  }

  return value
    .slice(0, 5)
    .replace(":", "h")
}

function normalizeRows(
  rows: RawPlanningRow[] | null
): PresenceReportRow[] {
  return (rows || []).map(
    (row) => ({
      ...row,

      agent: Array.isArray(
        row.agent
      )
        ? row.agent[0] ?? null
        : row.agent ?? null,

      site: Array.isArray(
        row.site
      )
        ? row.site[0] ?? null
        : row.site ?? null,
    })
  )
}

export default async function PresencesReportPage({
  searchParams,
}: PageProps) {
  /*
   * =====================================================
   * SUPABASE SERVEUR
   * =====================================================
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
   * =====================================================
   * PARAMÈTRES
   * =====================================================
   */

  const params = searchParams
    ? await searchParams
    : undefined

  let selectedDate =
    params?.date ||
    new Date()
      .toISOString()
      .slice(0, 10)

  /*
   * =====================================================
   * CHARGEMENT DU PLANNING
   *
   * La RLS de planning_journalier doit appliquer
   * le périmètre du rôle connecté.
   * =====================================================
   */

  async function loadPlanning(
    date: string
  ) {
    return supabase
      .from("planning_journalier")
      .select(`
        id,
        date,
        statut,
        heure_debut,
        heure_fin,
        service,
        commentaire,
        agent:agent_id (
          id,
          nom
        ),
        site:site_id (
          id,
          nom
        )
      `)
      .eq("date", date)
      .order("heure_debut", {
        ascending: true,
      })
  }

  let {
    data: planning,
    error,
  } = await loadPlanning(
    selectedDate
  )

  /*
   * Si aucune date n'a été choisie et
   * qu'aujourd'hui ne contient aucune donnée,
   * on cherche la dernière date disponible
   * DANS LE PÉRIMÈTRE AUTORISÉ PAR LA RLS.
   */

  if (
    !params?.date &&
    !error &&
    (!planning ||
      planning.length === 0)
  ) {
    const {
      data: latestDateRow,
      error: latestDateError,
    } = await supabase
      .from("planning_journalier")
      .select("date")
      .not("date", "is", null)
      .order("date", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (latestDateError) {
      error = latestDateError
    } else if (
      latestDateRow?.date
    ) {
      selectedDate =
        latestDateRow.date

      const result =
        await loadPlanning(
          selectedDate
        )

      planning = result.data
      error = result.error
    }
  }

  /*
   * =====================================================
   * ERREUR
   * =====================================================
   */

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
   * =====================================================
   * NORMALISATION
   * =====================================================
   */

  const normalizedRows =
    normalizeRows(
      (planning ||
        []) as RawPlanningRow[]
    )

  const report =
    PresenceReportService.build(
      PresenceReportService.sortRows(
        normalizedRows
      )
    )

  /*
   * =====================================================
   * AFFICHAGE
   * =====================================================
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
          title="Rapport Présences & Absences"
          description={`Situation des agents pour le ${formatDate(
            selectedDate
          )}.`}
        />

        <form method="GET">
          <FilterBar title="Filtres du rapport">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Date du rapport
              </label>

              <input
                type="date"
                name="date"
                defaultValue={
                  selectedDate
                }
                className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400"
              />
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Affectations"
            value={
              report.stats.total
            }
          />

          <StatCard
            title="Présents"
            value={
              report.stats.presents
            }
            tone="green"
          />

          <StatCard
            title="Absents"
            value={
              report.stats.absents
            }
            tone="red"
          />

          <StatCard
            title="Remplacements"
            value={
              report.stats
                .replacements
            }
            tone="violet"
          />

          <StatCard
            title="Taux de présence"
            value={`${report.stats.attendanceRate} %`}
            tone="cyan"
          />
        </section>

        <ActionBar title="Détail de la journée">
          <Link
            href={`/dashboard/rapports/planning?date=${selectedDate}`}
            className="rounded-xl border border-cyan-500/30 px-5 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
          >
            Voir le planning
            journalier
          </Link>
        </ActionBar>

        {report.rows.length ===
        0 ? (
          <EmptyState
            title="Aucune donnée disponible"
            description="Aucune présence, absence ou affectation n’est enregistrée pour cette journée."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Site",
              "Service",
              "Horaire",
              "Statut",
              "Commentaire",
            ]}
          >
            {report.rows.map(
              (row) => {
                const badge =
                  PresenceReportService.getBadge(
                    row.statut
                  )

                return (
                  <tr
                    key={row.id}
                    className="border-t border-slate-800 text-sm transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 font-medium text-white">
                      {row.agent
                        ?.nom ||
                        "Agent non renseigné"}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {row.site
                        ?.nom ||
                        "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {row.service ||
                        "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                      {formatTime(
                        row.heure_debut
                      )}
                      {" – "}
                      {formatTime(
                        row.heure_fin
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        label={
                          badge.label
                        }
                        tone={
                          badge.tone
                        }
                      />
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {row.commentaire ||
                        "—"}
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