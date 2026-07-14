"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import PlanningSiteRow from "./PlanningSiteRow"
import { planningSlots } from "@/lib/planning/slots"
import { PlanningService } from "@/lib/services/PlanningService"
import { SiteService } from "@/lib/services/SiteService"
import type { PlanningSlotItem } from "./PlanningSlot"

type SiteStatus = "ok" | "warning" | "danger"

type PlanningGridProps = {
  selectedDate?: string
}

type PlanningRow = {
  id: string | number
  date: string
  agent_id: string | number | null
  site_id: string | number
  service: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
  commentaire?: string | null
  est_poste_vacant?: boolean | null
  agent?: {
    id: string | number
    nom: string | null
  } | null
  site?: {
    id: string | number
    nom: string | null
    structure_id?: string | number | null
  } | null
}

type SiteRow = {
  id: string | number
  name: string
  status: SiteStatus
  alerts: number
  slots: Record<string, PlanningSlotItem[]>
}

type SiteRecord = {
  id: string | number
  nom: string
  structure_id?: string | number | null
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function isVacancy(row: PlanningRow) {
  const statut = normalize(row.statut)

  return (
    row.est_poste_vacant === true ||
    row.agent_id === null ||
    statut === "absent" ||
    statut === "absence"
  )
}

function getSiteStatus(alerts: number): SiteStatus {
  if (alerts >= 2) return "danger"
  if (alerts === 1) return "warning"
  return "ok"
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object") {
    const supabaseError = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const parts = [
      typeof supabaseError.message === "string"
        ? supabaseError.message
        : null,
      typeof supabaseError.details === "string"
        ? supabaseError.details
        : null,
      typeof supabaseError.hint === "string"
        ? supabaseError.hint
        : null,
      typeof supabaseError.code === "string"
        ? `Code : ${supabaseError.code}`
        : null,
    ].filter(
      (value): value is string =>
        typeof value === "string" && value.length > 0
    )

    if (parts.length > 0) {
      return parts.join(" — ")
    }

    try {
      const serialized = JSON.stringify(error)

      if (serialized && serialized !== "{}") {
        return serialized
      }
    } catch {
      // L’objet ne peut pas être sérialisé.
    }
  }

  return "Erreur Supabase non identifiable."
}

export default function PlanningGrid({
  selectedDate = "",
}: PlanningGridProps) {
  const [planningRows, setPlanningRows] = useState<PlanningRow[]>([])
  const [siteRecords, setSiteRecords] = useState<SiteRecord[]>([])
  
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const loadPlanning = useCallback(
  async (dateOverride?: string) => {
    const dateToLoad = dateOverride || selectedDate

    if (!dateToLoad) {
      setPlanningRows([])
      setSiteRecords([])
      setErrorMessage("")
      setLoading(false)
      return
    }

    try {
      // Remise à zéro immédiate avant de charger la nouvelle journée
      setLoading(true)
      setErrorMessage("")
      setPlanningRows([])
      setSiteRecords([])

      const [planningData, sitesData] = await Promise.all([
        PlanningService.getDay(dateToLoad),
        SiteService.list(),
      ])

      setPlanningRows(
        Array.isArray(planningData)
          ? (planningData as PlanningRow[])
          : []
      )

      setSiteRecords(
        Array.isArray(sitesData)
          ? (sitesData as SiteRecord[]).filter(
              (site) =>
                site.id !== undefined &&
                Boolean(site.nom?.trim())
            )
          : []
      )
    } catch (error: unknown) {
      setPlanningRows([])
      setSiteRecords([])

      setErrorMessage(
        getErrorMessage(error) ||
          "Impossible de charger le planning."
      )
    } finally {
      setLoading(false)
    }
  },
  [selectedDate]
)

  useEffect(() => {
    let active = true

    async function initializePlanning() {
      try {
        setLoading(true)
        setErrorMessage("")

        const dateToLoad =
          selectedDate || undefined

        if (!active) return

        await loadPlanning(dateToLoad)
      } catch (error: unknown) {
        if (!active) return

        setErrorMessage(
          getErrorMessage(error) ||
            "Impossible de charger le planning depuis Supabase."
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void initializePlanning()

    return () => {
      active = false
    }
  }, [selectedDate])

  const sites = useMemo<SiteRow[]>(() => {
    return siteRecords.map((site) => {
      const rowsForSite = planningRows.filter(
        (row) =>
          String(row.site_id) === String(site.id)
      )

      const slotContent: Record<string, PlanningSlotItem[]> = {}

      planningSlots.forEach((slot) => {
        slotContent[slot.key] = []
      })

      rowsForSite.forEach((row) => {
        const slotKey = row.service || ""

        if (!slotContent[slotKey]) {
          return
        }

       if (isVacancy(row)) {
  slotContent[slotKey].push({
    id: row.id,
    name: "Agent absent",
    isVacancy: true,
    status: "absence",
  })

  return
}

const agentName = row.agent?.nom?.trim()

if (agentName) {
  slotContent[slotKey].push({
    id: row.id,
    name: agentName,
    isVacancy: false,
    status:
      normalize(row.statut) === "remplacé" ||
      normalize(row.statut) === "remplace"
        ? "replacement"
        : "present",
  })
}
      })

      const alerts =
        rowsForSite.filter(isVacancy).length

      return {
        id: site.id,
        name: site.nom,
        alerts,
        status: getSiteStatus(alerts),
        slots: slotContent,
      }
    })
  }, [planningRows, siteRecords])

  async function deleteVacancy(
  vacancyId: string | number
) {
  const confirmed = window.confirm(
    "Supprimer cette étiquette d’absence du planning ?"
  )

  if (!confirmed) return

  try {
    setErrorMessage("")

    await PlanningService.deleteAssignment(vacancyId)
    await loadPlanning(selectedDate)
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error) ||
        "Impossible de supprimer cette absence."
    )
  }
}

  async function moveAgent(
  assignmentId: string | number,
  agentName: string,
  fromSiteName: string,
  fromSlot: string,
  toSiteName: string,
  toSlot: string
) {
    if (moving) return

    if (
      agentName === "ABSENCE" ||
      agentName === "Agent absent"
    ) {
      return
    }

    if (
      fromSiteName === toSiteName &&
      fromSlot === toSlot
    ) {
      return
    }

    const sourceAssignment = planningRows.find(
  (row) =>
    String(row.id) === String(assignmentId) &&
    !isVacancy(row)
)

    const targetSite = siteRecords.find(
      (site) =>
        normalize(site.nom) === normalize(toSiteName)
    )

    if (!sourceAssignment) {
      setErrorMessage(
        "L’affectation source est introuvable dans le planning chargé."
      )
      return
    }

    if (!targetSite) {
      setErrorMessage(
        "Le site cible est introuvable."
      )
      return
    }

    const sourceSiteId =
      sourceAssignment.site_id ??
      sourceAssignment.site?.id

    if (
      sourceSiteId === null ||
      sourceSiteId === undefined
    ) {
      setErrorMessage(
        "Le site d’origine est introuvable."
      )
      return
    }

    const targetSlotConfig = planningSlots.find(
      (slot) => slot.key === toSlot
    )

    const sourceSlotConfig = planningSlots.find(
      (slot) => slot.key === fromSlot
    )

    const targetVacancy = planningRows.find(
      (row) =>
        isVacancy(row) &&
        String(row.site_id) === String(targetSite.id) &&
        row.service === toSlot
    )

    const currentDate =
      sourceAssignment.date ||
      selectedDate || getTodayIso()

    const previousRows = planningRows

    /*
     * Mise à jour immédiate de l’interface.
     */
    setPlanningRows((currentRows) => {
      const rowsWithoutTargetVacancy =
        targetVacancy
          ? currentRows.filter(
              (row) =>
                String(row.id) !==
                String(targetVacancy.id)
            )
          : currentRows

      const movedRows =
        rowsWithoutTargetVacancy.map((row) => {
          if (
            String(row.id) !==
            String(sourceAssignment.id)
          ) {
            return row
          }

          return {
            ...row,
            site_id: targetSite.id,
            site: {
              id: targetSite.id,
              nom: targetSite.nom,
              structure_id:
                targetSite.structure_id ?? null,
            },
            service: toSlot,
            heure_debut:
              targetSlotConfig?.start ?? null,
            heure_fin:
              targetSlotConfig?.end ?? null,
            statut: "Présent",
            est_poste_vacant: false,
          }
        })

      const sourceVacancyExists =
        movedRows.some(
          (row) =>
            String(row.site_id) ===
              String(sourceSiteId) &&
            row.service === fromSlot &&
            isVacancy(row)
        )

      if (sourceVacancyExists) {
        return movedRows
      }

      const temporaryVacancy: PlanningRow = {
        id: `temporary-vacancy-${sourceAssignment.id}`,
        date: currentDate,
        agent_id: null,
        site_id: sourceSiteId,
        service: fromSlot,
        heure_debut:
          sourceAssignment.heure_debut ??
          sourceSlotConfig?.start ??
          null,
        heure_fin:
          sourceAssignment.heure_fin ??
          sourceSlotConfig?.end ??
          null,
        statut: "Absent",
        commentaire:
          "Poste devenu vacant après déplacement",
        est_poste_vacant: true,
        agent: null,
        site: sourceAssignment.site ?? null,
      }

      return [...movedRows, temporaryVacancy]
    })

    setMoving(true)
    setErrorMessage("")

    /*
     * Ce bloc gère uniquement l’écriture Supabase.
     * Le retour arrière n’arrive que si l’UPDATE échoue.
     */
    try {
      await PlanningService.moveAssignmentWithVacancy({
        assignmentId: sourceAssignment.id,
        date: currentDate,

        sourceSiteId,
        sourceService: fromSlot,
        sourceStart:
          sourceAssignment.heure_debut ??
          sourceSlotConfig?.start ??
          null,
        sourceEnd:
          sourceAssignment.heure_fin ??
          sourceSlotConfig?.end ??
          null,

        targetSiteId: targetSite.id,
        targetService: toSlot,
        targetStart:
          targetSlotConfig?.start ?? null,
        targetEnd:
          targetSlotConfig?.end ?? null,

        targetVacancyId:
          targetVacancy?.id ?? null,
      })
    } catch (error: unknown) {
      const message = getErrorMessage(error)

      setPlanningRows(previousRows)

      setErrorMessage(
        message ||
          "Le déplacement n’a pas pu être enregistré dans Supabase."
      )

      setMoving(false)
      return
    }

    /*
     * Le déplacement est enregistré.
     * Une erreur de rechargement ne doit jamais remettre
     * l’étiquette à son ancienne position.
     */
    try {
      await loadPlanning(currentDate)
    } catch (error: unknown) {
      setErrorMessage(
        `Le déplacement est enregistré, mais le planning n’a pas pu être rechargé : ${getErrorMessage(
          error
        )}`
      )
    } finally {
      setMoving(false)
    }
  }

  const gridTemplateColumns =
  `220px repeat(${planningSlots.length}, minmax(220px, 1fr)) 100px`

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-[#0f172a] p-8 text-slate-400">
        Chargement du planning…
      </section>
    )
  }

  async function duplicateAssignment(
  assignmentId: string | number
) {
  const source = planningRows.find(
    (row) => String(row.id) === String(assignmentId)
  )

  if (!source) {
    setErrorMessage("Affectation introuvable.")
    return
  }


if (source.agent_id === null) {
  setErrorMessage(
    "Un poste vacant ne peut pas être dupliqué comme une affectation agent."
  )
  return
}
  try {
    setErrorMessage("")

    await PlanningService.createAssignment({
      date: selectedDate,
      agent_id: source.agent_id,
      site_id: source.site_id,
      service: source.service,
      heure_debut: source.heure_debut,
      heure_fin: source.heure_fin,
      statut: source.statut || "Présent",
      commentaire: source.commentaire || "",
    })

    await loadPlanning(selectedDate)
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error) ||
        "Impossible de dupliquer cette affectation."
    )
  }
}

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-[#111827] px-6 py-5">
        <div>
          <h2 className="text-xl font-bold text-yellow-300">
            Planning opérationnel
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Planning du{" "}
            {selectedDate || "jour sélectionné"}—
            déplacements enregistrés dans Supabase.
          </p>
        </div>

        {moving && (
          <span className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
            Enregistrement…
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {sites.length === 0 ? (
        <div className="p-8 text-slate-400">
          Aucun site disponible pour le{" "}
          {selectedDate || "jour sélectionné"}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1500px]">
            <div
              className="grid border-b border-slate-800 bg-[#020817] text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              style={{ gridTemplateColumns }}
            >
              <div className="p-4">Site</div>

              {planningSlots.map((slot) => (
                <div
                  key={slot.key}
                  className="border-l border-slate-800 p-4"
                >
                  <div className="text-slate-300">
                    {slot.shortLabel}
                  </div>

                  <div className="mt-1 text-[11px] normal-case tracking-normal text-slate-500">
                    {slot.time}
                  </div>
                </div>
              ))}

              <div className="border-l border-slate-800 p-4 text-center">
                Manquants
              </div>
            </div>

           {sites.map((site) => (
  <PlanningSiteRow
    key={site.id}
    site={site}
    slots={planningSlots}
    gridTemplateColumns={gridTemplateColumns}
    selectedDate={selectedDate}
    onAssignmentCreated={() =>
      loadPlanning(selectedDate)
    }
    onDeleteVacancy={deleteVacancy}
    onDuplicateAssignment={duplicateAssignment}
    onMoveAgent={moveAgent}
  />
))}
          </div>
        </div>
      )}
    </section>
  )
}