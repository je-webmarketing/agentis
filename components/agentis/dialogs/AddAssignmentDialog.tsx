"use client"

import { useEffect, useState } from "react"
import { AgentService } from "@/lib/services/AgentService"
import { SiteService } from "@/lib/services/SiteService"
import { PlanningService } from "@/lib/services/PlanningService"
import { PlanningValidator } from "@/lib/services/PlanningValidator"
import { planningSlots } from "@/lib/planning/slots"

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 focus:border-yellow-400 focus:outline-none"

type AgentRecord = {
  id: string | number
  nom: string | null
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

  /**
   * Facultatif : utilisés lorsque le dialogue est ouvert
   * depuis un poste vacant.
   */
  initialSiteId?: string | number | null
  initialSlot?: string | null
  vacancyId?: string | number | null
}

export default function AddAssignmentDialog({
  open,
  onClose,
  selectedDate,
  onAssignmentCreated,
  initialSiteId = null,
  initialSlot = null,
  vacancyId = null,
}: AddAssignmentDialogProps) {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [sites, setSites] = useState<SiteRecord[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [agentId, setAgentId] = useState("")
  const [siteId, setSiteId] = useState("")
  const [slot, setSlot] = useState("matin")
  const [status, setStatus] = useState("Présent")
  const [start, setStart] = useState("07:20")
  const [end, setEnd] = useState("08:35")
  const [commentaire, setCommentaire] = useState("")

  const isReplacement =
    vacancyId !== null && vacancyId !== undefined

  useEffect(() => {
    if (!open) return

    let active = true

    async function loadData() {
      try {
        setLoadingData(true)
        setErrorMessage("")

        const [agentsData, sitesData] = await Promise.all([
          AgentService.list(),
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
            ? (sitesData as SiteRecord[])
            : []
        )
      } catch (error: unknown) {
        if (!active) return

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les agents et les sites."
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

    setAgentId("")
    setCommentaire("")
    setErrorMessage("")

    const effectiveSlot =
      initialSlot &&
      planningSlots.some(
        (planningSlot) =>
          planningSlot.key === initialSlot
      )
        ? initialSlot
        : "matin"

    const slotConfig = planningSlots.find(
      (planningSlot) =>
        planningSlot.key === effectiveSlot
    )

    setSlot(effectiveSlot)
    setStart(slotConfig?.start ?? "07:20")
    setEnd(slotConfig?.end ?? "08:35")

    setSiteId(
      initialSiteId !== null &&
        initialSiteId !== undefined
        ? String(initialSiteId)
        : ""
    )

    setStatus(isReplacement ? "Remplacé" : "Présent")
  }, [
    open,
    initialSiteId,
    initialSlot,
    isReplacement,
  ])

  if (!open) return null

  async function handleSubmit() {
    if (!selectedDate) {
      setErrorMessage(
        "La date du planning est manquante."
      )
      return
    }

    if (!agentId || !siteId) {
      setErrorMessage(
        "Veuillez sélectionner un agent et un site."
      )
      return
    }

    if (!slot) {
      setErrorMessage(
        "Veuillez sélectionner un créneau."
      )
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage("")

      const validation =
        await PlanningValidator.validateAssignment({
          agent_id: agentId,
          date: selectedDate,
          heure_debut: start,
          heure_fin: end,
        })

      if (!validation.valid) {
        setErrorMessage(
          validation.errors.join(" — ")
        )
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

      /*
       * Cas 1 : remplacement d’un poste vacant.
       */
      if (isReplacement) {
        await PlanningService.replaceVacancy({
          vacancyId,
          date: selectedDate,
          agentId,
          siteId,
          service: slot,
          start,
          end,
          commentaire,
        })
      } else {
        /*
         * Cas 2 : création d’une nouvelle affectation.
         */
        await PlanningService.createAssignment({
          date: selectedDate,
          agent_id: agentId,
          site_id: siteId,
          service: slot,
          heure_debut: start,
          heure_fin: end,
          statut: status,
          commentaire,
          })
      }

      await onAssignmentCreated?.()
      onClose()
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur lors de l’enregistrement."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const selectedSiteLocked =
    initialSiteId !== null &&
    initialSiteId !== undefined

  const selectedSlotLocked =
    initialSlot !== null &&
    initialSlot !== undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-dialog-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-yellow-500/20 bg-[#0f172a] shadow-2xl">
        <div className="border-b border-slate-800 px-8 py-6">
          <h2
            id="assignment-dialog-title"
            className="text-2xl font-bold text-white"
          >
            {isReplacement
              ? "Remplacer l’agent absent"
              : "Nouvelle affectation"}
          </h2>

          <p className="mt-2 text-slate-400">
            {isReplacement
              ? "Sélectionnez l’agent qui occupera ce poste vacant."
              : "Affecter un agent sur un site et un créneau."}
          </p>

          <p className="mt-2 text-sm text-yellow-300">
            Planning du {selectedDate}
          </p>
        </div>

        {errorMessage && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-8 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 p-8 md:grid-cols-2">
          <Field label="Agent">
            <select
              className={inputClass}
              value={agentId}
              disabled={loadingData}
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
                loadingData || selectedSiteLocked
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
              disabled={selectedSlotLocked}
              onChange={(event) => {
                const selectedSlot =
                  planningSlots.find(
                    (item) =>
                      item.key === event.target.value
                  )

                setSlot(event.target.value)

                if (selectedSlot) {
                  setStart(selectedSlot.start)
                  setEnd(selectedSlot.end)
                }
              }}
            >
              {planningSlots.map(
                (planningSlot) => (
                  <option
                    key={planningSlot.key}
                    value={planningSlot.key}
                  >
                    {planningSlot.label}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="Statut">
            <select
              className={inputClass}
              value={status}
              disabled={isReplacement}
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

          <Field label="Début">
            <input
              type="time"
              className={inputClass}
              value={start}
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
                onChange={(event) =>
                  setCommentaire(
                    event.target.value
                  )
                }
                placeholder={
                  isReplacement
                    ? "Motif ou information sur le remplacement"
                    : "Commentaire optionnel"
                }
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-700 px-5 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              submitting ||
              loadingData ||
              !agentId ||
              !siteId
            }
            className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Enregistrement…"
              : isReplacement
                ? "Confirmer le remplacement"
                : "Enregistrer"}
          </button>
        </div>
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
    <div>
      <label className="mb-2 block text-sm text-slate-400">
        {label}
      </label>

      {children}
    </div>
  )
}