"use client"

import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  MoveRight,
  UserRound,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { planningSlots } from "@/lib/planning/slots"
import { PlanningService } from "@/lib/services/PlanningService"
import { SiteService } from "@/lib/services/SiteService"
import PlanningRequirementsService, {
  type PlanningRequirementRow,
} from "@/lib/services/PlanningRequirementsService"

type PlanningSlotKey =
  (typeof planningSlots)[number]["key"]

type MoveAssignmentDialogProps = {
  open: boolean
  assignmentId: string | number | null
  selectedDate: string
  onClose: () => void
  onMoved?: () => void | Promise<void>
}

type AssignmentRecord = {
  id: string | number
  date: string
  agent_id: string | number | null
  site_id: string | number
  service: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
  agent?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null
  site?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null
}

type SiteRecord = {
  id: string | number
  nom: string | null
}

type PlanningDayRow = {
  id: string | number
  date: string
  site_id: string | number
  service: string | null
  est_poste_vacant?: boolean | null
  agent_id: string | number | null
  statut: string | null
}

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() || ""
}

function getRelationName(
  relation:
    | {
        nom: string | null
      }
    | {
        nom: string | null
      }[]
    | null
    | undefined
) {
  if (Array.isArray(relation)) {
    return relation[0]?.nom?.trim() || null
  }

  return relation?.nom?.trim() || null
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object") {
    const possibleError = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const parts = [
      typeof possibleError.message === "string"
        ? possibleError.message
        : null,
      typeof possibleError.details === "string"
        ? possibleError.details
        : null,
      typeof possibleError.hint === "string"
        ? possibleError.hint
        : null,
      typeof possibleError.code === "string"
        ? `Code : ${possibleError.code}`
        : null,
    ].filter(
      (value): value is string =>
        typeof value === "string" && value.length > 0
    )

    if (parts.length > 0) {
      return parts.join(" — ")
    }
  }

  return "Une erreur inconnue est survenue."
}

function isVacancy(row: PlanningDayRow) {
  const status = normalize(row.statut)

  return (
    row.est_poste_vacant === true ||
    row.agent_id === null ||
    status === "absent" ||
    status === "absence"
  )
}

export default function MoveAssignmentDialog({
  open,
  assignmentId,
  selectedDate,
  onClose,
  onMoved,
}: MoveAssignmentDialogProps) {
  const [assignment, setAssignment] =
    useState<AssignmentRecord | null>(null)

  const [sites, setSites] = useState<SiteRecord[]>([])
  const [planningDay, setPlanningDay] =
    useState<PlanningDayRow[]>([])

  const [requirementRows, setRequirementRows] =
    useState<PlanningRequirementRow[]>([])

  const [targetSiteId, setTargetSiteId] = useState("")
  const [targetSlot, setTargetSlot] =
    useState<PlanningSlotKey>(
      planningSlots[0]?.key ?? "matin"
    )

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

 useEffect(() => {
  if (!open || assignmentId === null) {
    return
  }

  const currentAssignmentId = assignmentId
  let active = true

  async function loadData() {
    try {
      setLoading(true)
      setErrorMessage("")

      const [
        assignmentData,
        sitesData,
        dayData,
        requirementsData,
      ] = await Promise.all([
        PlanningService.getById(
          currentAssignmentId
        ),
        SiteService.list(),
        PlanningService.getDay(
          selectedDate
        ),
        PlanningRequirementsService.list(),
      ])

        if (!active) return

        const currentAssignment =
          assignmentData as AssignmentRecord

        setAssignment(currentAssignment)

        setSites(
          Array.isArray(sitesData)
            ? (sitesData as SiteRecord[]).filter(
                (site) =>
                  site.id !== undefined &&
                  Boolean(site.nom?.trim())
              )
            : []
        )

        setPlanningDay(
          Array.isArray(dayData)
            ? (dayData as PlanningDayRow[])
            : []
        )

        setRequirementRows(
          Array.isArray(requirementsData)
            ? requirementsData
            : []
        )

        setTargetSiteId(
          String(currentAssignment.site_id)
        )

        const currentSlot = planningSlots.find(
          (slot) =>
            slot.key === currentAssignment.service
        )

        setTargetSlot(
          currentSlot?.key ??
            planningSlots[0]?.key ??
            "matin"
        )
      } catch (error: unknown) {
        if (!active) return

        setAssignment(null)
        setErrorMessage(
          getErrorMessage(error) ||
            "Impossible de charger cette affectation."
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [assignmentId, open, selectedDate])

  useEffect(() => {
    if (!open) {
      setAssignment(null)
      setSites([])
      setPlanningDay([])
      setRequirementRows([])
      setTargetSiteId("")
      setErrorMessage("")
      setSubmitting(false)
    }
  }, [open])

  const targetSite = useMemo(
    () =>
      sites.find(
        (site) =>
          String(site.id) === targetSiteId
      ) || null,
    [sites, targetSiteId]
  )

  const targetSlotConfig = useMemo(
    () =>
      planningSlots.find(
        (slot) => slot.key === targetSlot
      ) || null,
    [targetSlot]
  )

  const sourceSiteName =
    getRelationName(assignment?.site) ||
    sites.find(
      (site) =>
        String(site.id) ===
        String(assignment?.site_id)
    )?.nom ||
    "Site d’origine"

  const agentName =
    getRelationName(assignment?.agent) ||
    (assignment?.agent_id
      ? `Agent ${assignment.agent_id}`
      : "Agent")

  const sourceSlotConfig = planningSlots.find(
    (slot) => slot.key === assignment?.service
  )

  const sameDestination =
    assignment !== null &&
    String(assignment.site_id) === targetSiteId &&
    assignment.service === targetSlot

  const targetVacancy = useMemo(() => {
    if (!targetSiteId || !targetSlot) {
      return null
    }

    return (
      planningDay.find(
        (row) =>
          String(row.site_id) === targetSiteId &&
          row.service === targetSlot &&
          isVacancy(row)
      ) || null
    )
  }, [planningDay, targetSiteId, targetSlot])

  const requirementsBySite = useMemo(
    () =>
      PlanningRequirementsService.buildBySite(
        requirementRows
      ),
    [requirementRows]
  )

  const impact = useMemo(() => {
    if (!assignment || !targetSiteId) {
      return null
    }

    const sourceSiteId = String(assignment.site_id)
    const sourceSlot =
      assignment.service ||
      sourceSlotConfig?.key ||
      ""

    const sourceExpected =
      requirementsBySite[sourceSiteId]?.[
        sourceSlot as PlanningSlotKey
      ] ?? 0

    const targetExpected =
      requirementsBySite[targetSiteId]?.[
        targetSlot
      ] ?? 0

    const sourceAssignedBefore =
      planningDay.filter(
        (row) =>
          String(row.site_id) === sourceSiteId &&
          row.service === sourceSlot &&
          !isVacancy(row)
      ).length

    const targetAssignedBefore =
      planningDay.filter(
        (row) =>
          String(row.site_id) === targetSiteId &&
          row.service === targetSlot &&
          !isVacancy(row)
      ).length

    const sourceAssignedAfter = Math.max(
      0,
      sourceAssignedBefore - 1
    )

    const targetAssignedAfter =
      targetAssignedBefore + 1

    const sourceMissingBefore = Math.max(
      0,
      sourceExpected - sourceAssignedBefore
    )

    const sourceMissingAfter = Math.max(
      0,
      sourceExpected - sourceAssignedAfter
    )

    const targetMissingBefore = Math.max(
      0,
      targetExpected - targetAssignedBefore
    )

    const targetMissingAfter = Math.max(
      0,
      targetExpected - targetAssignedAfter
    )

    const missingBefore =
      sourceMissingBefore + targetMissingBefore

    const missingAfter =
      sourceMissingAfter + targetMissingAfter

    return {
      sourceExpected,
      sourceAssignedBefore,
      sourceAssignedAfter,
      sourceMissingBefore,
      sourceMissingAfter,
      targetExpected,
      targetAssignedBefore,
      targetAssignedAfter,
      targetMissingBefore,
      targetMissingAfter,
      deltaMissing: missingAfter - missingBefore,
    }
  }, [
    assignment,
    planningDay,
    requirementsBySite,
    sourceSlotConfig?.key,
    targetSiteId,
    targetSlot,
  ])

  if (!open) {
    return null
  }

  async function handleMove() {
    if (!assignment) {
      setErrorMessage(
        "L’affectation à déplacer est introuvable."
      )
      return
    }

    if (!targetSiteId) {
      setErrorMessage(
        "Veuillez sélectionner une structure cible."
      )
      return
    }

    if (!targetSlotConfig) {
      setErrorMessage(
        "Veuillez sélectionner un créneau cible."
      )
      return
    }

    if (sameDestination) {
      setErrorMessage(
        "La destination est identique à l’affectation actuelle."
      )
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage("")

      if (
        assignment.agent_id !== null &&
        assignment.agent_id !== undefined
      ) {
        const conflict =
          await PlanningService.findAgentConflict({
            agentId: assignment.agent_id,
            date: assignment.date || selectedDate,
            heureDebut:
              targetSlotConfig.start ?? null,
            excludeAssignmentId: assignment.id,
          })

        if (conflict) {
          throw new Error(
            "Cet agent possède déjà une affectation sur ce créneau."
          )
        }
      }

      await PlanningService.moveAssignmentWithVacancy({
        assignmentId: assignment.id,
        date: assignment.date || selectedDate,

        sourceSiteId: assignment.site_id,
        sourceService:
          assignment.service ||
          sourceSlotConfig?.key ||
          targetSlot,
        sourceStart:
          assignment.heure_debut ??
          sourceSlotConfig?.start ??
          null,
        sourceEnd:
          assignment.heure_fin ??
          sourceSlotConfig?.end ??
          null,

        targetSiteId,
        targetService: targetSlot,
        targetStart:
          targetSlotConfig.start ?? null,
        targetEnd:
          targetSlotConfig.end ?? null,

        targetVacancyId:
          targetVacancy?.id ?? null,
      })

      await onMoved?.()
      onClose()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error) ||
          "Impossible de déplacer cette affectation."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose()
        }
      }}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-assignment-dialog-title"
      >
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 bg-slate-50 px-7 py-6">
          <div>
            <div className="flex items-center gap-2 text-amber-600">
              <MoveRight className="h-5 w-5" />

              <p className="text-xs font-bold uppercase tracking-[0.18em]">
                AGENTIS · Déplacement
              </p>
            </div>

            <h2
              id="move-assignment-dialog-title"
              className="mt-2 text-2xl font-extrabold text-slate-950"
            >
              Déplacer une affectation
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Choisissez une nouvelle structure et un nouveau créneau.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer la fenêtre"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {errorMessage && (
          <div className="border-b border-red-200 bg-red-50 px-7 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement de l’affectation…
            </div>
          </div>
        ) : assignment ? (
          <>
            <div className="space-y-6 p-7">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Affectation actuelle
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InfoItem
                    icon={<UserRound className="h-4 w-4" />}
                    label="Agent"
                    value={agentName}
                  />

                  <InfoItem
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Date"
                    value={assignment.date || selectedDate}
                  />

                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Structure"
                    value={sourceSiteName}
                  />

                  <InfoItem
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Créneau"
                    value={
                      sourceSlotConfig
                        ? `${sourceSlotConfig.label} · ${sourceSlotConfig.time}`
                        : assignment.service || "Non renseigné"
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                  Nouvelle destination
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      Structure cible
                    </span>

                    <select
                      value={targetSiteId}
                      disabled={submitting}
                      onChange={(event) =>
                        setTargetSiteId(
                          event.target.value
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">
                        Sélectionner une structure
                      </option>

                      {sites.map((site) => (
                        <option
                          key={site.id}
                          value={String(site.id)}
                        >
                          {site.nom || `Site ${site.id}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock3 className="h-4 w-4 text-amber-600" />
                      Créneau cible
                    </span>

                    <select
                      value={targetSlot}
                      disabled={submitting}
                      onChange={(event) =>
                        setTargetSlot(
                          event.target
                            .value as PlanningSlotKey
                        )
                      }
                      className={selectClass}
                    >
                      {planningSlots.map((slot) => (
                        <option
                          key={slot.key}
                          value={slot.key}
                        >
                          {slot.label} — {slot.time}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <span className="font-semibold">
                    {sourceSiteName}
                  </span>

                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" />

                  <span className="font-semibold">
                    {targetSite?.nom ||
                      "Structure cible"}
                  </span>
                </div>
              </section>

              {impact && !sameDestination && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Impact estimé
                    </p>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        impact.deltaMissing < 0
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : impact.deltaMissing > 0
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {impact.deltaMissing < 0
                        ? `${Math.abs(impact.deltaMissing)} manque en moins`
                        : impact.deltaMissing > 0
                          ? `${impact.deltaMissing} manque en plus`
                          : "Impact neutre"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <ImpactCard
                      title="Créneau d’origine"
                      before={`${impact.sourceAssignedBefore}/${impact.sourceExpected}`}
                      after={`${impact.sourceAssignedAfter}/${impact.sourceExpected}`}
                      missingBefore={impact.sourceMissingBefore}
                      missingAfter={impact.sourceMissingAfter}
                    />

                    <ImpactCard
                      title="Créneau cible"
                      before={`${impact.targetAssignedBefore}/${impact.targetExpected}`}
                      after={`${impact.targetAssignedAfter}/${impact.targetExpected}`}
                      missingBefore={impact.targetMissingBefore}
                      missingAfter={impact.targetMissingAfter}
                    />
                  </div>
                </section>
              )}

              {targetVacancy && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Un poste vacant existe sur cette destination. Il sera automatiquement remplacé par l’agent déplacé.
                </div>
              )}

              {!targetVacancy && !sameDestination && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Aucun poste vacant n’est enregistré sur cette destination. L’affectation sera ajoutée au créneau et un poste vacant sera créé sur le créneau d’origine.
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-7 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void handleMove()}
                disabled={
                  submitting ||
                  !targetSiteId ||
                  !targetSlotConfig ||
                  sameDestination
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoveRight className="h-4 w-4" />
                )}

                {submitting
                  ? "Déplacement…"
                  : "Confirmer le déplacement"}
              </button>
            </footer>
          </>
        ) : (
          <div className="p-7 text-sm text-slate-600">
            Affectation introuvable.
          </div>
        )}
      </div>
    </div>
  )
}

function ImpactCard({
  title,
  before,
  after,
  missingBefore,
  missingAfter,
}: {
  title: string
  before: string
  after: string
  missingBefore: number
  missingAfter: number
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {title}
      </p>

      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span>{before}</span>
        <ArrowRight className="h-4 w-4 text-amber-600" />
        <span>{after}</span>
      </div>

      <p
        className={`mt-2 text-xs font-semibold ${
          missingAfter < missingBefore
            ? "text-emerald-700"
            : missingAfter > missingBefore
              ? "text-red-700"
              : "text-slate-600"
        }`}
      >
        Manquants : {missingBefore} → {missingAfter}
      </p>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
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