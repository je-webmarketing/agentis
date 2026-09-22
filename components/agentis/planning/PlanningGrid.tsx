"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import PlanningSiteRow from "./PlanningSiteRow"
import PlanningMobileView from "./PlanningMobileView"
import { planningSlots } from "@/lib/planning/slots"
import { PlanningService } from "@/lib/services/PlanningService"
import { SiteService } from "@/lib/services/SiteService"
import { AgentService } from "@/lib/services/AgentService"
import type { PlanningSlotItem } from "./PlanningSlot"
import AddAssignmentDialog from "../dialogs/AddAssignmentDialog"
import PlanningEngine from "@/lib/planning/PlanningEngine"
import PlanningRequirementsService, {
  type PlanningRequirementRow,
} from "@/lib/services/PlanningRequirementsService"
import { useRouter } from "next/navigation"
import {
  mapPosteToRequirementRole,
} from "@/lib/planning/roleMapping"
import { supabase } from "@/lib/supabase"
import {
  PlanningColumnsService,
  type PlanningColumn,
} from "@/lib/services/PlanningColumnsService"

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
service_id?: string | number | null
heure_debut: string | null
  heure_fin: string | null
  statut: string | null
  commentaire?: string | null
  est_poste_vacant?: boolean | null
  agent?: {
  id: string | number
  nom: string | null
  poste_id: string | number | null

  poste?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null
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

  slots: Record<
    string,
    PlanningSlotItem[]
  >

  requirementsBySlot: Record<
    string,
    Record<string, number>
  >
  periscolaireAgents: PlanningSlotItem[]
  periscolaireRequired: number

  serviceAgents: Record<
  string,
  PlanningSlotItem[]
>
}

type SiteRecord = {
  id: string | number
  nom: string
  structure_id?: string | number | null
}

type PlanningCandidate = {
  id: string | number
  nom: string | null
  service_id?: string | number | null
  site_id?: string | number | null
  structure_id?: string | number | null
  est_polyvalent?: boolean | null
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
  const router = useRouter()
  const [planningRows, setPlanningRows] = useState<PlanningRow[]>([])
  const [siteRecords, setSiteRecords] = useState<SiteRecord[]>([])
  const [planningCandidates, setPlanningCandidates] =
  useState<PlanningCandidate[]>([])
  const [requirementRows, setRequirementRows] =
    useState<PlanningRequirementRow[]>([])
  
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

const [editSource, setEditSource] =
  useState<PlanningRow | null>(null)

const [
  mobileCreateSource,
  setMobileCreateSource,
] = useState<{
  siteId: string | number
  slotKey: string
} | null>(null)

 const [
  duplicateSource,
  setDuplicateSource,
] = useState<PlanningRow | null>(null)

const [
  periscolaireSite,
  setPeriscolaireSite,
] = useState<{
  id: string | number
  name: string
  required: number
  serviceId: string | number | null
  serviceLabel: string
  replaceAssignmentId?: string | number | null
} | null>(null)

const [planningColumns, setPlanningColumns] =
  useState<PlanningColumn[]>([])

const [planningStructureId, setPlanningStructureId] =
  useState<string | number | null>(null)

      const getPlanningColumnLabel = (
  columnKey: string,
  fallback: string
) => {
  return (
    planningColumns.find(
      (column) =>
        column.column_key === columnKey
    )?.label ?? fallback
  )
}

const getPlanningColumnTime = (
  columnKey: string,
  fallback: string
) => {
  const column = planningColumns.find(
    (item) => item.column_key === columnKey
  )

  if (!column?.start_time || !column?.end_time) {
    return fallback
  }

  const formatTime = (value: string) =>
    value.slice(0, 5).replace(":", "h")

  return `${formatTime(column.start_time)} - ${formatTime(
    column.end_time
  )}`
}

const visiblePlanningColumns =
  planningColumns.filter(
    (column) => column.visible
  )

const visiblePlanningSlots =
  visiblePlanningColumns
    .filter(
      (column) =>
        column.column_type === "slot"
    )
    .map((column) =>
      planningSlots.find(
        (slot) =>
          slot.key === column.column_key
      )
    )
    .filter(
      (
        slot
      ): slot is (typeof planningSlots)[number] =>
        Boolean(slot)
    )

const configuredPlanningSlots =
  visiblePlanningSlots.map((slot) => {
    const column = planningColumns.find(
      (item) =>
        item.column_key === slot.key
    )

    return {
      ...slot,
      start:
        column?.start_time?.slice(0, 5) ??
        slot.start,
      end:
        column?.end_time?.slice(0, 5) ??
        slot.end,
      time:
        column?.start_time &&
        column?.end_time
          ? `${column.start_time
              .slice(0, 5)
              .replace(":", "h")} - ${column.end_time
              .slice(0, 5)
              .replace(":", "h")}`
          : slot.time,
    }
  })

const visibleServiceColumns =
  visiblePlanningColumns.filter(
    (column) =>
      column.column_type === "service" &&
      column.service_id !== null
  )

const periscolaireColumn =
  visibleServiceColumns.find(
    (column) =>
      String(column.service_id) === "5"
  )

const isPeriscolaireVisible =
  Boolean(periscolaireColumn)

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

     const {
  data: { user },
} = await supabase.auth.getUser()

console.log(
  "UTILISATEUR PLANNING:",
  user?.id,
  user?.email
) 

      const [
  planningData,
  sitesData,
  requirementsData,
  candidatesData,
] = await Promise.all([
  PlanningService.getDay(dateToLoad),
  SiteService.list(),
  PlanningRequirementsService.list(),
  AgentService.listPlanningCandidates(),
])

console.log(
  "CANDIDATS PLANNING:",
  candidatesData
)

console.log(
  "TEST MARTIN DUPONT:",
  Array.isArray(candidatesData)
    ? candidatesData.filter(
        (candidate) =>
          candidate.nom
            ?.toLowerCase()
            .includes("martin dupont")
      )
    : []
)

console.log(
  "TEST FILTRE SERVICE:",
  {
    planningStructureId,
    modalServiceId: periscolaireSite?.serviceId ?? null,
  }
)

console.log(
  "TEST AFFECTATION JARRY:",
  Array.isArray(candidatesData)
    ? candidatesData.filter(
        (candidate) =>
          Number(candidate.site_id) === 8 &&
          Number(candidate.service_id) === 6
      )
    : []
)

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

      setPlanningCandidates(
  Array.isArray(candidatesData)
    ? (candidatesData as PlanningCandidate[])
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

const refreshAfterMutation = useCallback(
  async (dateOverride?: string) => {
    const dateToRefresh =
      dateOverride || selectedDate

    await loadPlanning(
      dateToRefresh
    )

    /*
     * Recharge les Server Components de page.tsx.
     * Les cartes Total / Présents / Absents /
     * Remplacés sont alors recalculées depuis Supabase.
     */
    router.refresh()
  },
  [
    loadPlanning,
    router,
    selectedDate,
  ]
)

  useEffect(() => {
    let active = true

    async function initializePlanning() {
      try {
        setLoading(true)
        setErrorMessage("")

        const availableSites =
  await SiteService.list()

const selectedSiteRecord =
  selectedSite
    ? availableSites.find(
        (site) =>
          normalize(site.nom) ===
          normalize(selectedSite)
      )
    : null

const structureId =
  selectedSiteRecord?.structure_id ?? 1

setPlanningStructureId(structureId)

const columnsData =
  await PlanningColumnsService.listByStructure(
    structureId
  )

setPlanningColumns(columnsData)

console.log(
  "COLONNES PLANNING CONFIGURABLES:",
  columnsData
)

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

     const serviceAgents =
  visibleServiceColumns.reduce<
    Record<string, PlanningSlotItem[]>
  >((result, column) => {
    const serviceId = String(
      column.service_id
    )

    result[serviceId] = rowsForSite
      .filter(
        (row) =>
          String(row.service_id) ===
            serviceId &&
          !isVacancy(row) &&
          Boolean(row.agent?.nom?.trim())
      )
      .reduce<PlanningSlotItem[]>(
        (agents, row) => {
          const agentName =
            row.agent?.nom?.trim()

          if (!agentName) {
            return agents
          }

          const alreadyExists =
            agents.some(
              (agent) =>
                agent.name === agentName
            )

          if (!alreadyExists) {
            agents.push({
              id: row.id,
              name: agentName,
              isVacancy: false,
              status: "present",
            })
          }

          return agents
        },
        []
      )

    return result
  }, {}) 

      const periscolaireAgents =
  rowsForSite
    .filter(
      (row) =>
        String(row.service_id) === "5" &&
        !isVacancy(row) &&
        Boolean(row.agent?.nom?.trim())
    )
    .reduce<PlanningSlotItem[]>(
      (result, row) => {
        const agentName = row.agent?.nom?.trim()

        if (!agentName) {
          return result
        }

        const alreadyExists = result.some(
          (item) => item.name === agentName
        )

        if (alreadyExists) {
          return result
        }

        result.push({
  id: row.id,
  name: agentName,
  isVacancy: false,
  status: "present",
})

        return result
      },
      []
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
  const agentPoste =
  Array.isArray(row.agent?.poste)
    ? row.agent?.poste[0]
    : row.agent?.poste

slotContent[slotKey].push({
  id: row.id,
  name: agentName,
  isVacancy: false,
  status:
    normalize(row.statut) === "remplacé" ||
    normalize(row.statut) === "remplace"
      ? "replacement"
      : "present",

  posteId:
    row.agent?.poste_id ?? null,

  posteName:
    agentPoste?.nom ?? null,
})
}
      })

      const siteRequirements =
        requirementsBySite[String(site.id)] || {}

      const slotCoverages = planningSlots.map((slot) => {
  const slotRows = rowsForSite.filter(
    (row) => row.service === slot.key
  )

  const activeRows = slotRows.filter(
    (row) => !isVacancy(row)
  )

  const assignedByRole =
  activeRows.reduce<Record<string, number>>(
    (result, row) => {
      const poste =
        Array.isArray(row.agent?.poste)
          ? row.agent?.poste[0]
          : row.agent?.poste

      const roleKey =
        mapPosteToRequirementRole(
          poste?.nom
        )

      if (!roleKey) {
        return result
      }

      result[roleKey] =
        (result[roleKey] || 0) + 1

      return result
    },
    {}
  )

  const rawExpected =
    siteRequirements[slot.key] ?? 0

  const requirementsByRole =
    typeof rawExpected === "number"
      ? {}
      : rawExpected || {}

  const expectedTotal =
    typeof rawExpected === "number"
      ? rawExpected
      : Object.values(
          requirementsByRole
        ).reduce(
          (total, value) =>
            total + (Number(value) || 0),
          0
        )

  let coveredByRole = 0

for (const [
  roleKey,
  requiredValue,
] of Object.entries(
  requirementsByRole
)) {
  const required =
    Number(requiredValue) || 0

  const assigned =
    assignedByRole[roleKey] || 0

  /*
   * "Non précisé" reste générique :
   * n'importe quel agent actif peut couvrir ce besoin.
   */
  if (roleKey === "non_precise") {
    coveredByRole += Math.min(
      required,
      activeRows.length
    )

    continue
  }

  coveredByRole += Math.min(
    required,
    assigned
  )
}

  
  for (const [
    roleKey,
    requiredValue,
  ] of Object.entries(
    requirementsByRole
  )) {
    const required =
      Number(requiredValue) || 0

    const assigned =
      assignedByRole[roleKey] || 0

    coveredByRole += Math.min(
      required,
      assigned
    )
  }

  /*
   * Cas ancien / non typé :
   * si aucun rôle précis n'est défini,
   * on conserve le calcul global actuel.
   */
  const hasTypedRequirements =
    Object.keys(
      requirementsByRole
    ).some(
      (roleKey) =>
        roleKey !==
          "non_precise" &&
        Number(
          requirementsByRole[
            roleKey as keyof typeof requirementsByRole
          ]
        ) > 0
    )

  const assignedForCoverage =
    hasTypedRequirements
      ? coveredByRole
      : activeRows.length

  const coverage =
  PlanningEngine.computeCoverageFromCounts(
    expectedTotal,
    coveredByRole
  )

  return {
    ...coverage,
    slotKey: slot.key,
    requirementsByRole,
    assignedReal:
      activeRows.length,
  }
})

const requirementsBySlot =
  slotCoverages.reduce<
    Record<
      string,
      Record<string, number>
    >
  >(
    (
      result,
      coverage
    ) => {
      result[
        coverage.slotKey
      ] = Object.entries(
        coverage.requirementsByRole
      ).reduce<
        Record<
          string,
          number
        >
      >(
        (
          roles,
          [roleKey, value]
        ) => {
          const quantity =
            Number(value) || 0

          if (
            quantity > 0
          ) {
            roles[
              roleKey
            ] = quantity
          }

          return roles
        },
        {}
      )

      return result
    },
    {}
  )

  const periscolaireRequired =
  requirementRows
    .filter(
      (requirement) =>
        String(requirement.site_id) === String(site.id) &&
        requirement.slot_key === "periscolaire"
    )
    .reduce(
      (total, requirement) =>
        total + Number(requirement.required_agents || 0),
      0
    )

    const periscolaireAssigned =
  periscolaireAgents.length

const periscolaireMissing = Math.max(
  0,
  periscolaireRequired -
    periscolaireAssigned
)

      const alerts =
  slotCoverages.reduce(
    (total, coverage) =>
      total + coverage.missing,
    0
  ) + periscolaireMissing

const totalExpected =
  slotCoverages.reduce(
    (total, coverage) =>
      total + coverage.expected,
    0
  ) + periscolaireRequired

const totalAssigned =
  slotCoverages.reduce(
    (total, coverage) =>
      total + coverage.assignedReal,
    0
  ) + periscolaireAssigned

const coveredAssignments =
  slotCoverages.reduce(
    (total, coverage) =>
      total +
      Math.min(
        coverage.assigned,
        coverage.expected
      ),
    0
  ) +
  Math.min(
    periscolaireAssigned,
    periscolaireRequired
  )

      const siteCoverage =
        PlanningEngine.computeCoverageFromCounts(
          totalExpected,
          coveredAssignments
        )

      

      return {
  id:
    site.id,

  name:
    site.nom,

  alerts,

  expected:
    totalExpected,

  assigned:
    totalAssigned,

  coverage:
    siteCoverage.coverage,

  status:
    siteCoverage.status,

  slots:
    slotContent,

  requirementsBySlot,
  periscolaireAgents,
  periscolaireRequired,
  serviceAgents,
}
    })
  }, [
  planningRows,
  requirementRows,
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

    await PlanningService.deleteAssignment(
  vacancyId
)

await refreshAfterMutation(
  selectedDate
)
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

    const targetSlotConfig = configuredPlanningSlots.find(
  (slot) => slot.key === toSlot
)

const sourceSlotConfig = configuredPlanningSlots.find(
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
  await refreshAfterMutation(
    currentDate
  )
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

  async function savePeriscolaireRequirement() {
  if (!periscolaireSite) return

  try {
    setErrorMessage("")

    const { error } = await supabase
      .from("planning_requirements")
      .upsert(
        {
          site_id: periscolaireSite.id,
          slot_key: "periscolaire",
          role_key: "non_precise",
          required_agents:
            periscolaireSite.required,
        },
        {
          onConflict:
            "site_id,slot_key,role_key",
        }
      )

    if (error) {
      throw error
    }

    await refreshAfterMutation(
      selectedDate
    )

    setPeriscolaireSite(null)
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error) ||
        "Impossible d’enregistrer le besoin périscolaire."
    )
  }
}

 async function addPeriscolaireAgent(
  agentId: string | number
) {
  if (!periscolaireSite) return

  try {
    setErrorMessage("")

    if (periscolaireSite.replaceAssignmentId) {
      const { error } = await supabase
        .from("planning_journalier")
        .update({
          agent_id: agentId,
          service: null,
          service_id: periscolaireSite.serviceId,
          statut: "Présent",
          est_poste_vacant: false,
        })
        .eq(
          "id",
          periscolaireSite.replaceAssignmentId
        )

      if (error) {
        throw error
      }
    } else {
      await PlanningService.createPeriscolaireAssignment({
  date: selectedDate,
  agentId,
  siteId: periscolaireSite.id,
  serviceId: periscolaireSite.serviceId!,
})
    }

    setPeriscolaireSite(null)

    await refreshAfterMutation(
      selectedDate
    )
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error) ||
        "Impossible d’enregistrer cet agent périscolaire."
    )
  }
}

const gridTemplateColumns = [
  "170px",
  ...visiblePlanningSlots.map((slot) => {
    const column = visiblePlanningColumns.find(
      (item) => item.column_key === slot.key
    )

    return `${column?.width_px ?? 160}px`
  }),
  ...visibleServiceColumns.map(
    (column) => `${column.width_px ?? 160}px`
  ),
  "100px",
].join(" ")

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

async function deletePeriscolaireAssignment(
  assignmentId: string | number
) {
  const confirmed = window.confirm(
    "Retirer cet agent du périscolaire ?"
  )

  if (!confirmed) return

  try {
    setErrorMessage("")

    await PlanningService.deleteAssignment(
      assignmentId
    )

    await refreshAfterMutation(
      selectedDate
    )
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error) ||
        "Impossible de retirer cet agent du périscolaire."
    )
  }
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
              {sites.length} site(s) affiché(s) · {visiblePlanningSlots.length} créneau(x)
            </div>

            <div className="text-xs font-medium text-slate-500">
              Glissez une affectation vers un autre créneau pour la déplacer.
            </div>
          </div>
         <PlanningMobileView
  sites={sites}
  slots={configuredPlanningSlots}
  onAddAssignment={(siteId, slotKey) => {
    setMobileCreateSource({
      siteId,
      slotKey,
    })
  }}
/>

          <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[1380px]">
            <div
              className="sticky top-0 z-20 grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              style={{ gridTemplateColumns }}
            >
              <div className="p-4">Site</div>

              {visiblePlanningSlots.map((slot) => (
                <div
                  key={slot.key}
                  className="border-l border-slate-200 p-4"
                >
                 <div className="text-slate-800">
  {getPlanningColumnLabel(
    slot.key,
    slot.shortLabel
  )}
</div> <div className="text-slate-800">
                    {slot.shortLabel}
                  </div>

                  <div className="mt-1 text-[11px] normal-case tracking-normal text-slate-500">
                    {getPlanningColumnTime(
  slot.key,
  slot.time
)}
                  </div>
                </div>
              ))}

             {visibleServiceColumns.map((column) => (
  <div
    key={String(column.id)}
    className="border-l border-slate-200 p-4"
  >
    <div className="text-slate-800">
      {column.label}
    </div>

    <div className="mt-1 text-[11px] normal-case tracking-normal text-slate-500">
      Agents du service
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
  slots={configuredPlanningSlots}
  gridTemplateColumns={gridTemplateColumns}
  selectedDate={selectedDate}
  showPeriscolaire={isPeriscolaireVisible}
    serviceColumns={visibleServiceColumns.map(
    (column) => ({
      id: column.id,
      columnKey: column.column_key,
      label: column.label,
      serviceId: column.service_id!,
    })
  )}
  onAssignmentCreated={() =>
    refreshAfterMutation(
      selectedDate
    )
  }
    onEditAssignment={editAssignment}
    onMoveAssignment={editAssignment}
    onDeleteVacancy={deleteVacancy}
    onDuplicateAssignment={duplicateAssignment}
    onMoveAgent={moveAgent}
 onDeletePeriscolaireAssignment={deletePeriscolaireAssignment}   
 onAddPeriscolaireAgent={(
  siteId,
  siteName,
  serviceId,
  replaceAssignmentId
) => {
  console.log(
    "OUVERTURE SERVICE:",
    {
      siteId,
      siteName,
      serviceId,
      planningStructureId,
    }
  )

  const currentSite = sites.find(
    (site) =>
      String(site.id) === String(siteId)
  )

  const selectedServiceColumn =
    visibleServiceColumns.find(
      (column) =>
        String(column.service_id) ===
        String(serviceId)
    )

  setPeriscolaireSite({
    id: siteId,
    name: siteName,
    required:
      currentSite?.periscolaireRequired || 0,
    serviceId:
      serviceId ?? null,
    serviceLabel:
      selectedServiceColumn?.label ?? "Service",
    replaceAssignmentId:
      replaceAssignmentId ?? null,
  })
}}
  />
))}
          </div>
        </div>
        </>
      )}

<AddAssignmentDialog
  open={mobileCreateSource !== null}
  mode="create"
  selectedDate={selectedDate}
  configuredSlots={configuredPlanningSlots}
  initialValues={
    mobileCreateSource
      ? {
          siteId: mobileCreateSource.siteId,
          date: selectedDate,
          slot: mobileCreateSource.slotKey as
            (typeof planningSlots)[number]["key"],
        }
      : null
  }
  onClose={() => {
    setMobileCreateSource(null)
  }}
  onAssignmentCreated={async () => {
    setMobileCreateSource(null)

    await refreshAfterMutation(
      selectedDate
    )
  }}
/>

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

  await refreshAfterMutation(
    selectedDate
  )
}}
/>
{periscolaireSite && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
  {periscolaireSite.serviceLabel}
</p>

<h3 className="mt-1 text-xl font-bold text-slate-900">
  Configurer {periscolaireSite.serviceLabel}
</h3>

          <p className="mt-1 text-sm text-slate-500">
            Site : {periscolaireSite.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setPeriscolaireSite(null)
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500"
        >
          Fermer
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Besoin en agents
          </span>

          <input
            type="number"
            min="0"
            value={periscolaireSite.required}
            onChange={(event) =>
              setPeriscolaireSite(
                (current) =>
                  current
                    ? {
                        ...current,
                        required: Math.max(
                          0,
                          Number(
                            event.target.value
                          ) || 0
                        ),
                      }
                    : current
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:border-amber-400"
          />
        </label>

        <button
          type="button"
          onClick={() =>
            void savePeriscolaireRequirement()
          }
          className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950"
        >
          Enregistrer le besoin
        </button>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-slate-700">
          Agents disponibles
        </p>

        <div className="space-y-2">
          {planningCandidates.filter(
           (candidate) =>
  String(candidate.structure_id) ===
    String(planningStructureId) &&
  (
    String(candidate.service_id) ===
      String(periscolaireSite.serviceId) ||
    candidate.est_polyvalent === true
  )
          ).length > 0 ? (
           planningCandidates
  .filter(
    (candidate) =>
      candidate.est_polyvalent === true ||
      (
        String(candidate.structure_id) ===
          String(planningStructureId) &&
        String(candidate.site_id) ===
          String(periscolaireSite.id) &&
        String(candidate.service_id) ===
          String(periscolaireSite.serviceId)
      )
  )
  .map((candidate) => (
                <button
                  key={String(candidate.id)}
                  type="button"
                  onClick={() =>
                    void addPeriscolaireAgent(
                      candidate.id
                    )
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="font-semibold text-slate-800">
                    {candidate.nom ||
                      "Agent sans nom"}
                  </span>

                  <span className="text-xs font-semibold text-amber-600">
                    {candidate.est_polyvalent
  ? "Polyvalent"
  : periscolaireSite.serviceLabel}
                  </span>
                </button>
              ))
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Aucun agent disponible.
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </section>
  )
}