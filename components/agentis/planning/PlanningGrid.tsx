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
import AddAssignmentDialog from "../dialogs/AddAssignmentDialog"
import PlanningEngine from "@/lib/planning/PlanningEngine"
import PlanningRequirementsService, {
  type PlanningRequirementRow,
} from "@/lib/services/PlanningRequirementsService"

type SiteStatus = "ok" | "warning" | "danger"

type PlanningGridProps = {
  selectedDate?: string
  selectedSite?: string
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
  expected: number
  assigned: number
  coverage: number
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
  selectedSite = "",
}: PlanningGridProps) {
  const [planningRows, setPlanningRows] = useState<PlanningRow[]>([])
  const [siteRecords, setSiteRecords] = useState<SiteRecord[]>([])
  const [requirementRows, setRequirementRows] =
    useState<PlanningRequirementRow[]>([])
  
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

const [editSource, setEditSource] =
  useState<PlanningRow | null>(null)

 const [
  duplicateSource,
  setDuplicateSource,
] = useState<PlanningRow | null>(null)


  const loadPlanning = useCallback(
  async (dateOverride?: string) => {
    const dateToLoad = dateOverride || selectedDate

    if (!dateToLoad) {
      setPlanningRows([])
      setSiteRecords([])
      setRequirementRows([])
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

      const [
        planningData,
        sitesData,
        requirementsData,
      ] = await Promise.all([
        PlanningService.getDay(dateToLoad),
        SiteService.list(),
        PlanningRequirementsService.list(),
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

      setRequirementRows(
        Array.isArray(requirementsData)
          ? requirementsData
          : []
      )
    } catch (error: unknown) {
      setPlanningRows([])
      setSiteRecords([])
      setRequirementRows([])

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

  const requirementsBySite = useMemo(
    () =>
      PlanningRequirementsService.buildBySite(
        requirementRows
      ),
    [requirementRows]
  )

  const sites = useMemo<SiteRow[]>(() => {
    const visibleSiteRecords = selectedSite
      ? siteRecords.filter(
          (site) =>
            normalize(site.nom) === normalize(selectedSite)
        )
      : siteRecords

    return visibleSiteRecords.map((site) => {
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

      const siteRequirements =
        requirementsBySite[String(site.id)] || {}

      const slotCoverages = planningSlots.map((slot) => {
        const slotRows = rowsForSite.filter(
          (row) => row.service === slot.key
        )

        const assigned = slotRows.filter(
          (row) => !isVacancy(row)
        ).length

        const expected =
          siteRequirements[slot.key] ?? 0

        return PlanningEngine.computeCoverageFromCounts(
          expected,
          assigned
        )
      })

      const alerts = slotCoverages.reduce(
        (total, coverage) =>
          total + coverage.missing,
        0
      )

      const totalExpected = slotCoverages.reduce(
        (total, coverage) =>
          total + coverage.expected,
        0
      )

      const totalAssigned = slotCoverages.reduce(
        (total, coverage) =>
          total + coverage.assigned,
        0
      )

      const coveredAssignments = slotCoverages.reduce(
        (total, coverage) =>
          total +
          Math.min(
            coverage.assigned,
            coverage.expected
          ),
        0
      )

      const siteCoverage =
        PlanningEngine.computeCoverageFromCounts(
          totalExpected,
          coveredAssignments
        )

      return {
        id: site.id,
        name: site.nom,
        alerts,
        expected: totalExpected,
        assigned: totalAssigned,
        coverage: siteCoverage.coverage,
        status: siteCoverage.status,
        slots: slotContent,
      }
    })
  }, [
    planningRows,
    requirementsBySite,
    selectedSite,
    siteRecords,
  ])

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
    `190px repeat(${planningSlots.length}, minmax(185px, 1fr)) 130px`

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
        Chargement du planning…
      </section>
    )
  }

 function duplicateAssignment(
  assignmentId: string | number
) {
  const source = planningRows.find(
    (row) =>
      String(row.id) === String(assignmentId)
  )

  if (!source) {
    setErrorMessage("Affectation introuvable.")
    return
  }

  if (source.agent_id === null || isVacancy(source)) {
    setErrorMessage(
      "Un poste vacant ne peut pas être dupliqué comme une affectation agent."
    )
    return
  }

  setErrorMessage("")
  setDuplicateSource(source)
}

function editAssignment(
  assignmentId: string | number
) {
  const source = planningRows.find(
    (row) => String(row.id) === String(assignmentId)
  )

  if (!source) {
    setErrorMessage("Affectation introuvable.")
    return
  }

  if (source.agent_id === null || isVacancy(source)) {
    setErrorMessage(
      "Un poste vacant ne peut pas être modifié comme une affectation agent."
    )
    return
  }

  setErrorMessage("")
  setEditSource(source)
}
 
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <h2 className="text-xl font-bold text-amber-600">
            Planning opérationnel
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Planning du{" "}
            {selectedDate || "jour sélectionné"}
            {selectedSite ? ` · ${selectedSite}` : ""} —
            déplacements enregistrés dans Supabase.
          </p>
        </div>

        {moving && (
          <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Enregistrement…
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {sites.length === 0 ? (
        <div className="p-8 text-slate-600">
          {selectedSite
            ? `Le site « ${selectedSite} » est introuvable pour le ${
                selectedDate || "jour sélectionné"
              }.`
            : `Aucun site disponible pour le ${
                selectedDate || "jour sélectionné"
              }.`}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
            <div className="text-sm text-slate-600">
              {sites.length} site(s) affiché(s) · {planningSlots.length} créneau(x)
            </div>

            <div className="text-xs font-medium text-slate-500">
              Glissez une affectation vers un autre créneau pour la déplacer.
            </div>
          </div>

          <div className="overflow-x-auto">
          <div className="min-w-[1380px]">
            <div
              className="sticky top-0 z-20 grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              style={{ gridTemplateColumns }}
            >
              <div className="p-4">Site</div>

              {planningSlots.map((slot) => (
                <div
                  key={slot.key}
                  className="border-l border-slate-200 p-4"
                >
                  <div className="text-slate-800">
                    {slot.shortLabel}
                  </div>

                  <div className="mt-1 text-[11px] normal-case tracking-normal text-slate-500">
                    {slot.time}
                  </div>
                </div>
              ))}

              <div className="border-l border-slate-200 p-4 text-center">
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
  onEditAssignment={editAssignment}
  onMoveAssignment={editAssignment}
  onDeleteVacancy={deleteVacancy}
  onDuplicateAssignment={duplicateAssignment}
  onMoveAgent={moveAgent}
/>
))}
          </div>
        </div>
        </>
      )}

<AddAssignmentDialog
  open={editSource !== null}
  mode="edit"
  selectedDate={selectedDate}
  initialValues={
    editSource && editSource.agent_id !== null
      ? {
          assignmentId: editSource.id,
          agentId: editSource.agent_id,
          siteId: editSource.site_id,
          date: editSource.date || selectedDate,
          slot: editSource.service as
            | (typeof planningSlots)[number]["key"]
            | null,
          status: editSource.statut || "Présent",
          start: editSource.heure_debut,
          end: editSource.heure_fin,
          commentaire: editSource.commentaire || "",
        }
      : null
  }
  onClose={() => {
    setEditSource(null)
  }}
  onAssignmentCreated={async () => {
    setEditSource(null)
    await loadPlanning(selectedDate)
  }}
/>
    </section>
  )
}