import Link from "next/link"
import { AuditRunner } from "@/lib/core/audits/AuditRunner"
import type {
  AgentisAuditCheck,
  AgentisAuditStatus,
} from "@/lib/core/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

const statusOrder: Record<AgentisAuditStatus, number> = {
  error: 0,
  warning: 1,
  success: 2,
  skipped: 3,
}

const moduleLabels: Record<string, string> = {
  agents: "Agents",
  planning: "Planning",
  absences: "Absences",
  remplacements: "Remplacements",
  documents: "Documents",
  formations: "Formations",
  habilitations: "Habilitations",
  "visites-medicales": "Visites médicales",
  periscolaire: "Périscolaire",
  rapports: "Rapports",
  administration: "Administration",
  authentification: "Authentification",
  cockpit: "Cockpit",
}

function getScoreTone(score: number): {
  card: string
  value: string
  bar: string
  label: string
} {
  if (score >= 80) {
    return {
      card: "border-emerald-200 bg-emerald-50",
      value: "text-emerald-700",
      bar: "bg-emerald-500",
      label: "Situation maîtrisée",
    }
  }

  if (score >= 60) {
    return {
      card: "border-amber-200 bg-amber-50",
      value: "text-amber-700",
      bar: "bg-amber-500",
      label: "Points à surveiller",
    }
  }

  return {
    card: "border-red-200 bg-red-50",
    value: "text-red-700",
    bar: "bg-red-500",
    label: "Actions prioritaires",
  }
}

function getStatusPresentation(status: AgentisAuditStatus): {
  label: string
  icon: string
  badge: string
  card: string
} {
  switch (status) {
    case "error":
      return {
        label: "Erreur",
        icon: "●",
        badge: "border-red-200 bg-red-50 text-red-700",
        card: "border-red-200",
      }

    case "warning":
      return {
        label: "Avertissement",
        icon: "●",
        badge:
          "border-amber-200 bg-amber-50 text-amber-700",
        card: "border-amber-200",
      }

    case "success":
      return {
        label: "Conforme",
        icon: "●",
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        card: "border-emerald-200",
      }

    case "skipped":
      return {
        label: "Ignoré",
        icon: "●",
        badge:
          "border-slate-200 bg-slate-50 text-slate-600",
        card: "border-slate-200",
      }
  }
}

export default async function AuditsPage() {
  const report = await AuditRunner.run()

  const sortedChecks = [...report.checks].sort((first, second) => {
    const statusDifference =
      statusOrder[first.status] - statusOrder[second.status]

    if (statusDifference !== 0) {
      return statusDifference
    }

    return first.label.localeCompare(second.label, "fr")
  })

  const scoreTone = getScoreTone(report.score)

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              AGENTIS · Conformité
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Centre de conformité RH
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Consultez les contrôles automatiques, les échéances
              sensibles et les anomalies nécessitant une action.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/cockpit"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            >
              ← Retour au Cockpit RH
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article
            className={`rounded-2xl border p-5 shadow-sm ${scoreTone.card}`}
          >
            <p className="text-sm font-medium text-slate-600">
              Santé RH
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${scoreTone.value}`}
            >
              {report.score} %
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-600">
              {scoreTone.label}
            </p>
          </article>

          <SummaryCard
            label="Contrôles"
            value={report.totalChecks}
            tone="slate"
          />

          <SummaryCard
            label="Conformes"
            value={report.passedChecks}
            tone="green"
          />

          <SummaryCard
            label="Avertissements"
            value={report.warningChecks}
            tone="amber"
          />

          <SummaryCard
            label="Erreurs"
            value={report.failedChecks}
            tone="red"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Score global
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Rapport généré le{" "}
                {new Date(report.generatedAt).toLocaleString(
                  "fr-FR"
                )}
                .
              </p>
            </div>

            <span
              className={`text-lg font-bold ${scoreTone.value}`}
            >
              {report.score} %
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${scoreTone.bar}`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, report.score)
                )}%`,
              }}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Détail des contrôles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Les anomalies critiques apparaissent en premier.
            </p>
          </div>

          {sortedChecks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-800">
                Aucun contrôle disponible
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Aucun audit métier n’a encore produit de résultat.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-5">
              {sortedChecks.map((check) => (
                <AuditCheckCard
                  key={check.id}
                  check={check}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "slate" | "green" | "amber" | "red"
}) {
  const styles = {
    slate: "border-slate-200 bg-white text-slate-900",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}
    >
      <p className="text-sm font-medium text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </article>
  )
}

function AuditCheckCard({
  check,
}: {
  check: AgentisAuditCheck
}) {
  const presentation = getStatusPresentation(check.status)

  return (
    <article
      className={`rounded-2xl border bg-white p-5 ${presentation.card}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${presentation.badge}`}
            >
              <span>{presentation.icon}</span>
              {presentation.label}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {moduleLabels[check.module] || check.module}
            </span>
          </div>

          <h3 className="mt-3 text-base font-bold text-slate-900">
            {check.label}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {check.message}
          </p>
        </div>

        <span className="shrink-0 text-xs font-medium text-slate-400">
          {check.id}
        </span>
      </div>
    </article>
  )
}