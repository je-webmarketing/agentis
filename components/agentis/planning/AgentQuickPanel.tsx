"use client"

import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileClock,
  GraduationCap,
  MapPin,
  Medal,
  Pencil,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react"

import type {
  ReplacementRecommendation,
} from "@/lib/planning/ReplacementEngine"

export type AgentQuickPanelData = {
  assignmentId: string | number
  agentId?: string | number | null
  name: string
  status: "present" | "replacement" | "absence"
  structureName: string
  slotLabel: string
  slotTime: string
  selectedDate: string
  position?: string | null
  contractLabel?: string | null
  medicalVisitLabel?: string | null
  formationLabel?: string | null
  habilitationLabel?: string | null
}

type AgentQuickPanelProps = {
  open: boolean
  agent: AgentQuickPanelData | null
  onClose: () => void

  onEditAssignment?: (
    assignmentId: string | number
  ) => void | Promise<void>

  onMoveAssignment?: (
    assignmentId: string | number
  ) => void | Promise<void>

  onOpenAgent?: (
    agentId: string | number
  ) => void | Promise<void>

  onOpenHistory?: (
    agentId: string | number
  ) => void | Promise<void>

  replacementRecommendations?: ReplacementRecommendation[]
  replacementLoading?: boolean
  replacementError?: string | null

  onChooseReplacement?: (
    recommendation: ReplacementRecommendation
  ) => void | Promise<void>
}

const statusStyles = {
  present: {
    label: "Présent",
    className:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  replacement: {
    label: "Remplacement",
    className:
      "border-violet-200 bg-violet-50 text-violet-700",
  },
  absence: {
    label: "Poste vacant",
    className:
      "border-red-200 bg-red-50 text-red-700",
  },
}

function scoreTone(score: number) {
  if (score >= 85) {
    return {
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Excellent",
    }
  }

  if (score >= 70) {
    return {
      badge:
        "border-cyan-200 bg-cyan-50 text-cyan-700",
      label: "Très bon",
    }
  }

  if (score >= 55) {
    return {
      badge:
        "border-amber-200 bg-amber-50 text-amber-700",
      label: "Compatible",
    }
  }

  return {
    badge:
      "border-slate-200 bg-slate-50 text-slate-700",
    label: "À vérifier",
  }
}

export default function AgentQuickPanel({
  open,
  agent,
  onClose,
  onEditAssignment,
  onMoveAssignment,
  onOpenAgent,
  onOpenHistory,
  replacementRecommendations = [],
  replacementLoading = false,
  replacementError = null,
  onChooseReplacement,
}: AgentQuickPanelProps) {
  if (!open || !agent) {
    return null
  }

  const status = statusStyles[agent.status]

  const hasAgent =
    agent.agentId !== null &&
    agent.agentId !== undefined &&
    agent.status !== "absence"

  const isVacancy = agent.status === "absence"

  return (
    <div
      className="fixed inset-0 z-[140] bg-slate-950/35 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside
        className="ml-auto flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-quick-panel-title"
      >
        <header className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                AGENTIS · Fiche rapide
              </p>

              <h2
                id="agent-quick-panel-title"
                className="mt-2 truncate text-2xl font-extrabold text-slate-950"
              >
                {isVacancy
                  ? "Poste vacant"
                  : agent.name}
              </h2>

              <span
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fiche rapide"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <PanelSection title="Affectation">
            <InfoLine
              icon={<MapPin className="h-4 w-4" />}
              label="Structure"
              value={agent.structureName}
            />

            <InfoLine
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              label="Créneau"
              value={agent.slotLabel}
            />

            <InfoLine
              icon={<Clock3 className="h-4 w-4" />}
              label="Horaires"
              value={agent.slotTime}
            />

            <InfoLine
              icon={<CalendarDays className="h-4 w-4" />}
              label="Date"
              value={agent.selectedDate}
            />
          </PanelSection>

          {!isVacancy && (
            <PanelSection title="Situation RH">
              <InfoLine
                icon={<UserRound className="h-4 w-4" />}
                label="Poste"
                value={
                  agent.position ||
                  "Non renseigné"
                }
              />

              <InfoLine
                icon={<FileClock className="h-4 w-4" />}
                label="Contrat"
                value={
                  agent.contractLabel ||
                  "À vérifier"
                }
              />

              <InfoLine
                icon={<Stethoscope className="h-4 w-4" />}
                label="Visite médicale"
                value={
                  agent.medicalVisitLabel ||
                  "À vérifier"
                }
              />

              <InfoLine
                icon={<GraduationCap className="h-4 w-4" />}
                label="Formation"
                value={
                  agent.formationLabel ||
                  "À vérifier"
                }
              />

              <InfoLine
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Habilitation"
                value={
                  agent.habilitationLabel ||
                  "À vérifier"
                }
              />
            </PanelSection>
          )}

          {isVacancy && (
            <ReplacementSection
              loading={replacementLoading}
              error={replacementError}
              recommendations={replacementRecommendations}
              onChooseReplacement={onChooseReplacement}
            />
          )}

          {!isVacancy && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                Analyse AGENTIS
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                Les données RH affichées ici sont utilisées par le moteur de remplacement pour calculer la compatibilité des agents.
              </p>
            </div>
          )}
        </div>

        <footer className="grid gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
          <ActionButton
            label="Modifier"
            icon={<Pencil className="h-4 w-4" />}
            disabled={!onEditAssignment}
            onClick={() => {
              void onEditAssignment?.(
                agent.assignmentId
              )
            }}
          />

          <ActionButton
            label={isVacancy ? "Corriger" : "Déplacer"}
            icon={<MapPin className="h-4 w-4" />}
            disabled={!onMoveAssignment}
            onClick={() => {
              void onMoveAssignment?.(
                agent.assignmentId
              )
            }}
          />

          <ActionButton
            label="Ouvrir la fiche"
            icon={<ExternalLink className="h-4 w-4" />}
            disabled={!hasAgent || !onOpenAgent}
            onClick={() => {
              if (!hasAgent) return

              void onOpenAgent?.(
                agent.agentId as string | number
              )
            }}
          />

          <ActionButton
            label="Historique"
            icon={<FileClock className="h-4 w-4" />}
            disabled={!hasAgent || !onOpenHistory}
            onClick={() => {
              if (!hasAgent) return

              void onOpenHistory?.(
                agent.agentId as string | number
              )
            }}
          />
        </footer>
      </aside>
    </div>
  )
}

function ReplacementSection({
  loading,
  error,
  recommendations,
  onChooseReplacement,
}: {
  loading: boolean
  error: string | null
  recommendations: ReplacementRecommendation[]
  onChooseReplacement?: (
    recommendation: ReplacementRecommendation
  ) => void | Promise<void>
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
      <header className="border-b border-violet-200 bg-violet-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />

          <h3 className="text-sm font-bold text-violet-900">
            Recommandations AGENTIS
          </h3>
        </div>
      </header>

      <div className="p-4">
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Analyse des candidats en cours…
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading &&
          !error &&
          recommendations.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Aucun candidat compatible n’a été trouvé pour le moment.
            </div>
          )}

        {!loading &&
          !error &&
          recommendations.length > 0 && (
            <div className="space-y-3">
              {recommendations
                .slice(0, 5)
                .map((recommendation) => (
                  <ReplacementCandidateCard
                    key={recommendation.agentId}
                    recommendation={recommendation}
                    onChooseReplacement={
                      onChooseReplacement
                    }
                  />
                ))}
            </div>
          )}
      </div>
    </section>
  )
}

function ReplacementCandidateCard({
  recommendation,
  onChooseReplacement,
}: {
  recommendation: ReplacementRecommendation
  onChooseReplacement?: (
    recommendation: ReplacementRecommendation
  ) => void | Promise<void>
}) {
  const tone = scoreTone(recommendation.score)

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-sm font-extrabold text-amber-700">
            {recommendation.rank}
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">
              {recommendation.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {tone.label}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-extrabold ${tone.badge}`}
        >
          {recommendation.score} %
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.positives
          .slice(0, 4)
          .map((criterion) => (
            <span
              key={criterion.key}
              title={criterion.message}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
            >
              <CheckCircle2 className="h-3 w-3" />
              {criterion.label}
            </span>
          ))}

        {recommendation.warnings
          .filter((criterion) => criterion.required)
          .slice(0, 2)
          .map((criterion) => (
            <span
              key={criterion.key}
              title={criterion.message}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700"
            >
              <AlertTriangle className="h-3 w-3" />
              {criterion.label}
            </span>
          ))}
      </div>

      {recommendation.blockedReasons.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {recommendation.blockedReasons.join(" · ")}
        </div>
      )}

      <button
        type="button"
        disabled={
          !recommendation.eligible ||
          !onChooseReplacement
        }
        onClick={() => {
          void onChooseReplacement?.(
            recommendation
          )
        }}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {recommendation.rank === 1 ? (
          <Medal className="h-4 w-4" />
        ) : (
          <UserRoundCheck className="h-4 w-4" />
        )}

        Choisir ce remplaçant
      </button>
    </article>
  )
}

function PanelSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>
      </header>

      <div className="divide-y divide-slate-100">
        {children}
      </div>
    </section>
  )
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-amber-600">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  )
}