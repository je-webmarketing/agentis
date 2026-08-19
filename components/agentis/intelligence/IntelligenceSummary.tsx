import Link from "next/link"
import type { AgentisSummary } from "@/lib/core/intelligence/SummaryEngine"

type Props = {
  summary: AgentisSummary
}

export default function IntelligenceSummary({
  summary,
}: Props) {
  const firstDecision = summary.firstDecision

  return (
    <section className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
            AGENTIS Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            {summary.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {summary.introduction}
          </p>
        </div>

        <Link
          href="/dashboard/audits"
          className="inline-flex w-fit rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          Voir le centre de conformité →
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCounter
          label="Bloquantes"
          value={summary.counts.blocking}
          tone="red"
        />

        <SummaryCounter
          label="Critiques"
          value={summary.counts.critical}
          tone="orange"
        />

        <SummaryCounter
          label="Importantes"
          value={summary.counts.important}
          tone="yellow"
        />

        <SummaryCounter
          label="Préventives"
          value={summary.counts.moderate}
          tone="blue"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-500">
          Recommandation principale
        </p>

        <p className="mt-2 text-lg font-bold text-slate-950">
          {summary.headline}
        </p>

        {firstDecision ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Situation
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {firstDecision.summary}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Impact métier
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {firstDecision.why}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  Action recommandée
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-indigo-800">
                  {firstDecision.nextAction}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
                Score {firstDecision.score}/100
              </span>

              <Link
                href={firstDecision.actionUrl}
                className="inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Traiter cette priorité →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            Aucun traitement prioritaire détecté.
          </div>
        )}
      </div>
    </section>
  )
}

function SummaryCounter({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "red" | "orange" | "yellow" | "blue"
}) {
  const styles = {
    red: "border-red-200 bg-red-50 text-red-700",
    orange:
      "border-orange-200 bg-orange-50 text-orange-700",
    yellow:
      "border-yellow-200 bg-yellow-50 text-yellow-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${styles[tone]}`}
    >
      <p className="text-sm font-medium">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  )
}