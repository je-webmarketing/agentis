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
    annee?: string
    search?: string
  }>
}

type AgentRow = {
  id: string | number
  nom: string | null
  statut: string | null
  temps: string | number | null
}

type PlanningRow = {
  agent_id: string | number | null
  date: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
}

type TimeReportRow = {
  id: string | number
  nom: string
  statut: string
  tempsHebdomadaire: number
  objectifAnnuel: number
  objectifADate: number
  heuresRealisees: number
  ecart: number
  progression: number
}

const ANNUAL_FULL_TIME_HOURS = 1607
const FULL_TIME_WEEKLY_HOURS = 35

function normalizeText(
  value: string | null | undefined
): string {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function parseWeeklyHours(
  value: string | number | null
): number {
  if (typeof value === "number") {
    return value > 0
      ? value
      : FULL_TIME_WEEKLY_HOURS
  }

  const normalized = normalizeText(value)

  if (!normalized) {
    return FULL_TIME_WEEKLY_HOURS
  }

  if (
    normalized.includes("temps complet") ||
    normalized.includes("complet")
  ) {
    return FULL_TIME_WEEKLY_HOURS
  }

  const match = normalized
    .replace(",", ".")
    .match(/\d+(?:\.\d+)?/)

  if (!match) {
    return FULL_TIME_WEEKLY_HOURS
  }

  const hours = Number(match[0])

  return Number.isFinite(hours) && hours > 0
    ? hours
    : FULL_TIME_WEEKLY_HOURS
}

function timeToMinutes(
  value: string | null
): number | null {
  if (!value) return null

  const [hours, minutes] = value
    .slice(0, 5)
    .split(":")
    .map(Number)

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null
  }

  return hours * 60 + minutes
}

function getDurationHours(
  start: string | null,
  end: string | null
): number {
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return 0
  }

  return (endMinutes - startMinutes) / 60
}

function isWorkedStatus(
  status: string | null
): boolean {
  const normalized = normalizeText(status)

  return (
    normalized === "présent" ||
    normalized === "present" ||
    normalized === "remplacé" ||
    normalized === "remplace"
  )
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100
}

function getYearProgress(
  year: number
): number {
  const now = new Date()
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)

  if (now <= start) return 0
  if (now >= end) return 1

  return (
    (now.getTime() - start.getTime()) /
    (end.getTime() - start.getTime())
  )
}

function getStatusTone(
  ecart: number
): "green" | "red" | "cyan" {
  if (ecart >= -10) return "green"
  if (ecart >= -50) return "cyan"
  return "red"
}

function getStatusLabel(
  ecart: number
): string {
  if (ecart >= -10) return "Conforme"
  if (ecart >= -50) return "À surveiller"
  return "Écart important"
}

export default async function TempsReportPage({
  searchParams,
}: PageProps) {
  const params = searchParams
    ? await searchParams
    : undefined

  const currentYear = new Date().getFullYear()

  const parsedYear = Number(params?.annee)

  const selectedYear =
    Number.isInteger(parsedYear) &&
    parsedYear >= 2000 &&
    parsedYear <= 2100
      ? parsedYear
      : currentYear

  const search =
    params?.search?.trim() || ""

  const startDate = `${selectedYear}-01-01`
  const endDate = `${selectedYear}-12-31`

  const [
    agentsResult,
    planningResult,
  ] = await Promise.all([
    supabase
      .from("agents")
      .select(`
        id,
        nom,
        statut,
        temps
      `)
      .order("nom", {
        ascending: true,
      }),

    supabase
      .from("planning_journalier")
      .select(`
        agent_id,
        date,
        heure_debut,
        heure_fin,
        statut
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .not("agent_id", "is", null),
  ])

  const firstError =
    agentsResult.error ||
    planningResult.error

  if (firstError) {
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
            {firstError.message}
          </div>
        </div>
      </main>
    )
  }

  const agents =
    (agentsResult.data || []) as AgentRow[]

  const planning =
    (planningResult.data || []) as PlanningRow[]

  const hoursByAgent =
    new Map<string, number>()

  for (const assignment of planning) {
    if (
      assignment.agent_id === null ||
      !isWorkedStatus(assignment.statut)
    ) {
      continue
    }

    const agentId =
      String(assignment.agent_id)

    const duration = getDurationHours(
      assignment.heure_debut,
      assignment.heure_fin
    )

    hoursByAgent.set(
      agentId,
      (hoursByAgent.get(agentId) || 0) +
        duration
    )
  }

  const yearProgress =
    getYearProgress(selectedYear)

  const rows: TimeReportRow[] =
    agents.map((agent) => {
      const weeklyHours =
        parseWeeklyHours(agent.temps)

      const annualObjective =
        ANNUAL_FULL_TIME_HOURS *
        (weeklyHours /
          FULL_TIME_WEEKLY_HOURS)

      const objectiveToDate =
        annualObjective * yearProgress

      const completedHours =
        hoursByAgent.get(
          String(agent.id)
        ) || 0

      const difference =
        completedHours - objectiveToDate

      const progression =
        annualObjective > 0
          ? Math.round(
              (completedHours /
                annualObjective) *
                100
            )
          : 0

      return {
        id: agent.id,
        nom:
          agent.nom ||
          "Agent non renseigné",
        statut:
          agent.statut ||
          "Non renseigné",
        tempsHebdomadaire:
          roundHours(weeklyHours),
        objectifAnnuel:
          roundHours(annualObjective),
        objectifADate:
          roundHours(objectiveToDate),
        heuresRealisees:
          roundHours(completedHours),
        ecart:
          roundHours(difference),
        progression,
      }
    })

  const filteredRows = rows.filter(
    (row) =>
      !search ||
      normalizeText(row.nom).includes(
        normalizeText(search)
      )
  )

  const totalObjective = rows.reduce(
    (total, row) =>
      total + row.objectifAnnuel,
    0
  )

  const totalCompleted = rows.reduce(
    (total, row) =>
      total + row.heuresRealisees,
    0
  )

  const totalObjectiveToDate =
    rows.reduce(
      (total, row) =>
        total + row.objectifADate,
      0
    )

  const globalDifference =
    totalCompleted -
    totalObjectiveToDate

  const agentsToMonitor =
    rows.filter(
      (row) => row.ecart < -10
    ).length

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
          title="Rapport Temps & 1607 h"
          description={`Suivi des heures planifiées, des objectifs annualisés et des écarts pour l’année ${selectedYear}.`}
        />

        <form method="GET">
          <FilterBar title="Filtres du rapport">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Année
              </label>

              <input
                type="number"
                name="annee"
                min="2000"
                max="2100"
                defaultValue={selectedYear}
                className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Agent
              </label>

              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Rechercher un agent..."
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
            title="Agents"
            value={rows.length}
          />

          <StatCard
            title="Objectif annuel"
            value={`${roundHours(
              totalObjective
            )} h`}
            tone="cyan"
          />

          <StatCard
            title="Heures réalisées"
            value={`${roundHours(
              totalCompleted
            )} h`}
            tone="green"
          />

          <StatCard
            title="Écart à date"
            value={`${roundHours(
              globalDifference
            )} h`}
            tone={
              globalDifference >= -10
                ? "green"
                : "red"
            }
          />

          <StatCard
            title="À surveiller"
            value={agentsToMonitor}
            tone={
              agentsToMonitor > 0
                ? "red"
                : "green"
            }
          />
        </section>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="Aucune donnée disponible"
            description="Aucun agent ne correspond aux filtres sélectionnés."
          />
        ) : (
          <DataTable
            headers={[
              "Agent",
              "Statut",
              "Temps hebdo.",
              "Objectif annuel",
              "Objectif à date",
              "Réalisées",
              "Écart",
              "Progression",
              "Situation",
            ]}
          >
            {filteredRows.map((row) => (
              <tr
                key={String(row.id)}
                className="border-t border-slate-800 text-sm transition hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4 font-medium text-white">
                  {row.nom}
                </td>

                <td className="px-5 py-4 text-slate-300">
                  {row.statut}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                  {row.tempsHebdomadaire} h
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                  {row.objectifAnnuel} h
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                  {row.objectifADate} h
                </td>

                <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-300">
                  {row.heuresRealisees} h
                </td>

                <td
                  className={`whitespace-nowrap px-5 py-4 font-semibold ${
                    row.ecart >= -10
                      ? "text-emerald-300"
                      : "text-red-300"
                  }`}
                >
                  {row.ecart > 0 ? "+" : ""}
                  {row.ecart} h
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                  {row.progression} %
                </td>

                <td className="px-5 py-4">
                  <StatusBadge
                    label={getStatusLabel(
                      row.ecart
                    )}
                    tone={getStatusTone(
                      row.ecart
                    )}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </main>
  )
}