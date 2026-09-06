import { supabase } from "@/lib/supabase"
import { agentisCore } from "@/lib/core"
import {
  mapPosteToRequirementRole,
} from "@/lib/planning/roleMapping"

import type {
  PlanningRequirementRoleKey,
} from "@/lib/services/PlanningRequirementsService"

export type ReplacementCandidate = {
  agentId: number
  agentName: string
  score: number
  available: boolean
  reasons: string[]
  warnings: string[]
  sameSite: boolean
  sameService: boolean
  samePoste: boolean
  hasValidMedicalVisit: boolean
  activeContract: boolean
  planningConflict: boolean
  absenceConflict: boolean
}

export type ReplacementContext = {
  vacancyId: string | number
  date: string
  siteId: string | number
  service: string | null
  serviceId: string | number | null
  start: string | null
  end: string | null
}

type VacancyRow = {
  id: string | number
  date: string
  agent_id: string | number | null
  site_id: string | number
  service: string | null
  service_id?: string | number | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
  est_poste_vacant?: boolean | null
}

type AgentRow = {
  id: number
  nom: string | null
  statut: string | null
  poste_id: number | null
  service_id: number | null
  site_id: number | null
  est_polyvalent: boolean | null

  poste?:
    | {
        id: number
        nom: string | null
      }
    | {
        id: number
        nom: string | null
      }[]
    | null
}

type PlanningRow = {
  id: string | number
  agent_id: string | number | null
  date: string
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
}

type AbsenceRow = {
  agent_id: string | number
  date_debut: string | null
  date_fin: string | null
  statut_validation: string | null
}

type MedicalVisitRow = {
  agent_id: string | number
  prochaine_visite: string | null
  aptitude: string | null
}

type ContractRow = Record<string, unknown> & {
  agent_id?: string | number | null
}

type QualificationRow = {
  agent_id: string | number
}

type CandidateData = {
  agents: AgentRow[]
  planning: PlanningRow[]
  absences: AbsenceRow[]
  medicalVisits: MedicalVisitRow[]
  contracts: ContractRow[]
  formations: QualificationRow[]
  habilitations: QualificationRow[]
  competences: QualificationRow[]
}

export const ReplacementEngine = {
  async getCandidates(
  vacancyId: string | number,
  requiredRole?: PlanningRequirementRoleKey | null
): Promise<ReplacementCandidate[]> {
    const vacancy = await loadVacancy(vacancyId)

    if (!vacancy.est_poste_vacant && vacancy.agent_id !== null) {
      throw new Error(
        "Cette affectation n’est pas identifiée comme un poste vacant."
      )
    }

    const context: ReplacementContext = {
      vacancyId: vacancy.id,
      date: vacancy.date,
      siteId: vacancy.site_id,
      service: vacancy.service,
      serviceId: vacancy.service_id ?? null,
      start: vacancy.heure_debut,
      end: vacancy.heure_fin,
    }

    const data = await loadCandidateData(context)

    return data.agents
      .map((agent) =>
        buildCandidate(
  agent,
  context,
  data,
  requiredRole
)
      )
      .filter((candidate) => candidate.available)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }

        return a.agentName.localeCompare(
          b.agentName,
          "fr"
        )
      })
  },

 async getBestCandidates(
  vacancyId: string | number,
  limit = 5,
  requiredRole?: PlanningRequirementRoleKey | null
): Promise<ReplacementCandidate[]> {
  const candidates = await this.getCandidates(
    vacancyId,
    requiredRole
  )

  return candidates.slice(
    0,
    Math.max(1, limit)
  )
},

async assignCandidate(params: {
    vacancyId: string | number
    agentId: string | number
    commentaire?: string | null
  }) {
    const vacancy = await loadVacancy(
      params.vacancyId
    )

    const candidates = await this.getCandidates(
      params.vacancyId
    )

    const selectedCandidate = candidates.find(
      (candidate) =>
        String(candidate.agentId) ===
        String(params.agentId)
    )

    if (!selectedCandidate) {
      throw new Error(
        "Cet agent n’est pas disponible pour ce remplacement."
      )
    }

    const { data, error } = await supabase
      .from("planning_journalier")
      .update({
        agent_id: Number(params.agentId),
        statut: "Remplacé",
        est_poste_vacant: false,
        commentaire:
          params.commentaire?.trim() ||
          `Remplacement proposé par AGENTIS — score ${selectedCandidate.score}%`,
      })
      .eq("id", params.vacancyId)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    const { error: historyError } = await supabase
      .from("planning_history")
      .insert({
        assignment_id: data.id,
        agent_id: data.agent_id,
        action: "remplacement",
        date_planning: data.date,
        nouveau_site_id: data.site_id,
        nouveau_service: data.service,
        nouvelle_heure_debut:
          data.heure_debut,
        nouvelle_heure_fin:
          data.heure_fin,
        nouveau_statut: data.statut,
        commentaire: data.commentaire,
      })

    if (historyError) {
      console.error(
        "Historique remplacement :",
        historyError
      )
    }

    await agentisCore.emit({
  name: "REPLACEMENT_CREATED",
  module: "remplacements",
  entityType: "replacement",
  entityId: String(data.id),
  severity: "success",
  payload: {
    assignment: data,
    candidate: selectedCandidate,
  },
})

    return data
  },
}

export default ReplacementEngine

async function loadVacancy(
  vacancyId: string | number
): Promise<VacancyRow> {
  const { data, error } = await supabase
    .from("planning_journalier")
    .select(`
      id,
      date,
      agent_id,
      site_id,
      service,
      service_id,
      heure_debut,
      heure_fin,
      statut,
      est_poste_vacant
    `)
    .eq("id", vacancyId)
    .single()

  if (error) {
    throw error
  }

  return data as VacancyRow
}

async function loadCandidateData(
  context: ReplacementContext
): Promise<CandidateData> {
  const [
    agentsResult,
    planningResult,
    absencesResult,
    medicalVisitsResult,
    contractsResult,
    formationsResult,
    habilitationsResult,
    competencesResult,
  ] = await Promise.all([
    supabase
  .from("agents")
  .select(`
    id,
    nom,
    statut,
    poste_id,
    service_id,
    site_id,
    est_polyvalent,
    poste:poste_id (
      id,
      nom
    )
  `)
  .eq("statut", "Actif")
  .order("nom", { ascending: true }),

    supabase
      .from("planning_journalier")
      .select(`
        id,
        agent_id,
        date,
        heure_debut,
        heure_fin,
        statut
      `)
      .eq("date", context.date)
      .not("agent_id", "is", null),

    supabase
      .from("absences")
      .select(`
        agent_id,
        date_debut,
        date_fin,
        statut_validation
      `)
      .lte("date_debut", context.date)
      .gte("date_fin", context.date),

    supabase
      .from("agent_visites_medicales")
      .select(`
        agent_id,
        prochaine_visite,
        aptitude
      `),

    supabase
      .from("agent_contrats")
      .select("*"),

    supabase
      .from("agent_formations")
      .select("agent_id"),

    supabase
      .from("agent_habilitations")
      .select("agent_id"),

    supabase
      .from("agent_competences")
      .select("agent_id"),
  ])

  const firstError =
    agentsResult.error ||
    planningResult.error ||
    absencesResult.error ||
    medicalVisitsResult.error ||
    contractsResult.error ||
    formationsResult.error ||
    habilitationsResult.error ||
    competencesResult.error

  if (firstError) {
    throw new Error(
      `Impossible de rechercher les remplaçants : ${firstError.message}`
    )
  }

  return {
    agents:
      (agentsResult.data || []) as AgentRow[],
    planning:
      (planningResult.data || []) as PlanningRow[],
    absences:
      (absencesResult.data || []) as AbsenceRow[],
    medicalVisits:
      (medicalVisitsResult.data || []) as MedicalVisitRow[],
    contracts:
      (contractsResult.data || []) as ContractRow[],
    formations:
      (formationsResult.data || []) as QualificationRow[],
    habilitations:
      (habilitationsResult.data || []) as QualificationRow[],
    competences:
      (competencesResult.data || []) as QualificationRow[],
  }
}

function buildCandidate(
  agent: AgentRow,
  context: ReplacementContext,
  data: CandidateData,
  requiredRole?: PlanningRequirementRoleKey | null
): ReplacementCandidate {
  const reasons: string[] = []
  const warnings: string[] = []

  const planningConflict =
    data.planning.some(
      (assignment) =>
        String(assignment.agent_id) ===
          String(agent.id) &&
        overlaps(
          context.start,
          context.end,
          assignment.heure_debut,
          assignment.heure_fin
        ) &&
        !isAbsenceStatus(assignment.statut)
    )

  const absenceConflict =
    data.absences.some(
      (absence) =>
        String(absence.agent_id) ===
          String(agent.id) &&
        absence.statut_validation !== "Refusée"
    )

 const hasAssignedSite =
  agent.site_id !== null &&
  agent.site_id !== undefined

const sameSite =
  hasAssignedSite &&
  String(agent.site_id) ===
    String(context.siteId)


const isPolyvalent =
  !hasAssignedSite

 const sameService =
  context.serviceId !== null
    ? String(agent.service_id) ===
      String(context.serviceId)
    : false

const agentPoste =
  Array.isArray(agent.poste)
    ? agent.poste[0]
    : agent.poste

const agentRole =
  mapPosteToRequirementRole(
    agentPoste?.nom
  )

const samePoste =
  requiredRole
    ? agentRole === requiredRole
    : false

const hasValidMedicalVisit =
  hasValidMedicalVisitForAgent(
    agent.id,
    context.date,
    data.medicalVisits
  )

const activeContract =
  hasActiveContractForAgent(
    agent.id,
    context.date,
    data.contracts
  )

const hasFormation =
  hasQualification(
    agent.id,
    data.formations
  )

const hasHabilitation =
  hasQualification(
    agent.id,
    data.habilitations
  )

const hasCompetence =
  hasQualification(
    agent.id,
    data.competences
  )

let score = 45

if (requiredRole) {
  if (samePoste) {
    score += 25
    reasons.push(
      "Poste compatible avec le besoin"
    )
  } else {
    warnings.push(
      "Poste différent du besoin"
    )
  }
}

  if (sameSite) {
  score += 20
  reasons.push("Même site")
} else if (isPolyvalent) {
  score += 10
  reasons.push(
    "Agent polyvalent sans site principal"
  )
} else {
  warnings.push(
    "Autre site principal"
  )
}

  if (sameService) {
    score += 15
    reasons.push("Même service")
  }

  if (hasFormation) {
    score += 5
    reasons.push("Formation enregistrée")
  } else {
    warnings.push("Aucune formation enregistrée")
  }

  if (hasHabilitation) {
    score += 5
    reasons.push("Habilitation enregistrée")
  } else {
    warnings.push("Aucune habilitation enregistrée")
  }

  if (hasCompetence) {
    score += 5
    reasons.push("Compétence enregistrée")
  } else {
    warnings.push("Aucune compétence enregistrée")
  }

  if (hasValidMedicalVisit) {
    score += 5
    reasons.push("Visite médicale valide")
  } else {
    warnings.push("Visite médicale absente ou échue")
  }

  if (activeContract) {
    score += 5
    reasons.push("Contrat actif")
  } else {
    warnings.push("Contrat non confirmé actif")
  }

  if (planningConflict) {
    score -= 50
    warnings.push("Déjà affecté sur ce créneau")
  } else {
    reasons.push("Disponible au planning")
  }

  if (absenceConflict) {
    score -= 50
    warnings.push("Absent ou en congé")
  } else {
    reasons.push("Aucune absence déclarée")
  }

  score = Math.max(
    0,
    Math.min(100, score)
  )

  return {
    agentId: agent.id,
    agentName:
      agent.nom?.trim() ||
      `Agent ${agent.id}`,
    score,
    available:
      !planningConflict &&
      !absenceConflict,
    reasons,
    warnings,
    sameSite,
    sameService,
    samePoste,
    hasValidMedicalVisit,
    activeContract,
    planningConflict,
    absenceConflict,
  }
}

function overlaps(
  targetStart: string | null,
  targetEnd: string | null,
  existingStart: string | null,
  existingEnd: string | null
) {
  if (
    !targetStart ||
    !targetEnd ||
    !existingStart ||
    !existingEnd
  ) {
    return true
  }

  const startA = toMinutes(targetStart)
  const endA = toMinutes(targetEnd)
  const startB = toMinutes(existingStart)
  const endB = toMinutes(existingEnd)

  return startA < endB && startB < endA
}

function toMinutes(value: string) {
  const [hours, minutes] = value
    .slice(0, 5)
    .split(":")
    .map(Number)

  return hours * 60 + minutes
}

function isAbsenceStatus(
  status?: string | null
) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()

  return (
    normalized === "absent" ||
    normalized === "absence"
  )
}

function hasQualification(
  agentId: number,
  rows: QualificationRow[]
) {
  return rows.some(
    (row) =>
      String(row.agent_id) ===
      String(agentId)
  )
}

function hasValidMedicalVisitForAgent(
  agentId: number,
  referenceDate: string,
  rows: MedicalVisitRow[]
) {
  return rows.some((row) => {
    if (
      String(row.agent_id) !==
      String(agentId)
    ) {
      return false
    }

    const aptitude = String(
      row.aptitude || ""
    )
      .trim()
      .toLowerCase()

    if (aptitude.includes("inapte")) {
      return false
    }

    if (!row.prochaine_visite) {
      return true
    }

    return (
      row.prochaine_visite >= referenceDate
    )
  })
}

function hasActiveContractForAgent(
  agentId: number,
  referenceDate: string,
  rows: ContractRow[]
) {
  const agentContracts = rows.filter(
    (row) =>
      String(row.agent_id) ===
      String(agentId)
  )

  if (agentContracts.length === 0) {
    return false
  }

  return agentContracts.some((contract) => {
    const start = getFirstDate(contract, [
      "date_debut",
      "date_debut_contrat",
      "debut_contrat",
    ])

    const end = getFirstDate(contract, [
      "date_fin",
      "date_fin_contrat",
      "fin_contrat",
      "date_echeance",
    ])

    const startsBeforeReference =
      !start || start <= referenceDate

    const endsAfterReference =
      !end || end >= referenceDate

    return (
      startsBeforeReference &&
      endsAfterReference
    )
  })
}

function getFirstDate(
  record: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {
      return value.slice(0, 10)
    }
  }

  return null
}