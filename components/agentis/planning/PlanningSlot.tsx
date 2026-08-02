"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react"

import AddAssignmentDialog from "../dialogs/AddAssignmentDialog"
import PlanningAgentBadge from "./PlanningAgentBadge"
import ReplacementEngine, {
  type ReplacementCandidate,
} from "@/lib/services/ReplacementEngine"
import PlanningRequirementsService from "@/lib/services/PlanningRequirementsService"

export type PlanningSlotItem = {
  id: string | number
  name: string
  isVacancy: boolean
  status: "present" | "absence" | "replacement"
}

type Props = {
  siteId: string | number
  siteName: string
  slotKey: string
  label: string
  time: string
  items: PlanningSlotItem[]
  selectedDate: string

  onMoveAssignment: (
    assignmentId: string | number
  ) => void | Promise<void>

  onAssignmentCreated: () => void | Promise<void>

  onEditAssignment: (
    assignmentId: string | number
  ) => void | Promise<void>

  onDeleteVacancy: (
    vacancyId: string | number
  ) => void | Promise<void>

  onDuplicateAssignment: (
    assignmentId: string | number
  ) => void | Promise<void>

  onMoveAgent: (
    assignmentId: string | number,
    agentName: string,
    fromSite: string,
    fromSlot: string,
    toSite: string,
    toSlot: string
  ) => void | Promise<void>
}

export default function PlanningSlot({
  siteId,
  siteName,
  slotKey,
  label,
  time,
  items,
  selectedDate,
  onAssignmentCreated,
  onEditAssignment,
  onDeleteVacancy,
  onDuplicateAssignment,
  onMoveAssignment,
  onMoveAgent,
}: Props) {
  const [openDialog, setOpenDialog] =
    useState(false)

  const [
    replacementVacancyId,
    setReplacementVacancyId,
  ] = useState<string | number | null>(null)

  const [
    suggestionsVacancyId,
    setSuggestionsVacancyId,
  ] = useState<string | number | null>(null)

  const [candidates, setCandidates] = useState<
    ReplacementCandidate[]
  >([])

  const [loadingCandidates, setLoadingCandidates] =
    useState(false)

  const [assigningAgentId, setAssigningAgentId] =
    useState<number | null>(null)

  const [
    replacementError,
    setReplacementError,
  ] = useState("")

  const [replacementContext, setReplacementContext] =
    useState({
      required: 0,
      assigned: 0,
      missing: 0,
    })

  const [isDragOver, setIsDragOver] =
    useState(false)

  const [start = "", end = ""] =
    time.split(" - ")

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    item: PlanningSlotItem
  ) {
    if (item.isVacancy) {
      event.preventDefault()
      return
    }

    event.dataTransfer.effectAllowed = "move"

    event.dataTransfer.setData(
      "assignmentId",
      String(item.id)
    )

    event.dataTransfer.setData(
      "agentName",
      item.name
    )

    event.dataTransfer.setData(
      "fromSite",
      siteName
    )

    event.dataTransfer.setData(
      "fromSlot",
      slotKey
    )
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    setIsDragOver(false)

    const assignmentId =
      event.dataTransfer.getData("assignmentId")

    const agentName =
      event.dataTransfer.getData("agentName")

    const fromSite =
      event.dataTransfer.getData("fromSite")

    const fromSlot =
      event.dataTransfer.getData("fromSlot")

    if (
      !assignmentId ||
      !agentName ||
      !fromSite ||
      !fromSlot
    ) {
      return
    }

    void onMoveAgent(
      assignmentId,
      agentName,
      fromSite,
      fromSlot,
      siteName,
      slotKey
    )
  }

  async function openReplacementSuggestions(
    vacancyId: string | number
  ) {
    setSuggestionsVacancyId(vacancyId)
    setCandidates([])
    setReplacementError("")
    setLoadingCandidates(true)

    try {
      const [results, requirements] =
        await Promise.all([
          ReplacementEngine.getBestCandidates(
            vacancyId,
            8
          ),
          PlanningRequirementsService.getBySite(
            siteId
          ),
        ])

      const requirement = requirements.find(
        (row) => row.slot_key === slotKey
      )

      const required =
        requirement?.required_agents ?? 0

      const assigned = items.filter(
        (item) => !item.isVacancy
      ).length

      setReplacementContext({
        required,
        assigned,
        missing: Math.max(
          0,
          required - assigned
        ),
      })

      setCandidates(results)
    } catch (error: unknown) {
      setReplacementError(
        error instanceof Error
          ? error.message
          : "Impossible de rechercher des remplaçants."
      )
    } finally {
      setLoadingCandidates(false)
    }
  }

  function openManualReplacement() {
    if (suggestionsVacancyId === null) {
      return
    }

    setReplacementVacancyId(
      suggestionsVacancyId
    )
    setSuggestionsVacancyId(null)
    setCandidates([])
    setReplacementError("")
    setReplacementContext({
      required: 0,
      assigned: 0,
      missing: 0,
    })
    setOpenDialog(true)
  }

  function openNewAssignment() {
    setReplacementVacancyId(null)
    setOpenDialog(true)
  }

  function closeDialog() {
    setOpenDialog(false)
    setReplacementVacancyId(null)
  }

  function closeSuggestions() {
    if (assigningAgentId !== null) {
      return
    }

    setSuggestionsVacancyId(null)
    setCandidates([])
    setReplacementError("")
  }

  async function assignCandidate(
    candidate: ReplacementCandidate
  ) {
    if (suggestionsVacancyId === null) {
      return
    }

    setAssigningAgentId(candidate.agentId)
    setReplacementError("")

    try {
      await ReplacementEngine.assignCandidate({
        vacancyId: suggestionsVacancyId,
        agentId: candidate.agentId,
        commentaire:
          `Remplacement suggéré par AGENTIS : ${candidate.agentName} (${candidate.score} %)`,
      })

      await onAssignmentCreated()

      setSuggestionsVacancyId(null)
      setCandidates([])
      setReplacementContext({
        required: 0,
        assigned: 0,
        missing: 0,
      })
    } catch (error: unknown) {
      setReplacementError(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer ce remplacement."
      )
    } finally {
      setAssigningAgentId(null)
    }
  }

  return (
    <>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = "move"
          setIsDragOver(true)
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(event) => {
          const relatedTarget =
            event.relatedTarget

          if (
            relatedTarget instanceof Node &&
            event.currentTarget.contains(
              relatedTarget
            )
          ) {
            return
          }

          setIsDragOver(false)
        }}
        onDrop={handleDrop}
        className={`relative min-h-[96px] border-l border-slate-200 px-2 py-2.5 transition ${
          isDragOver
            ? "bg-amber-50 ring-1 ring-inset ring-amber-300"
            : "hover:bg-slate-50/70"
        }`}
      >
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <button
              type="button"
              onClick={openNewAssignment}
              className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-2 text-xs font-medium text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
            >
              Déposer ou ajouter
            </button>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                draggable={!item.isVacancy}
                onDragStart={(event) =>
                  handleDragStart(event, item)
                }
                className={
                  item.isVacancy
                    ? "w-full"
                    : "w-full cursor-grab active:cursor-grabbing"
                }
              >
                <PlanningAgentBadge
                  assignmentId={item.id}
                  name={
                    item.isVacancy
                      ? "Agent absent"
                      : item.name
                  }
                  position={label}
                  start={start}
                  end={end}
                  status={item.status}
                  onReplace={
                    openReplacementSuggestions
                  }
                  onEdit={(assignmentId) => {
                    void onEditAssignment(
                      assignmentId
                    )
                  }}
                  onMove={(assignmentId) => {
                    void onMoveAssignment(
                      assignmentId
                    )
                  }}
                  onDelete={(assignmentId) => {
                    void onDeleteVacancy(
                      assignmentId
                    )
                  }}
                  onDuplicate={(assignmentId) => {
                    void onDuplicateAssignment(
                      assignmentId
                    )
                  }}
                />
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={openNewAssignment}
            title={`Ajouter une affectation — ${siteName}, ${label}`}
            aria-label={`Ajouter une affectation sur ${siteName}, créneau ${label}`}
            className="mt-2 flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AddAssignmentDialog
        open={openDialog}
        onClose={closeDialog}
        selectedDate={selectedDate}
        initialSiteId={siteId}
        initialSlot={slotKey}
        vacancyId={replacementVacancyId}
        onAssignmentCreated={
          onAssignmentCreated
        }
      />

      {suggestionsVacancyId !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <div className="flex items-center gap-2 text-amber-600">
                  <Sparkles className="h-5 w-5" />

                  <p className="text-xs font-bold uppercase tracking-[0.18em]">
                    AGENTIS
                  </p>
                </div>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  Suggestions de remplacement
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  {siteName} · {label} ·{" "}
                  {selectedDate}
                </p>
              </div>

              <button
                type="button"
                onClick={closeSuggestions}
                disabled={assigningAgentId !== null}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Fermer les suggestions"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <ContextMetric
                  label="Besoin"
                  value={replacementContext.required}
                  tone="slate"
                />

                <ContextMetric
                  label="Affectés"
                  value={replacementContext.assigned}
                  tone="emerald"
                />

                <ContextMetric
                  label="Manquants"
                  value={replacementContext.missing}
                  tone={
                    replacementContext.missing >= 2
                      ? "red"
                      : replacementContext.missing === 1
                        ? "amber"
                        : "emerald"
                  }
                />
              </div>
            </div>

            <div className="p-6">
              {loadingCandidates ? (
                <div className="flex min-h-52 items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                    Recherche des meilleurs
                    remplaçants…
                  </div>
                </div>
              ) : replacementError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>{replacementError}</p>
                  </div>
                </div>
              ) : candidates.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500" />

                  <p className="mt-4 font-semibold text-slate-900">
                    Aucun remplaçant disponible
                  </p>

                  <p className="mt-2 max-w-md text-sm text-slate-600">
                    Aucun agent actif ne respecte
                    actuellement les critères de
                    disponibilité du créneau.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map(
                    (candidate, index) => {
                      const assigning =
                        assigningAgentId ===
                        candidate.agentId

                      return (
                        <article
                          key={candidate.agentId}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-300 hover:bg-amber-50/40"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                                  {index + 1}
                                </span>

                                <div>
                                  <h4 className="font-bold text-slate-900">
                                    {
                                      candidate.agentName
                                    }
                                  </h4>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Candidat disponible
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {candidate.reasons.map(
                                  (reason) => (
                                    <span
                                      key={reason}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      {reason}
                                    </span>
                                  )
                                )}
                              </div>

                              {candidate.warnings.length >
                                0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {candidate.warnings.map(
                                    (warning) => (
                                      <span
                                        key={warning}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                                      >
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {warning}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
                              <div
                                className={`min-w-[118px] rounded-xl border px-4 py-3 text-center ${
                                  candidate.score >= 80
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : candidate.score >= 60
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                }`}
                              >
                                <div className="text-lg font-extrabold">
                                  {candidate.score} %
                                </div>

                                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                                  {getCandidateLevel(
                                    candidate.score
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  assigningAgentId !==
                                  null
                                }
                                onClick={() =>
                                  void assignCandidate(
                                    candidate
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {assigning ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserRoundCheck className="h-4 w-4" />
                                )}

                                {assigning
                                  ? "Affectation…"
                                  : "Choisir"}
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    }
                  )}
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
              <p className="text-xs text-slate-600">
                Les suggestions sont classées selon
                la disponibilité et les données RH
                enregistrées.
              </p>

              <button
                type="button"
                onClick={openManualReplacement}
                disabled={assigningAgentId !== null}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remplacement manuel
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}

function ContextMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "slate" | "emerald" | "amber" | "red"
}) {
  const styles = {
    slate:
      "border-slate-200 bg-white text-slate-800",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
    red:
      "border-red-200 bg-red-50 text-red-700",
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${styles[tone]}`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-extrabold">
        {value}
      </div>
    </div>
  )
}

function getCandidateLevel(score: number) {
  if (score >= 85) {
    return "Excellent"
  }

  if (score >= 70) {
    return "Très bon"
  }

  if (score >= 55) {
    return "Compatible"
  }

  return "À vérifier"
}