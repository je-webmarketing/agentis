import Link from "next/link"

import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Clock3,
  Target,
  UserCheck,
  UsersRound,
} from "lucide-react"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"

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

type WeeklyCycleRow = {
  agent_id: string | number
  jour_semaine: string | null
  heure_debut: string | null
  heure_fin: string | null
  actif: boolean | null
}

type AgentTimeRow = {
  id: string | number
  nom: string

  tempsHebdomadaire: number
  tauxActivite: number

  heuresRealisees: number
  heuresNeutralisees: number
  heuresComptabilisees: number

  objectifAnnuel: number
  objectifADate: number
  ecartADate: number

  progressionAnnuelle: number
  progressionADate: number
}

type AbsenceRow = {
  agent_id: string | number | null
  type: string | null
  date_debut: string | null
  date_fin: string | null
  statut_validation: string | null
}

const FULL_TIME_WEEKLY_HOURS = 35
const FULL_TIME_ANNUAL_TARGET = 1607

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeStatus(
  value?: string | null
) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      ) ?? ""
  )
}

function isCountedPlanningRow(
  row: PlanningRow
) {
  const status =
    normalizeStatus(
      row.statut
    )

  return (
    row.agent_id !== null &&
    status !== "absent" &&
    status !== "absence" &&
    status !== "annule" &&
    status !== "annulee"
  )
}

function timeToMinutes(
  value?: string | null
) {
  if (!value) {
    return null
  }

  const normalized =
    value.slice(0, 5)

  const [
    hours,
    minutes,
  ] =
    normalized
      .split(":")
      .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null
  }

  return (
    hours * 60 +
    minutes
  )
}

function calculateHours(
  start?: string | null,
  end?: string | null
) {
  const startMinutes =
    timeToMinutes(start)

  const endMinutes =
    timeToMinutes(end)

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return 0
  }

  return (
    (endMinutes -
      startMinutes) /
    60
  )
}

function getIsoWeekday(
  dateValue?: string | null
) {
  if (!dateValue) {
    return null
  }

  const date =
    new Date(
      `${dateValue}T12:00:00`
    )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null
  }

  const day =
    date.getDay()

  // lundi = 1 ... dimanche = 7
  return day === 0
    ? 7
    : day
}

function getCycleHoursForDate(
  cycles: WeeklyCycleRow[],
  agentId: string | number,
  dateValue?: string | null
) {
  const weekday =
    getIsoWeekday(
      dateValue
    )

  if (weekday === null) {
    return 0
  }

  return cycles
    .filter(
      (cycle) =>
        String(
          cycle.agent_id
        ) ===
          String(
            agentId
          ) &&
        Number(
          cycle.jour_semaine
        ) ===
          weekday &&
        cycle.actif !== false
    )
    .reduce(
      (total, cycle) =>
        total +
        calculateHours(
          cycle.heure_debut,
          cycle.heure_fin
        ),
      0
    )
}

/*
 * Accepte notamment :
 *
 * 35
 * "35"
 * "35h"
 * "17H15"
 * "28:00"
 *
 * Si la valeur est inexploitable :
 * 35 h par défaut.
 */

function parseWeeklyHours(
  value?:
    | string
    | number
    | null
) {
  if (
    typeof value ===
    "number"
  ) {
    return (
      value > 0 &&
      value <= 60
        ? value
        : FULL_TIME_WEEKLY_HOURS
    )
  }

  if (!value) {
    return FULL_TIME_WEEKLY_HOURS
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase()
      .replace(",", ".")

  const hourMinuteMatch =
    normalized.match(
      /^(\d{1,2})\s*[h:]\s*(\d{1,2})?$/
    )

  if (hourMinuteMatch) {
    const hours =
      Number(
        hourMinuteMatch[1]
      )

    const minutes =
      Number(
        hourMinuteMatch[2] ||
          0
      )

    const result =
      hours +
      minutes / 60

    return (
      result > 0 &&
      result <= 60
        ? result
        : FULL_TIME_WEEKLY_HOURS
    )
  }

  const numericValue =
    Number(
      normalized.replace(
        /[^\d.]/g,
        ""
      )
    )

  return (
    numericValue > 0 &&
    numericValue <= 60
      ? numericValue
      : FULL_TIME_WEEKLY_HOURS
  )
}

function getDaysInYear(
  year: number
) {
  const start =
    new Date(
      year,
      0,
      1
    )

  const end =
    new Date(
      year + 1,
      0,
      1
    )

  return Math.round(
    (
      end.getTime() -
      start.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      )
  )
}

function getElapsedYearRatio(
  year: number,
  referenceDate: Date
) {
  const startOfYear =
    new Date(
      year,
      0,
      1
    )

  const endOfReferenceDay =
    new Date(
      referenceDate
        .getFullYear(),

      referenceDate
        .getMonth(),

      referenceDate
        .getDate() + 1
    )

  const elapsedDays =
    Math.max(
      0,
      Math.round(
        (
          endOfReferenceDay
            .getTime() -
          startOfYear
            .getTime()
        ) /
          (
            1000 *
            60 *
            60 *
            24
          )
      )
    )

  return Math.min(
    1,
    elapsedDays /
      getDaysInYear(
        year
      )
  )
}

function formatHours(
  value: number
) {
  return `${value.toLocaleString(
    "fr-FR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }
  )} h`
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "—"
  }

  return new Date(
    `${value}T12:00:00`
  ).toLocaleDateString(
    "fr-FR"
  )
}

const NEUTRALIZED_ABSENCE_TYPES =
  new Set([
    "conge",
    "rtt",
    "maladie",
    "formation",
  ])

function normalizeAbsenceValue(
  value?: string | null
) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      ) ?? ""
  )
}

function isNeutralizedAbsence(
  absence: AbsenceRow
) {
  return (
    normalizeAbsenceValue(
      absence.statut_validation
    ) === "validee" &&
    NEUTRALIZED_ABSENCE_TYPES.has(
      normalizeAbsenceValue(
        absence.type
      )
    )
  )
}

function getIsoDate(
  date: Date
) {
  return date
    .toISOString()
    .slice(
      0,
      10
    )
}

function getNeutralizedDates({
  absences,
  startDate,
  endDate,
}: {
  absences: AbsenceRow[]
  startDate: string
  endDate: string
}) {
  const dates =
    new Set<string>()

  for (
    const absence
    of absences
  ) {
    if (
      !isNeutralizedAbsence(
        absence
      ) ||
      !absence.date_debut ||
      !absence.date_fin
    ) {
      continue
    }

    const effectiveStart =
      absence.date_debut >
      startDate
        ? absence.date_debut
        : startDate

    const effectiveEnd =
      absence.date_fin <
      endDate
        ? absence.date_fin
        : endDate

    if (
      effectiveEnd <
      effectiveStart
    ) {
      continue
    }

    const current =
      new Date(
        `${effectiveStart}T12:00:00`
      )

    const end =
      new Date(
        `${effectiveEnd}T12:00:00`
      )

    while (
      current <= end
    ) {
      const day =
        current.getDay()

      /*
       * V1 :
       * samedi et dimanche
       * ne neutralisent rien.
       */
      if (
        day !== 0 &&
        day !== 6
      ) {
        dates.add(
          getIsoDate(
            current
          )
        )
      }

      current.setDate(
        current.getDate() +
          1
      )
    }
  }

  return dates
}

function getWeeklyCycleHours(
  cycles: WeeklyCycleRow[]
) {
  return cycles.reduce(
    (total, cycle) => {
      if (cycle.actif === false) {
        return total
      }

      return (
        total +
        calculateHours(
          cycle.heure_debut,
          cycle.heure_fin
        )
      )
    },
    0
  )
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default async function TempsPage() {
  const supabase =
    await createServerSupabaseClient()

  const today =
    new Date()

  const currentYear =
    today.getFullYear()

  const startDate =
    `${currentYear}-01-01`

  const todayIso =
    today
      .toISOString()
      .slice(
        0,
        10
      )

  /*
   * =======================================================
   * CHARGEMENT
   *
   * Le client serveur transporte la session utilisateur.
   * Les règles RLS de Supabase peuvent donc appliquer
   * le périmètre réel de l'utilisateur connecté.
   * =======================================================
   */

 const [
  agentsResult,
  planningResult,
  absencesResult,
  cyclesResult,
] = await Promise.all([
  supabase
    .from("agents")
    .select(`
      id,
      nom,
      temps,
      statut
    `)
    .order(
      "nom",
      {
        ascending: true,
      }
    ),

  supabase
    .from(
      "planning_journalier"
    )
    .select(`
      agent_id,
      date,
      heure_debut,
      heure_fin,
      statut
    `)
    .gte(
      "date",
      startDate
    )
    .lte(
      "date",
      todayIso
    ),

 supabase
  .from("absences")
  .select(`
    agent_id,
    type,
    date_debut,
    date_fin,
    statut_validation
  `)
  .lte(
    "date_debut",
    todayIso
  )
  .gte(
    "date_fin",
    startDate
  ),

supabase
  .from("agent_cycle_hebdomadaire")
  .select(`
    agent_id,
    jour_semaine,
    heure_debut,
    heure_fin,
    actif
  `),
])

  const error =
  agentsResult.error ||
  planningResult.error ||
  absencesResult.error ||
  cyclesResult.error

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
        <div className="mx-auto w-full max-w-[1800px] space-y-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au Dashboard
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p className="font-bold">
              Impossible de charger les données Temps &amp; 1607 h
            </p>

            <p className="mt-1">
              {error.message}
            </p>
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

  const agents =
    (
      agentsResult.data ||
      []
    ) as AgentRow[]

  const planning =
    (
      planningResult.data ||
      []
    ) as PlanningRow[]

  const absences =
  (
    absencesResult.data ||
    []
  ) as AbsenceRow[]

  const weeklyCycles =
  (
    cyclesResult.data ||
    []
  ) as WeeklyCycleRow[]
  
  /*
   * =======================================================
   * COUVERTURE DU PLANNING
   * =======================================================
   */

  const planningDates =
    planning
      .map(
        (row) =>
          row.date
      )
      .filter(
        (
          date
        ): date is string =>
          Boolean(date)
      )

  const uniquePlanningDates =
    Array.from(
      new Set(
        planningDates
      )
    ).sort()

  const firstPlanningDate =
    uniquePlanningDates[0] ||
    null

  const lastPlanningDate =
    uniquePlanningDates[
      uniquePlanningDates.length -
        1
    ] || null

  /*
   * Si un planning existe, on calcule
   * l'objectif à la dernière date réellement importée.
   *
   * Sinon on utilise la date du jour.
   */

  const referenceDate =
    lastPlanningDate
      ? new Date(
          `${lastPlanningDate}T12:00:00`
        )
      : today

  const elapsedYearRatio =
    getElapsedYearRatio(
      currentYear,
      referenceDate
    )

  /*
   * =======================================================
   * CALCUL PAR AGENT
   * =======================================================
   */

  const rows: AgentTimeRow[] =
    agents.map(
      (agent) => {
        const agentCycles =
  weeklyCycles.filter(
    (cycle) =>
      String(cycle.agent_id) ===
      String(agent.id)
  )

const cycleWeeklyHours =
  getWeeklyCycleHours(
    agentCycles
  )

const weeklyHours =
  cycleWeeklyHours > 0
    ? cycleWeeklyHours
    : parseWeeklyHours(
        agent.temps
      )

        const activityRate =
          Math.min(
            1,
            weeklyHours /
              FULL_TIME_WEEKLY_HOURS
          )

        const annualTarget =
          FULL_TIME_ANNUAL_TARGET *
          activityRate

        const targetToDate =
          annualTarget *
          elapsedYearRatio

        const agentPlanning =
          planning.filter(
            (item) =>
              String(
                item.agent_id
              ) ===
                String(
                  agent.id
                ) &&
              isCountedPlanningRow(
                item
              )
          )

        const planningByDate =
  new Map<
    string,
    PlanningRow[]
  >()

for (
  const item
  of agentPlanning
) {
  if (!item.date) {
    continue
  }

  const existing =
    planningByDate.get(
      item.date
    ) || []

  existing.push(item)

  planningByDate.set(
    item.date,
    existing
  )
}

let completedHours = 0

for (
  const [
    date,
    dayRows,
  ] of planningByDate
) {
  const completeHours =
    dayRows.reduce(
      (
        total,
        item
      ) =>
        total +
        calculateHours(
          item.heure_debut,
          item.heure_fin
        ),
      0
    )

  if (
    completeHours > 0
  ) {
    completedHours +=
      completeHours

    continue
  }

  /*
   * Aucun horaire complet dans
   * le planning de cette journée :
   * fallback sur le cycle réel.
   */
  completedHours +=
    getCycleHoursForDate(
      weeklyCycles,
      agent.id,
      date
    )
}

       const agentAbsences =
  absences.filter(
    (absence) =>
      String(
        absence.agent_id
      ) ===
      String(agent.id)
  )

const neutralizedDates =
  getNeutralizedDates({
    absences:
      agentAbsences,

    startDate,

    endDate:
      lastPlanningDate ||
      todayIso,
  })

/*
 * V1 :
 * le temps hebdomadaire est réparti
 * sur 5 jours ouvrés.
 *
 * Exemple :
 * 20 h / semaine = 4 h / jour.
 */
const theoreticalDailyHours =
  weeklyHours / 5

let neutralizedHours = 0

for (
  const date
  of neutralizedDates
) {
 
  const planningRowsThatDay =
  agentPlanning.filter(
    (item) =>
      item.date === date
  )

const completeHoursThatDay =
  planningRowsThatDay.reduce(
    (
      total,
      item
    ) =>
      total +
      calculateHours(
        item.heure_debut,
        item.heure_fin
      ),
    0
  )

const workedThatDay =
  completeHoursThatDay > 0
    ? completeHoursThatDay
    : planningRowsThatDay.length > 0
      ? getCycleHoursForDate(
          weeklyCycles,
          agent.id,
          date
        )
      : 0

  const cycleHoursThatDay =
    getCycleHoursForDate(
      weeklyCycles,
      agent.id,
      date
    )

  /*
   * Si aucun cycle n'est renseigné,
   * fallback V1 sur le temps hebdo / 5.
   */
  const theoreticalHoursThatDay =
  cycleHoursThatDay

  neutralizedHours +=
    Math.max(
      0,
      theoreticalHoursThatDay -
        workedThatDay
    )
}

const accountedHours =
  completedHours +
  neutralizedHours

const balanceToDate =
  accountedHours -
  targetToDate

const annualProgress =
  annualTarget > 0
    ? Math.round(
        (
          accountedHours /
          annualTarget
        ) *
          100
      )
    : 0

const dateProgress =
  targetToDate > 0
    ? Math.round(
        (
          accountedHours /
          targetToDate
        ) *
          100
      )
    : 0

       return {
  id:
    agent.id,

  nom:
    agent.nom,

  tempsHebdomadaire:
    weeklyHours,

  tauxActivite:
    Math.round(
      activityRate *
        100
    ),

  heuresRealisees:
    completedHours,

  heuresNeutralisees:
    neutralizedHours,

  heuresComptabilisees:
    accountedHours,

  objectifAnnuel:
    annualTarget,

  objectifADate:
    targetToDate,

  ecartADate:
    balanceToDate,

  progressionAnnuelle:
    annualProgress,

  progressionADate:
    dateProgress,
}
      }
    )

  /*
   * =======================================================
   * INDICATEURS
   * =======================================================
   */

  const totalRealise =
    rows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.heuresRealisees,
      0
    )

  const totalObjectifADate =
    rows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.objectifADate,
      0
    )

  const agentsEnDeficit =
    rows.filter(
      (row) =>
        row.ecartADate <
        -7
    ).length

  const dataCoverageIsLow =
    uniquePlanningDates.length <
    20

  /*
   * =======================================================
   * AFFICHAGE
   * =======================================================
   */

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">

        {/* RETOUR */}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Dashboard
        </Link>

        {/* =================================================
            BANDEAU
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-t-4 border-amber-500 px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
                  AGENTIS · Ressources humaines
                </p>

                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                  Temps &amp; 1607 h
                </h1>

                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                  Suivi des heures planifiées,
                  des objectifs proratisés et
                  des écarts à la date du{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDate(
                      lastPlanningDate ||
                        todayIso
                    )}
                  </span>
                  .
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <CalendarClock className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ALERTE COUVERTURE
        ================================================= */}

        {dataCoverageIsLow && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </span>

              <div>
                <p className="text-sm font-bold text-amber-950">
                  Données annuelles encore incomplètes
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Le planning contient actuellement{" "}
                  <span className="font-semibold">
                    {uniquePlanningDates.length}
                  </span>{" "}
                  journée
                  {uniquePlanningDates.length >
                  1
                    ? "s"
                    : ""}{" "}
                  distincte
                  {uniquePlanningDates.length >
                  1
                    ? "s"
                    : ""}
                  {firstPlanningDate &&
                  lastPlanningDate
                    ? `, du ${formatDate(
                        firstPlanningDate
                      )} au ${formatDate(
                        lastPlanningDate
                      )}`
                    : ""}
                  . Les soldes deviendront pleinement
                  représentatifs après l’import du
                  planning de l’année.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            INDICATEURS
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Agents suivis"
            value={String(
              rows.length
            )}
            icon={UsersRound}
            tone="blue"
          />

          <StatCard
            title="Heures planifiées"
            value={formatHours(
              totalRealise
            )}
            icon={Clock3}
            tone="slate"
          />

          <StatCard
            title="Objectif théorique à date"
            value={formatHours(
              totalObjectifADate
            )}
            icon={Target}
            tone="cyan"
          />

          <StatCard
            title="Agents à surveiller"
            value={String(
              agentsEnDeficit
            )}
            icon={UserCheck}
            tone={
              agentsEnDeficit > 0
                ? "red"
                : "green"
            }
          />
        </section>

        {/* =================================================
            TABLEAU
        ================================================= */}

        <TempsTableClient
  rows={rows}
  dataCoverageIsLow={
    dataCoverageIsLow
  }
/>

        {/* =================================================
            NOTE CALCUL
        ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs leading-5 text-slate-500">
            <span className="font-bold text-slate-700">
              Calcul V1 :
            </span>{" "}
            l’objectif à date est proratisé selon la
            progression calendaire de l’année et le temps
            hebdomadaire enregistré. Les congés, jours
            fériés, cycles annualisés et autorisations
            d’absence seront intégrés dans une évolution
            ultérieure du moteur.
          </p>
        </section>
      </div>
    </main>
  )
}

/*
 * =========================================================
 * CARTE INDICATEUR
 * =========================================================
 */

function StatCard({
  title,
  value,
  icon: Icon,
  tone = "slate",
}: {
  title: string
  value: string
  icon: typeof UsersRound
  tone?:
    | "slate"
    | "blue"
    | "cyan"
    | "green"
    | "red"
}) {
  const styles = {
    slate: {
      card:
        "border-slate-200 bg-white",
      icon:
        "border-slate-200 bg-slate-50 text-slate-700",
      value:
        "text-slate-950",
    },

    blue: {
      card:
        "border-blue-200 bg-blue-50/50",
      icon:
        "border-blue-200 bg-white text-blue-600",
      value:
        "text-blue-700",
    },

    cyan: {
      card:
        "border-cyan-200 bg-cyan-50/60",
      icon:
        "border-cyan-200 bg-white text-cyan-700",
      value:
        "text-cyan-700",
    },

    green: {
      card:
        "border-emerald-200 bg-emerald-50/60",
      icon:
        "border-emerald-200 bg-white text-emerald-700",
      value:
        "text-emerald-700",
    },

    red: {
      card:
        "border-red-200 bg-red-50/60",
      icon:
        "border-red-200 bg-white text-red-600",
      value:
        "text-red-700",
    },
  }

  const style =
    styles[tone]

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${style.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">
            {title}
          </p>

          <p
            className={`mt-3 text-3xl font-extrabold ${style.value}`}
          >
            {value}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}