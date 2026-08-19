import Link from "next/link"

import { DashboardService } from "@/lib/services/DashboardService"
import ForecastService from "@/lib/services/ForecastService"

import { SuggestionEngine } from "@/lib/core/intelligence/SuggestionEngine"
import { DecisionEngine } from "@/lib/core/intelligence/DecisionEngine"
import { SummaryEngine } from "@/lib/core/intelligence/SummaryEngine"
import { AlertCenter } from "@/lib/core/intelligence/AlertCenter"
import DailyBriefEngine from "@/lib/core/intelligence/DailyBriefEngine"
import ForecastEngine from "@/lib/core/intelligence/ForecastEngine"
import ForecastDecisionEngine from "@/lib/core/intelligence/ForecastDecisionEngine"
import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"


export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function IntelligencePage() {
  const stats = await DashboardService.getStats()

  const supabase =
  await createServerSupabaseClient()

 const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser()

const { data: profile, error: profileError } =
  user
    ? await supabase
        .from("profiles")
        .select("id, email, role, actif, structure_id, site_id, service_id")
        .eq("id", user.id)
        .single()
    : { data: null, error: null }

  const audit = stats.audit

  const suggestions =
    SuggestionEngine.build(audit.checks)

  const decisions =
    DecisionEngine.top(suggestions, 5)

  const summary =
    SummaryEngine.build(decisions)

  const alertCenter = AlertCenter.build({
    checks: audit.checks,
    decisions,
  })

  const dailyBrief = DailyBriefEngine.build({
    agents: stats.agents,
    alerts: alertCenter,
  })

const forecastEvents =
  await ForecastService.getForecast(
    30,
    supabase
  )

const forecastDecisions =
  ForecastDecisionEngine.build(
    forecastEvents
  )


const futureForecastDecisions =
  forecastDecisions.filter(
    (decision) =>
      decision.daysRemaining >= 0
  )

  const overdueForecast = forecastEvents.filter(
  (event) => event.daysRemaining < 0
)

const next7Forecast = forecastEvents.filter(
  (event) =>
    event.daysRemaining >= 0 &&
    event.daysRemaining <= 7
)

const next15Forecast = forecastEvents.filter(
  (event) =>
    event.daysRemaining >= 8 &&
    event.daysRemaining <= 15
)

const next30Forecast = forecastEvents.filter(
  (event) =>
    event.daysRemaining >= 16 &&
    event.daysRemaining <= 30
)

const futureForecast =
  forecastEvents.filter(
    (event) => event.daysRemaining >= 0
  )

const forecastHeadline =
  overdueForecast.length > 0
    ? `${overdueForecast.length} situation${
        overdueForecast.length > 1 ? "s" : ""
      } déjà échue${
        overdueForecast.length > 1 ? "s" : ""
      } nécessite${
        overdueForecast.length > 1 ? "nt" : ""
      } une action.`
    : futureForecast.length > 0
      ? `${futureForecast.length} échéance${
          futureForecast.length > 1 ? "s" : ""
        } à anticiper dans les 30 prochains jours.`
      : "Aucune échéance à anticiper dans les 30 prochains jours."

  const forecast =
    ForecastEngine.build(alertCenter, 7)
 

const topAlerts = alertCenter.alerts
  .filter(
    (alert) =>
      alert.origin === "audit" &&
      alert.severity !== "success"
  )
  .slice(0, 6)

  console.info(
  "[AGENTIS Forecast V2]",
  forecastEvents
)

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-8">

        {/* HEADER */}

        <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">
              AGENTIS · RH Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              🧠 Centre Intelligence
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Analysez les priorités RH, les risques,
              les alertes et les prochaines échéances
              depuis un seul espace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/cockpit"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              ← Cockpit RH
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* BRIEF DU JOUR */}

        <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-7 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
                Brief AGENTIS
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-950">
                {dailyBrief.title}
              </h2>

              <p className="mt-3 text-base text-slate-600">
                {dailyBrief.intro}
              </p>

              <p className="mt-4 text-xl font-semibold text-slate-900">
                {dailyBrief.summary}
              </p>

              <div className="mt-6 rounded-2xl border border-indigo-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  Recommandation du jour
                </p>

                <p className="mt-2 text-base font-semibold text-indigo-950">
                  {dailyBrief.recommendation}
                </p>
              </div>
            </div>

            <div className="grid min-w-[220px] gap-3">
              <div className="rounded-2xl border border-indigo-200 bg-white p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confiance
                </p>

                <p className="mt-1 text-4xl font-bold text-indigo-700">
                  {dailyBrief.confidence}%
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Agents analysés
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {stats.agents}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPI INTELLIGENCE */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            title="Santé RH"
            value={`${audit.score}%`}
            subtitle={`${audit.totalChecks} contrôles`}
            tone={
              audit.score >= 80
                ? "green"
                : audit.score >= 60
                  ? "yellow"
                  : "red"
            }
          />

          <KpiCard
            title="Critiques"
            value={alertCenter.critical}
            subtitle="Actions prioritaires"
            tone="red"
          />

          <KpiCard
            title="Vigilances"
            value={alertCenter.warning}
            subtitle="À surveiller"
            tone="yellow"
          />

          <KpiCard
            title="Décisions"
            value={decisions.length}
            subtitle="Recommandations classées"
            tone="indigo"
          />

          <KpiCard
            title="Prévisions"
            value={forecast.total}
            subtitle={`${forecast.horizonDays} prochains jours`}
            tone="blue"
          />
        </section>

        {/* PRIORITÉ PRINCIPALE */}

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Décision
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                🎯 Priorité recommandée
              </h2>
            </div>

            <Link
              href="/dashboard/audits"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Voir le centre de conformité →
            </Link>
          </div>

          {summary.firstDecision ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {summary.headline}
                </p>

                <h3 className="mt-3 text-2xl font-bold text-slate-950">
                  {summary.firstDecision.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {summary.firstDecision.summary}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                      Impact métier
                    </p>

                    <p className="mt-2 text-sm leading-6 text-red-900">
                      {summary.firstDecision.why}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                      Action recommandée
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-indigo-950">
                      {summary.firstDecision.nextAction}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 xl:items-end">
                <span className="rounded-full bg-red-100 px-5 py-2 text-sm font-bold text-red-700">
                  Score {summary.firstDecision.score}/100
                </span>

                <Link
                  href={summary.firstDecision.actionUrl}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Traiter cette priorité →
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              Aucune action prioritaire détectée.
            </div>
          )}
        </section>

        {/* ALERTES + FORECAST */}

        <section className="grid gap-6 xl:grid-cols-2">

          {/* ALERTES */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                Surveillance
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                🚨 Alertes prioritaires
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {topAlerts.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  Aucune alerte prioritaire.
                </div>
              ) : (
                topAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={
                      alert.actionUrl ||
                      "/dashboard/audits"
                    }
                    className="block"
                  >
                    <article
                      className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
                        alert.severity === "critical"
                          ? "border-red-200 bg-red-50"
                          : alert.severity === "warning"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className={`font-bold ${
                              alert.severity === "critical"
                                ? "text-red-800"
                                : alert.severity === "warning"
                                  ? "text-yellow-800"
                                  : "text-blue-800"
                            }`}
                          >
                            {alert.title}
                          </p>

                          <p className="mt-1 text-sm leading-5 text-slate-700">
                            {alert.message}
                          </p>
                        </div>

                        {alert.score !== undefined && (
                          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                            {alert.score}/100
                          </span>
                        )}
                      </div>
                    </article>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* FORECAST */}

         <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="border-b border-slate-200 pb-4">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
      Anticipation
    </p>

    <h2 className="mt-1 text-xl font-bold text-slate-950">
      🔮 Prochaines échéances RH
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      {forecastHeadline}
    </p>
  </div>

  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <MiniStat
      label="Déjà échues"
      value={overdueForecast.length}
      tone="red"
    />

    <MiniStat
      label="Sous 7 jours"
      value={next7Forecast.length}
      tone="yellow"
    />

    <MiniStat
      label="Sous 15 jours"
      value={next15Forecast.length}
      tone="blue"
    />

    <MiniStat
      label="Sous 30 jours"
      value={next30Forecast.length}
      tone="blue"
    />
  </div>

  <div className="mt-5 space-y-3">
    {forecastEvents.length === 0 ? (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
        Aucune échéance RH identifiée dans les 30 prochains jours.
      </div>
    ) : (
      forecastEvents
        .slice(0, 8)
        .map((event) => (
          <Link
            key={event.id}
           href={
  event.agentId
    ? `/dashboard/agents/${event.agentId}?tab=${
        event.type === "formation"
          ? "formations"
          : event.type === "habilitation"
            ? "habilitations"
            : event.type === "visite-medicale"
              ? "visites-medicales"
              : event.type === "absence"
                ? "absences"
                : event.type === "contrat"
                  ? "contrat"
                  : "identite"
      }`
    : "/dashboard/audits"
}
            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {event.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {event.agentName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Échéance : {formatDateFr(event.date)}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  event.status === "overdue"
                    ? "bg-red-100 text-red-700"
                    : event.status === "next7"
                      ? "bg-yellow-100 text-yellow-700"
                      : event.status === "next15"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-700"
                }`}
              >
                {formatForecastDelay(event.daysRemaining)}
              </span>
            </div>
          </Link>
        ))
    )}
  </div>
</div>

{/* ACTIONS À ANTICIPER */}

<section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 shadow-sm">
  <div className="border-b border-violet-200 pb-4">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
      Anticipation intelligente
    </p>

    <h2 className="mt-1 text-xl font-bold text-slate-950">
      🧠 Actions à préparer
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      AGENTIS transforme les prochaines échéances en actions concrètes.
    </p>
  </div>

  <div className="mt-5 grid gap-4">
    {futureForecastDecisions.length === 0 ? (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
        Aucune action préventive nécessaire dans les 30 prochains jours.
      </div>
    ) : (
     futureForecastDecisions
  .slice(0, 6)
  .map((decision) => (
    <div key={decision.id}>
      
     <a
  href={
    decision.agentId
      ? `/dashboard/agents/${decision.agentId}?tab=${
          decision.type === "formation"
            ? "formations"
            : decision.type === "habilitation"
              ? "habilitations"
              : decision.type === "visite-medicale"
                ? "visites-medicales"
                : decision.type === "absence"
                  ? "absences"
                  : decision.type === "contrat"
                    ? "contrat"
                    : "identite"
        }`
      : "/dashboard/intelligence"
  }
  className="block"
>

        <article
          className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow ${
            decision.priority === "urgent"
              ? "border-amber-200 bg-amber-50"
              : decision.priority === "prepare"
                ? "border-blue-200 bg-blue-50"
                : "border-violet-200 bg-violet-50"
          }`}
        >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <p className="font-bold text-slate-950">
                    {decision.title}
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {decision.context}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Impact
                      </p>

                      <p className="mt-1 text-sm leading-5 text-slate-700">
                        {decision.impact}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                        Action recommandée
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-5 text-indigo-950">
                        {decision.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                    decision.priority === "urgent"
                      ? "bg-amber-100 text-amber-800"
                      : decision.priority === "prepare"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-violet-100 text-violet-800"
                  }`}
                >
                  {decision.priority === "urgent"
                    ? "Urgent"
                    : decision.priority === "prepare"
                      ? "À préparer"
                      : "Préventif"}
                </span>
              </div>
            </article>
               </a>
    </div>
  ))
    )}
  </div>
</section>

        </section>

        {/* DECISIONS */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Aide à la décision
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              🧠 Actions recommandées
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Actions classées automatiquement par
              priorité métier.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {decisions.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                Aucune décision prioritaire actuellement.
              </div>
            ) : (
              decisions.map((decision) => (
                <article
                  key={`${decision.rank}-${decision.title}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                        {decision.rank}
                      </span>

                      <div>
                        <h3 className="font-bold text-slate-950">
                          {decision.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          {decision.summary}
                        </p>

                        <p className="mt-3 text-sm font-semibold text-indigo-700">
                          → {decision.nextAction}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        {decision.score}/100
                      </span>

                      <Link
                        href={decision.actionUrl}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Traiter →
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function KpiCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string
  value: string | number
  subtitle: string
  tone:
    | "red"
    | "yellow"
    | "green"
    | "blue"
    | "indigo"
}) {
  const styles = {
    red: "border-red-200 bg-red-50 text-red-700",
    yellow:
      "border-yellow-200 bg-yellow-50 text-yellow-700",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
    indigo:
      "border-indigo-200 bg-indigo-50 text-indigo-700",
  }

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}
    >
      <p className="text-sm font-medium text-slate-600">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>
    </article>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "red" | "yellow" | "blue"
}) {
  const styles = {
    red: "border-red-200 bg-red-50 text-red-700",
    yellow:
      "border-yellow-200 bg-yellow-50 text-yellow-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${styles[tone]}`}
    >
      <p className="text-xs font-medium">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </div>
  )
}

function formatForecastDelay(
  days: number | null
) {
  if (days === null) {
    return "—"
  }

  if (days < 0) {
    const overdue = Math.abs(days)

    return `Échu depuis ${overdue} j`
  }

  if (days === 0) {
    return "Aujourd'hui"
  }

  return `Dans ${days} j`
}

function formatDateFr(
  date: string
): string {
  const value = new Date(
    `${date}T12:00:00`
  )

  if (Number.isNaN(value.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat(
    "fr-FR"
  ).format(value)
}