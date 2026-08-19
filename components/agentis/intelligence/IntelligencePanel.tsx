import Link from "next/link"
import type { AgentisDecision } from "@/lib/core/intelligence/DecisionEngine"

type Props = {
  decisions: AgentisDecision[]
}

export default function IntelligencePanel({
  decisions,
}: Props) {
  if (decisions.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-bold text-emerald-800">
          🧠 AGENTIS Intelligence
        </h2>

        <p className="mt-4 text-emerald-700">
          Aucune action prioritaire aujourd'hui.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            🧠 AGENTIS Intelligence
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Actions classées automatiquement par priorité métier.
          </p>
        </div>

        <Link
          href="/dashboard/audits"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Voir toutes les anomalies
        </Link>
      </div>

      <div className="space-y-4">
        {decisions.map((decision) => (
          <article
            key={decision.rank}
            className="rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {decision.rank}. {decision.title}
              </h3>

              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                {decision.score}/100
              </span>
            </div>

            <p className="mt-4 text-slate-700">
              {decision.summary}
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">
                Pourquoi ?
              </div>

              <div className="mt-1 text-sm text-slate-700">
                {decision.why}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-indigo-50 p-4">
              <div className="font-semibold text-indigo-900">
                Action recommandée
              </div>

              <div className="mt-1 text-sm text-indigo-800">
                {decision.nextAction}
              </div>
            </div>

            <div className="mt-5">
              <Link
                href={decision.actionUrl}
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Traiter →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}