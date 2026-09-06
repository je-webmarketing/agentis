"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Copy,
  Pencil,
  Plus,
  UserRoundCheck,
  X,
} from "lucide-react"
import { AgentService } from "@/lib/services/AgentService"
import { SiteService } from "@/lib/services/SiteService"
import { PlanningService } from "@/lib/services/PlanningService"
import { PlanningValidator } from "@/lib/services/PlanningValidator"
import { planningSlots } from "@/lib/planning/slots"

type PlanningSlotKey =
  (typeof planningSlots)[number]["key"]

export type AssignmentDialogMode =
  | "create"
  | "duplicate"
  | "replacement"
  | "edit"

export type AssignmentInitialValues = {
  assignmentId?: string | number | null
  agentId?: string | number | null
  siteId?: string | number | null
  date?: string | null
  slot?: PlanningSlotKey | null
  status?: string | null
  start?: string | null
  end?: string | null
  commentaire?: string | null
}

type AgentRecord = {
  id: string | number
  nom: string | null
  service_id?: string | number | null
}

type SiteRecord = {
  id: string | number
  nom: string | null
}

type AddAssignmentDialogProps = {
  open: boolean
  onClose: () => void
  selectedDate: string
  onAssignmentCreated?: () => void | Promise<void>
  configuredSlots?: typeof planningSlots

  /*
   * Compatibilité avec les appels existants.
   */
  initialSiteId?: string | number | null
  initialSlot?: string | null
  vacancyId?: string | number | null

  /*
   * Nouvelles propriétés universelles.
   */
  mode?: AssignmentDialogMode
  initialValues?: AssignmentInitialValues | null
}

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"

function getErrorMessage(error: unknown): string {
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

function getDefaultSlotKey(): PlanningSlotKey {
  return planningSlots[0]?.key ?? "matin"
}

function getSlotConfiguration(
  slotKey: PlanningSlotKey
) {
  return planningSlots.find(
    (planningSlot) => planningSlot.key === slotKey
  )
}

export default function AddAssignmentDialog({
  open,
  onClose,
  selectedDate,
  onAssignmentCreated,
  configuredSlots = planningSlots,
  initialSiteId = null,
  initialSlot = null,
  vacancyId = null,
  mode,
  initialValues = null,
}: AddAssignmentDialogProps) {

  const effectiveMode: AssignmentDialogMode =
    mode ||
    (vacancyId !== null && vacancyId !== undefined
      ? "replacement"
      : "create")

  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [sites, setSites] = useState<SiteRecord[]>([])

  const [loadingData, setLoadingData] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [date, setDate] = useState(selectedDate)
  const [agentId, setAgentId] = useState("")
  const [siteId, setSiteId] = useState("")
  const [slot, setSlot] =
  useState<PlanningSlotKey>(getDefaultSlotKey())
  const [status, setStatus] = useState("Présent")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [commentaire, setCommentaire] = useState("")

  const selectedSlot = useMemo(
  () =>
    configuredSlots.find(
      (planningSlot) =>
        planningSlot.key === slot
    ),
  [slot, configuredSlots]
)

  const assignmentId =
    initialValues?.assignmentId ?? null

  const effectiveVacancyId =
    vacancyId ?? initialValues?.assignmentId ?? null

  
  const isDuplicate = effectiveMode === "duplicate"
  const isReplacement = effectiveMode === "replacement"
  const isEdit = effectiveMode === "edit"

  /*
   * En remplacement, le site et le créneau correspondent
   * obligatoirement au poste vacant.
   */
  const siteLocked = isReplacement
  const slotLocked = isReplacement

  /*
   * Lors d’une duplication, l’agent source reste le même.
   */
  const agentLocked = isDuplicate

  useEffect(() => {
    if (!open) return

    let active = true

    async function loadData() {
      try {
        setLoadingData(true)
        setErrorMessage("")

        const [agentsData, sitesData] = await Promise.all([
          AgentService.listPlanningCandidates(),
          SiteService.list(),
        ])



        if (!active) return

        setAgents(
          Array.isArray(agentsData)
            ? (agentsData as AgentRecord[])
            : []
        )

        setSites(
          Array.isArray(sitesData)
            ? (sitesData as SiteRecord[]).filter(
                (site) =>
                  site.id !== undefined &&
                  Boolean(site.nom?.trim())
              )
            : []
        )
      } catch (error: unknown) {
        if (!active) return

        setErrorMessage(
          getErrorMessage(error) ||
            "Impossible de charger les agents et les sites."
        )
      } finally {
        if (active) {
          setLoadingData(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const effectiveDate =
      initialValues?.date ||
      selectedDate

    const effectiveSiteId =
      initialValues?.siteId ??
      initialSiteId ??
      null

    const effectiveSlot: PlanningSlotKey =
  initialValues?.slot ??
  (initialSlot as PlanningSlotKey | null) ??
  getDefaultSlotKey()

    const slotConfiguration =
  configuredSlots.find(
    (planningSlot) =>
      planningSlot.key === effectiveSlot
  )

    setDate(effectiveDate)
    setAgentId(
      initialValues?.agentId !== null &&
        initialValues?.agentId !== undefined
        ? String(initialValues.agentId)
        : ""
    )
    setSiteId(
      effectiveSiteId !== null &&
        effectiveSiteId !== undefined
        ? String(effectiveSiteId)
        : ""
    )
    setSlot(effectiveSlot)
    setStart(
      initialValues?.start ??
        slotConfiguration?.start ??
        ""
    )
    setEnd(
      initialValues?.end ??
        slotConfiguration?.end ??
        ""
    )
    setStatus(
      initialValues?.status ||
        (isReplacement ? "Remplacé" : "Présent")
    )
    setCommentaire(
      initialValues?.commentaire || ""
    )
    setErrorMessage("")
    setSubmitting(false)
 }, [
  open,
  selectedDate,
  initialSiteId,
  initialSlot,
  initialValues,
  isReplacement,
  configuredSlots,
])

  if (!open) return null

  function handleSlotChange(
  nextSlot: PlanningSlotKey
) {
  const slotConfiguration =
    configuredSlots.find(
      (planningSlot) =>
        planningSlot.key === nextSlot
    )

  setSlot(nextSlot)

  if (slotConfiguration) {
    setStart(slotConfiguration.start)
    setEnd(slotConfiguration.end)
  }
}

  async function handleSubmit() {
  if (!date) {
    setErrorMessage("Veuillez sélectionner une date.")
    return
  }

  if (!agentId) {
    setErrorMessage("Veuillez sélectionner un agent.")
    return
  }

  if (!siteId) {
    setErrorMessage("Veuillez sélectionner un site.")
    return
  }

  if (!slot) {
    setErrorMessage("Veuillez sélectionner un créneau.")
    return
  }

  if (!start || !end) {
    setErrorMessage("Veuillez renseigner les horaires.")
    return
  }

  if (start >= end) {
    setErrorMessage(
      "L’heure de fin doit être postérieure à l’heure de début."
    )
    return
  }

  if (
    isReplacement &&
    (effectiveVacancyId === null ||
      effectiveVacancyId === undefined)
  ) {
    setErrorMessage(
      "L’identifiant du poste vacant est manquant."
    )
    return
  }

  if (
    isEdit &&
    (assignmentId === null ||
      assignmentId === undefined)
  ) {
    setErrorMessage(
      "L’identifiant de l’affectation à modifier est manquant."
    )
    return
  }

  const selectedAgent = agents.find(
  (agent) => String(agent.id) === String(agentId)
)

const selectedAgentServiceId =
  selectedAgent?.service_id ?? null

  try {
    setSubmitting(true)
    setErrorMessage("")

    const validation =
      await PlanningValidator.validateAssignment({
        agent_id: agentId,
        date,
        heure_debut: start,
        heure_fin: end,
      })


    if (!validation.valid) {
      setErrorMessage(validation.errors.join(" — "))
      return
    }

    if (validation.warnings.length > 0) {
      const confirmed = window.confirm(
        `${validation.warnings.join(
          "\n\n"
        )}\n\nSouhaitez-vous continuer ?`
      )

      if (!confirmed) {
        return
      }
    }

    if (isReplacement) {
      if (
        effectiveVacancyId === null ||
        effectiveVacancyId === undefined
      ) {
        return
      }

      await PlanningService.replaceVacancy({
        vacancyId: effectiveVacancyId,
        date,
        agentId,
        siteId,
        service: slot,
        start,
        end,
        commentaire,
      })
    } else if (isEdit) {
      if (
        assignmentId === null ||
        assignmentId === undefined
      ) {
        return
      }

      console.log("MODE EDIT APPELÉ", {
  assignmentId,
  date,
  agentId,
  siteId,
  slot,
})

console.log("APPEL updateAssignment", assignmentId)

      await PlanningService.updateAssignment(
        assignmentId,
        {
          date,
          agent_id: agentId,
          site_id: siteId,
          service: slot,
          heure_debut: start,
          heure_fin: end,
          statut: status,
          commentaire: commentaire.trim() || null,
        }
      )
    } else {
      await PlanningService.createAssignment({
        date,
        agent_id: agentId,
        site_id: siteId,
        service: slot,
        service_id: selectedAgentServiceId,
        heure_debut: start,
        heure_fin: end,
        statut:
          isDuplicate && status === "Absent"
            ? "Présent"
            : status,
        commentaire: isDuplicate
          ? commentaire.trim()
            ? `${commentaire.trim()} — Affectation dupliquée`
            : "Affectation dupliquée"
          : commentaire.trim() || null,
      })
    }

    await onAssignmentCreated?.()
    onClose()
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error) ||
        "Erreur lors de l’enregistrement."
    )
  } finally {
    setSubmitting(false)
  }
}

  const dialogContent = getDialogContent(
    effectiveMode
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-dialog-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose()
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-yellow-500/20 bg-[#0f172a] shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-5 border-b border-slate-800 px-8 py-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/25 bg-yellow-500/10 text-yellow-300">
                <DialogIcon mode={effectiveMode} />
              </div>

              <div>
                <h2
                  id="assignment-dialog-title"
                  className="text-2xl font-bold text-white"
                >
                  {dialogContent.title}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {dialogContent.description}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-yellow-300">
              Date de travail : {date || "non renseignée"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer la fenêtre"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {errorMessage && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-8 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 p-8 md:grid-cols-2">
          <Field label="Date">
            <input
              type="date"
              className={inputClass}
              value={date}
              disabled={isReplacement}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </Field>

          <Field label="Agent">
            <select
              className={inputClass}
              value={agentId}
              disabled={
                loadingData ||
                submitting ||
                agentLocked
              }
              onChange={(event) =>
                setAgentId(event.target.value)
              }
            >
              <option value="">
                {loadingData
                  ? "Chargement des agents…"
                  : "Sélectionner un agent"}
              </option>

              {agents.map((agent) => (
                <option
                  key={agent.id}
                  value={String(agent.id)}
                >
                  {agent.nom || `Agent ${agent.id}`}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Site">
            <select
              className={inputClass}
              value={siteId}
              disabled={
                loadingData ||
                submitting ||
                siteLocked
              }
              onChange={(event) =>
                setSiteId(event.target.value)
              }
            >
              <option value="">
                {loadingData
                  ? "Chargement des sites…"
                  : "Sélectionner un site"}
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
          </Field>

          <Field label="Créneau">
            <select
              className={inputClass}
              value={slot}
              disabled={submitting || slotLocked}
              onChange={(event) =>
                handleSlotChange(
  event.target.value as PlanningSlotKey
)
              }
            >
              {configuredSlots.map(
  (planningSlot) => (
    <option
      key={planningSlot.key}
      value={planningSlot.key}
    >
      {planningSlot.label} —{" "}
      {planningSlot.time}
    </option>
  )
)}
            </select>
          </Field>

          <Field label="Statut">
            <select
              className={inputClass}
              value={status}
              disabled={
                submitting || isReplacement
              }
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="Présent">
                Présent
              </option>

              <option value="Remplacé">
                Remplacé
              </option>

              <option value="Absent">
                Absent
              </option>
            </select>
          </Field>

          <div className="hidden md:block" />

          <Field label="Début">
            <input
              type="time"
              className={inputClass}
              value={start}
              disabled={submitting}
              onChange={(event) =>
                setStart(event.target.value)
              }
            />
          </Field>

          <Field label="Fin">
            <input
              type="time"
              className={inputClass}
              value={end}
              disabled={submitting}
              onChange={(event) =>
                setEnd(event.target.value)
              }
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Commentaire">
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={commentaire}
                disabled={submitting}
                onChange={(event) =>
                  setCommentaire(
                    event.target.value
                  )
                }
                placeholder={
                  isReplacement
                    ? "Motif ou information sur le remplacement"
                    : isDuplicate
                      ? "Commentaire de la nouvelle affectation"
                      : isEdit
                        ? "Commentaire lié à la modification"
                        : "Commentaire optionnel"
                }
              />
            </Field>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-[#020817]/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Récapitulatif
            </p>

            <p className="mt-2 text-sm font-medium text-slate-200">
              {date || "Date non renseignée"} —{" "}
              {selectedSlot?.label ||
                "Créneau non renseigné"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {start || "—"} → {end || "—"}
            </p>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-800 px-8 py-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              submitting ||
              loadingData ||
              !date ||
              !agentId ||
              !siteId ||
              !slot ||
              !start ||
              !end
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DialogIcon mode={effectiveMode} />

            {submitting
              ? dialogContent.loadingLabel
              : dialogContent.submitLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-400">
        {label}
      </span>

      {children}
    </label>
  )
}

function DialogIcon({
  mode,
}: {
  mode: AssignmentDialogMode
}) {
  if (mode === "duplicate") {
    return <Copy className="h-4 w-4" />
  }

  if (mode === "edit") {
    return <Pencil className="h-4 w-4" />
  }

  if (mode === "replacement") {
    return <UserRoundCheck className="h-4 w-4" />
  }

  return <Plus className="h-4 w-4" />
}

function getDialogContent(
  mode: AssignmentDialogMode
) {
  if (mode === "duplicate") {
    return {
      title: "Dupliquer l’affectation",
      description:
        "Créer une nouvelle affectation à partir des informations existantes.",
      submitLabel: "Dupliquer",
      loadingLabel: "Duplication…",
    }
  }

  if (mode === "edit") {
    return {
      title: "Modifier l’affectation",
      description:
        "Mettre à jour les informations de cette affectation.",
      submitLabel: "Enregistrer les modifications",
      loadingLabel: "Enregistrement…",
    }
  }

  if (mode === "replacement") {
    return {
      title: "Remplacer l’agent absent",
      description:
        "Sélectionner l’agent qui occupera ce poste vacant.",
      submitLabel: "Confirmer le remplacement",
      loadingLabel: "Remplacement…",
    }
  }

  return {
    title: "Nouvelle affectation",
    description:
      "Affecter un agent sur un site et un créneau.",
    submitLabel: "Créer l’affectation",
    loadingLabel: "Création…",
  }
}