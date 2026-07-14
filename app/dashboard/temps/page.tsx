import Link from "next/link"
import { supabase } from "@/lib/supabase"
import TempsTableClient from "@/components/agentis/temps/TempsTableClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

type AgentRow = {
  id: string | number
  nom: string
  temps?: number | string | null
  statut?: string | null
}

type PlanningRow = {
  agent_id: string | number | null
  date: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
}

type AgentTimeRow = {
  id: string | number
  nom: string
  tempsHebdomadaire: number
  tauxActivite: number
  heuresRealisees: number
  objectifAnnuel: number
  objectifADate: number
  ecartADate: number
  progressionAnnuelle: number
  progressionADate: number
}

const FULL_TIME_WEEKLY_HOURS = 35
const FULL_TIME_ANNUAL_TARGET = 1607

function normalizeStatus(value?: string | null) {
  return value
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") ?? ""
}

function isCountedPlanningRow(row: PlanningRow) {
  const status = normalizeStatus(row.statut)

  return (
    row.agent_id !== null &&
    status !== "absent" &&
    status !== "absence" &&
    status !== "annule" &&
    status !== "annulee"
  )
}

function timeToMinutes(value?: string | null) {
  if (!value) return null

  const normalized = value.slice(0, 5)
  const [hours, minutes] = normalized.split(":").map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null
  }

  return hours * 60 + minutes
}

function calculateHours(
  start?: string | null,
  end?: string | null
) {
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

/**
 * Accepte notamment :
 * 35
 * "35"
 * "35h"
 * "17H15"
 * "28:00"
 *
 * En cas de valeur inexploitable, l'agent est considéré à 35 h.
 */
function parseWeeklyHours(value?: string | number | null) {
  if (typeof value === "number") {
    return value > 0 && value <= 60
      ? value
      : FULL_TIME_WEEKLY_HOURS
  }

  if (!value) return FULL_TIME_WEEKLY_HOURS

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(",", ".")

  const hourMinuteMatch = normalized.match(
    /^(\d{1,2})\s*[h:]\s*(\d{1,2})?$/
  )

  if (hourMinuteMatch) {
    const hours = Number(hourMinuteMatch[1])
    const minutes = Number(hourMinuteMatch[2] || 0)
    const result = hours + minutes / 60

    return result > 0 && result <= 60
      ? result
      : FULL_TIME_WEEKLY_HOURS
  }

  const numericValue = Number(
    normalized.replace(/[^\d.]/g, "")
  )

  return numericValue > 0 && numericValue <= 60
    ? numericValue
    : FULL_TIME_WEEKLY_HOURS
}

function getDaysInYear(year: number) {
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)

  return Math.round(
    (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

function getElapsedYearRatio(
  year: number,
  referenceDate: Date
) {
  const startOfYear = new Date(year, 0, 1)
  const endOfReferenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + 1
  )

  const elapsedDays = Math.max(
    0,
    Math.round(
      (endOfReferenceDay.getTime() -
        startOfYear.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )

  return Math.min(
    1,
    elapsedDays / getDaysInYear(year)
  )
}

function formatHours(value: number) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} h`
}

function formatDate(value?: string | null) {
  if (!value) return "—"

  return new Date(
    `${value}T12:00:00`
  ).toLocaleDateString("fr-FR")
}

export default async function TempsPage() {
  const today = new Date()
  const currentYear = today.getFullYear()

  const startDate = `${currentYear}-01-01`
  const todayIso = today.toISOString().slice(0, 10)

  const [
    { data: agentsData, error: agentsError },
    { data: planningData, error: planningError },
  ] = await Promise.all([
    supabase
      .from("agents")
      .select("id, nom, temps, statut")
      .order("nom", { ascending: true }),

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
      .lte("date", todayIso),
  ])

  const error = agentsError || planningError

  if (error) {
    return (
      <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
        <div className="mx-auto max-w-[1800px]">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300"
          >
            ← Retour au Dashboard
          </Link>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            Impossible de charger les données Temps &amp; 1607 h :{" "}
            {error.message}
          </div>
        </div>
      </main>
    )
  }

  const agents = (agentsData || []) as AgentRow[]
  const planning = (planningData || []) as PlanningRow[]

  const planningDates = planning
    .map((row) => row.date)
    .filter((date): date is string => Boolean(date))

  const uniquePlanningDates = Array.from(
    new Set(planningDates)
  ).sort()

  const firstPlanningDate =
    uniquePlanningDates[0] || null

  const lastPlanningDate =
    uniquePlanningDates[
      uniquePlanningDates.length - 1
    ] || null

  const referenceDate = lastPlanningDate
    ? new Date(`${lastPlanningDate}T12:00:00`)
    : today

  const elapsedYearRatio = getElapsedYearRatio(
    currentYear,
    referenceDate
  )

  const rows: AgentTimeRow[] = agents.map((agent) => {
    const weeklyHours = parseWeeklyHours(agent.temps)

    const activityRate = Math.min(
      1,
      weeklyHours / FULL_TIME_WEEKLY_HOURS
    )

    const annualTarget =
      FULL_TIME_ANNUAL_TARGET * activityRate

    const targetToDate =
      annualTarget * elapsedYearRatio

    const agentPlanning = planning.filter(
      (item) =>
        String(item.agent_id) === String(agent.id) &&
        isCountedPlanningRow(item)
    )

    const completedHours = agentPlanning.reduce(
      (total, item) =>
        total +
        calculateHours(
          item.heure_debut,
          item.heure_fin
        ),
      0
    )

    const balanceToDate =
      completedHours - targetToDate

    const annualProgress =
      annualTarget > 0
        ? Math.round(
            (completedHours / annualTarget) * 100
          )
        : 0

    const dateProgress =
      targetToDate > 0
        ? Math.round(
            (completedHours / targetToDate) * 100
          )
        : 0

    return {
      id: agent.id,
      nom: agent.nom,
      tempsHebdomadaire: weeklyHours,
      tauxActivite: Math.round(activityRate * 100),
      heuresRealisees: completedHours,
      objectifAnnuel: annualTarget,
      objectifADate: targetToDate,
      ecartADate: balanceToDate,
      progressionAnnuelle: annualProgress,
      progressionADate: dateProgress,
    }
  })

  const totalRealise = rows.reduce(
    (total, row) => total + row.heuresRealisees,
    0
  )

  const totalObjectifADate = rows.reduce(
    (total, row) => total + row.objectifADate,
    0
  )

  const agentsEquilibres = rows.filter(
    (row) => row.ecartADate >= -7
  ).length

  const agentsEnDeficit = rows.filter(
    (row) => row.ecartADate < -7
  ).length

  const dataCoverageIsLow =
    uniquePlanningDates.length < 20

  return (
    <main className="min-h-screen bg-[#020817] p-8 text-slate-100">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl border border-slate-700 bg-[#111827] px-4 py-2 text-sm text-slate-300 transition hover:border-yellow-500/50 hover:text-yellow-300"
        >
          ← Retour au Dashboard
        </Link>

        <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#111827] via-[#07111f] to-[#020817] p-8 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
            AGENTIS
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Temps &amp; 1607 h
          </h1>

          <p className="mt-3 max-w-4xl text-slate-400">
            Suivi des heures planifiées, des objectifs
            proratisés et des écarts à la date du{" "}
            {formatDate(lastPlanningDate || todayIso)}.
          </p>
        </section>

        {dataCoverageIsLow && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-200">
            <p className="font-semibold">
              Données annuelles encore incomplètes
            </p>

            <p className="mt-1 text-yellow-100/70">
              Le planning contient actuellement{" "}
              {uniquePlanningDates.length} journée
              {uniquePlanningDates.length > 1 ? "s" : ""}{" "}
              distincte
              {uniquePlanningDates.length > 1 ? "s" : ""}
              {firstPlanningDate && lastPlanningDate
                ? `, du ${formatDate(firstPlanningDate)} au ${formatDate(lastPlanningDate)}`
                : ""}
              . Les soldes deviendront pleinement représentatifs
              après l’import du planning de l’année.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Agents suivis"
            value={String(rows.length)}
          />

          <StatCard
            title="Heures planifiées"
            value={formatHours(totalRealise)}
          />

          <StatCard
            title="Objectif théorique à date"
            value={formatHours(totalObjectifADate)}
            tone="blue"
          />

          <StatCard
            title="Agents à surveiller"
            value={String(agentsEnDeficit)}
            tone={
              agentsEnDeficit > 0 ? "red" : "green"
            }
          />
        </div>

        <TempsTableClient rows={rows} />

        <p className="text-xs text-slate-600">
          Calcul V1 : l’objectif à date est proratisé
          selon la progression calendaire de l’année et le
          temps hebdomadaire enregistré. Les congés, jours
          fériés, cycles annualisés et autorisations
          d’absence seront intégrés dans une évolution
          ultérieure du moteur.
        </p>
      </div>
    </main>
  )
}

function StatCard({
  title,
  value,
  tone = "slate",
}: {
  title: string
  value: string
  tone?: "slate" | "green" | "red" | "blue"
}) {
  const styles = {
    slate:
      "border-slate-800 bg-[#0f172a] text-white",
    green:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    red:
      "border-red-500/30 bg-red-500/10 text-red-300",
    blue:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  }

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[tone]}`}
    >
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const normalizedValue = Math.max(
    0,
    Math.min(100, value)
  )

  return (
    <div className="min-w-[180px]">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Objectif à date
        </span>

        <span className="font-semibold text-slate-300">
          {value} %
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
          style={{
            width: `${normalizedValue}%`,
          }}
        />
      </div>
    </div>
  )
}

function StatusBadge({
  ecart,
}: {
  ecart: number
}) {
  if (ecart >= 7) {
    return (
      <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
        En avance
      </span>
    )
  }

  if (ecart >= -7) {
    return (
      <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        Équilibré
      </span>
    )
  }

  return (
    <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
      À surveiller
    </span>
  )
}