import Link from "next/link"
import { DashboardService } from "@/lib/services/DashboardService"
import { SuggestionEngine } from "@/lib/core/intelligence/SuggestionEngine"
import type { AgentisPriorityLevel } from "@/lib/core/intelligence/PriorityEngine"

import DashboardGrid from "@/components/agentis/layout/DashboardGrid"
import DashboardSection from "@/components/agentis/layout/DashboardSection"
import StatCard from "@/components/agentis/ui/StatCard"
import HeroHeader from "@/components/agentis/ui/HeroHeader"
import QuickActions from "@/components/agentis/widgets/QuickActions"
import IntelligencePanel from "@/components/agentis/intelligence/IntelligencePanel"
import { DecisionEngine } from "@/lib/core/intelligence/DecisionEngine"
import IntelligenceSummary from "@/components/agentis/intelligence/IntelligenceSummary"
import { SummaryEngine } from "@/lib/core/intelligence/SummaryEngine"
import { AlertCenter } from "@/lib/core/intelligence/AlertCenter"
import DailyBriefEngine from "@/lib/core/intelligence/DailyBriefEngine"
import ForecastService from "@/lib/services/ForecastService"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"


export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CockpitRHPage() {
  const stats = await DashboardService.getStats()

  const supabase =
  await createServerSupabaseClient()

const forecastEvents =
  await ForecastService.getForecast(
    30,
    supabase
  )

const futureForecastEvents =
  forecastEvents.filter(
    (event) =>
      event.daysRemaining >= 0 &&
      event.daysRemaining <= 30
  )

const forecastContrats =
  futureForecastEvents.filter(
    (event) =>
      event.type === "contrat"
  ).length

const forecastVisites =
  futureForecastEvents.filter(
    (event) =>
      event.type === "visite-medicale"
  ).length

const forecastHabilitations =
  futureForecastEvents.filter(
    (event) =>
      event.type === "habilitation"
  ).length


const forecastFormations =
  futureForecastEvents.filter(
    (event) =>
      event.type === "formation"
  ).length

  const forecastAbsences =
  futureForecastEvents.filter(
    (event) =>
      event.type === "absence"
  ).length

  const totalEcheances =
  forecastContrats +
  forecastVisites +
  forecastFormations +
  forecastHabilitations

  const tauxPresence =
    stats.agents > 0
      ? Math.round(
          (stats.agentsActifs / stats.agents) * 100
        )
      : 0

  const tauxAbsence =
    stats.agents > 0
      ? Math.min(
          100,
          Math.round(
            (stats.absencesAujourdHui /
              stats.agents) *
              100
          )
        )
      : 0

  const tauxEcheances = Math.min(
    100,
    totalEcheances * 10
  )

  const overdueCount =
  forecastEvents.filter(
    (event) =>
      event.daysRemaining < 0
  ).length

const urgentCount =
  forecastEvents.filter(
    (event) =>
      event.daysRemaining >= 0 &&
      event.daysRemaining <= 7 &&
      event.type !== "absence"
  ).length

const prepareCount =
  forecastEvents.filter(
    (event) =>
      event.daysRemaining >= 8 &&
      event.daysRemaining <= 15 &&
      event.type !== "absence"
  ).length

  const scoreCockpit = Math.max(
  0,
  Math.round(
    100 -
      overdueCount * 4 -
      urgentCount * 2 -
      prepareCount * 1 -
      stats.absencesAujourdHui * 1
  )
)

  const audit = stats.audit

  const auditTone =
    audit.score >= 80
      ? "green"
      : audit.score >= 60
        ? "yellow"
        : "red"

  const intelligenceActions =
    SuggestionEngine.build(audit.checks).slice(0, 3)

  const intelligenceDecisions =
  DecisionEngine.top(intelligenceActions, 3)

  const intelligenceSummary =
  SummaryEngine.build(intelligenceDecisions)

  const alertCenter = AlertCenter.build({
  checks: audit.checks,
  decisions: intelligenceDecisions,
})

const dailyBrief = DailyBriefEngine.build({
  agents: stats.agents,
  alerts: alertCenter,
})


const topAlerts = alertCenter.alerts
  .filter(
    (alert) =>
      alert.origin === "audit" &&
      alert.severity !== "success"
  )
  .slice(0, 3)

  console.log(
  "[AGENTIS TOP ALERTS]",
  topAlerts.map((alert) => ({
    id: alert.id,
    origin: alert.origin,
    title: alert.title,
    severity: alert.severity,
  }))
)

  const intelligenceHeadline =
    intelligenceActions.length === 0
      ? "Aucune action prioritaire détectée."
      : `${intelligenceActions.length} action${
          intelligenceActions.length > 1 ? "s" : ""
        } prioritaire${
          intelligenceActions.length > 1 ? "s" : ""
        } à traiter.`

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-[1500px]">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-yellow-500/60 hover:text-yellow-700"
        >
          ← Retour Dashboard
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <HeroHeader
            title="Bonjour Eric 👋"
            subtitle="Bienvenue dans votre Cockpit RH. Retrouvez les indicateurs clés de votre organisation en un coup d'œil."
          />
        </div>

        <div className="mt-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
        🧠 Brief AGENTIS
      </p>

      <h2 className="mt-2 text-2xl font-bold text-slate-950">
        {dailyBrief.title}
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        {dailyBrief.intro}
      </p>

      <p className="mt-3 text-base font-semibold text-slate-800">
        {dailyBrief.summary}
      </p>

      <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
          Recommandation
        </p>

        <p className="mt-1 text-sm font-semibold text-indigo-900">
          {dailyBrief.recommendation}
        </p>
      </div>
    </div>

    <div className="rounded-2xl border border-indigo-200 bg-white px-5 py-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Confiance
      </p>

      <p className="mt-1 text-3xl font-bold text-indigo-700">
        {dailyBrief.confidence}%
      </p>
    </div>
  </div>
</div>

        <div className="mt-8">
          <DashboardGrid>
            <StatCard
              title="Agents"
              value={stats.agents}
              tone="yellow"
              icon="👥"
              description={`${stats.agentsActifs} agents actifs`}
              trend={{
                value: "Effectif actuel",
                direction: "neutral",
              }}
            />

            <StatCard
              title="Agents actifs"
              value={stats.agentsActifs}
              tone="green"
              icon="✅"
              description={`${tauxPresence}% de présence`}
              trend={{
                value: "Situation actuelle",
                direction: "up",
              }}
            />

            <StatCard
              title="Absences"
              value={stats.absencesAujourdHui}
              tone="red"
              icon="📅"
              description="Aujourd'hui"
              trend={{
                value: "À surveiller",
                direction: "down",
              }}
            />

            <StatCard
              title="Sites"
              value={stats.sites}
              tone="cyan"
              icon="🏢"
              description={`${stats.structures} structures`}
              trend={{
                value: "Organisation",
                direction: "neutral",
              }}
            />

            <Link
              href="/dashboard/audits"
              className="block"
            >
              <StatCard
                title="Santé RH"
                value={audit.score}
                tone={auditTone}
                icon="🛡️"
                description={`${audit.totalChecks} contrôles`}
                trend={{
                  value: `${audit.failedChecks} erreur(s) • ${audit.warningChecks} avertissement(s)`,
                  direction:
                    audit.failedChecks > 0
                      ? "down"
                      : "up",
                }}
              />
            </Link>
          </DashboardGrid>
        </div>

        <div className="mt-8">
  <IntelligenceSummary summary={intelligenceSummary} />
</div>

       <div className="mt-8">
  <IntelligencePanel decisions={intelligenceDecisions} />
</div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            <DashboardSection title="📅 Échéances à 30 jours">
              <div className="space-y-4">
               <EcheanceLine
  label="📄 Contrats à surveiller"
  value={forecastContrats}
  color="text-yellow-300"
/>

<EcheanceLine
  label="❤️ Visites médicales"
  value={forecastVisites}
  color="text-red-300"
/>

<EcheanceLine
  label="🎓 Formations à renouveler"
  value={forecastFormations}
  color="text-blue-300"
/>

<EcheanceLine
  label="🛡️ Habilitations"
  value={forecastHabilitations}
  color="text-violet-300"
  last
/>
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="text-sm text-slate-300">
                  Total des échéances RH
                </div>

                <div className="mt-1 text-3xl font-bold text-yellow-300">
                  {totalEcheances}
                </div>
              </div>
            </DashboardSection>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            <DashboardSection title="⚡ Actions rapides">
              <QuickActions />
            </DashboardSection>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
           <div className="space-y-3">
  {topAlerts.length === 0 ? (
    <AlertCard
      color="blue"
      label="Aucune alerte prioritaire détectée."
    />
  ) : (
    topAlerts.map((alert) => (
      <Link
        key={alert.id}
        href={alert.actionUrl || "/dashboard/audits"}
        className="block"
      >
        <div
          className={`rounded-xl border p-3 text-sm transition hover:brightness-95 ${
            alert.severity === "critical"
              ? "border-red-500/40 bg-red-500/15 text-red-800"
              : alert.severity === "warning"
                ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-800"
                : "border-blue-500/40 bg-blue-500/15 text-blue-800"
          }`}
        >
          <div className="font-semibold">
            {alert.title}
          </div>

          <div className="mt-1 text-xs opacity-80">
            {alert.message}
          </div>
        </div>
      </Link>
    ))
  )}
</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            <DashboardSection title="📈 Activité RH">
              <div className="space-y-5">
                <ProgressLine
                  label="Présence"
                  value={tauxPresence}
                  color="bg-emerald-400"
                />

                <ProgressLine
                  label="Absences"
                  value={tauxAbsence}
                  color="bg-red-400"
                />

                <ProgressLine
                  label="Charge à anticiper"
                  value={tauxEcheances}
                  color="bg-yellow-400"
                />

                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="text-sm text-slate-300">
                    Score cockpit
                  </div>

                  <div className="mt-1 text-3xl font-bold text-yellow-300">
                    {scoreCockpit}/100
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    Indicateur basé sur les absences et les
                    échéances RH.
                  </div>
                </div>
              </div>
            </DashboardSection>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            <DashboardSection title="🧠 Brief RH du jour">
  <div className="space-y-4">
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4">
      <p className="text-sm font-semibold text-slate-900">
        Situation du jour
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {stats.absencesAujourdHui > 0
          ? `${stats.absencesAujourdHui} absence(s) en cours aujourd’hui.`
          : "Aucune absence enregistrée aujourd’hui."}

        {" "}

        {forecastAbsences > 0
          ? `${forecastAbsences} absence(s) sont déjà planifiée(s) dans les 30 prochains jours.`
          : "Aucune absence future n’est actuellement planifiée."}
      </p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <TodayCard
        label={`👥 ${stats.agentsActifs} agents actifs`}
      />

      <TodayCard
        label={`🏖️ ${stats.absencesAujourdHui} absence(s) aujourd’hui`}
      />

      <TodayCard
        label={`📅 ${forecastAbsences} absence(s) planifiée(s)`}
      />

      <TodayCard
        label={`⏳ ${totalEcheances} échéance(s) RH à anticiper`}
      />
    </div>

    <div
      className={`rounded-2xl border p-4 ${
        overdueCount > 0
          ? "border-red-200 bg-red-50"
          : urgentCount > 0
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Priorité du jour
      </p>

      <p className="mt-2 font-semibold text-slate-900">
        {overdueCount > 0
          ? `${overdueCount} situation(s) déjà échue(s) nécessitent une régularisation.`
          : urgentCount > 0
            ? `${urgentCount} échéance(s) arrivent sous 7 jours.`
            : "Aucune situation urgente détectée aujourd’hui."}
      </p>
    </div>

    <Link
      href="/dashboard/intelligence"
      className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      <span>Voir les priorités AGENTIS</span>
      <span>→</span>
    </Link>
  </div>
</DashboardSection>
          </div>
        </div>
      </div>
    </main>
  )
}

function IntelligenceAction({
  rank,
  title,
  description,
  href,
  score,
  level,
}: {
  rank: number
  title: string
  description: string
  href: string
  score: number
  level: AgentisPriorityLevel
}) {
  const styles: Record<
    AgentisPriorityLevel,
    {
      border: string
      badge: string
      label: string
    }
  > = {
    urgent: {
      border: "border-red-500/40 bg-red-500/10",
      badge: "bg-red-500 text-white",
      label: "Urgent",
    },
    high: {
      border:
        "border-orange-500/40 bg-orange-500/10",
      badge: "bg-orange-500 text-white",
      label: "Prioritaire",
    },
    medium: {
      border:
        "border-yellow-500/40 bg-yellow-500/10",
      badge: "bg-yellow-500 text-slate-950",
      label: "À planifier",
    },
    low: {
      border: "border-blue-500/40 bg-blue-500/10",
      badge: "bg-blue-500 text-white",
      label: "Information",
    },
  }

  const style = styles[level]

  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between ${style.border}`}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
          {rank}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}
            >
              {style.label}
            </span>

            <span className="text-xs font-semibold text-slate-400">
              Score {score}/100
            </span>
          </div>

          <h3 className="mt-2 font-bold text-white">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>
      </div>

      <Link
        href={href}
        className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Traiter →
      </Link>
    </article>
  )
}

function EcheanceLine({
  label,
  value,
  color,
  last = false,
}: {
  label: string
  value: number
  color: string
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        last
          ? ""
          : "border-b border-slate-700 pb-3"
      }`}
    >
      <span className="text-sm text-slate-200">
        {label}
      </span>

      <strong className={`text-lg ${color}`}>
        {value}
      </strong>
    </div>
  )
}

function AlertCard({
  label,
  color,
}: {
  label: string
  color: "red" | "yellow" | "blue" | "violet"
}) {
  const styles = {
    red: "border-red-500/40 bg-red-500/15 text-red-100",
    yellow:
      "border-yellow-500/40 bg-yellow-500/15 text-yellow-100",
    blue: "border-blue-500/40 bg-blue-500/15 text-blue-100",
    violet:
      "border-violet-500/40 bg-violet-500/15 text-violet-100",
  }

  return (
    <div
      className={`rounded-xl border p-3 text-sm ${styles[color]}`}
    >
      {label}
    </div>
  )
}

function TodayCard({
  label,
}: {
  label: string
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-slate-100">
      {label}
    </div>
  )
}

function ProgressLine({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-200">
          {label}
        </span>

        <span className="font-semibold text-white">
          {value}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${Math.min(
              100,
              Math.max(0, value)
            )}%`,
          }}
        />
      </div>
    </div>
  )
}