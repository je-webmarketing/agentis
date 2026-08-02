import { supabase } from "@/lib/supabase"
import SafeSupabase from "@/lib/supabase/SafeSupabase"

export type AgentAlertLevel =
  | "critical"
  | "warning"
  | "info"

export type AgentAlertType =
  | "FORMATION"
  | "HABILITATION"
  | "VISITE_MEDICALE"
  | "DOCUMENT"
  | "CONTRAT"
  | "DOSSIER_INCOMPLET"

export type AgentAlert = {
  id: string
  agentId: number
  type: AgentAlertType
  level: AgentAlertLevel
  title: string
  message: string
  dueDate: string | null
  daysRemaining: number | null
  sourceTable: string
  sourceId: number | null
}


export type GlobalAgentAlert = AgentAlert & {
  agentName: string
}

export type AgentDashboardStats = {
  totalAgents: number
  activeAgents: number
  compliantAgents: number
  incompleteAgents: number
  complianceRate: number
  totalAlerts: number
  criticalAlerts: number
  warningAlerts: number
  infoAlerts: number
  renewalsWithin30Days: number
  agentsWithAlerts: number
}

export type AgentRenewalItem = {
  agentId: number
  agentName: string
  alert: AgentAlert
}

export type AgentMissingItem = {
  key:
    | "coordonnees"
    | "contrat"
    | "documents"
    | "formations"
    | "habilitations"
    | "competences"
    | "visite_medicale"
  label: string
  message: string
}

export type AgentScoreBreakdown = {
  identity: number
  coordinates: number
  contract: number
  documents: number
  formations: number
  habilitations: number
  competences: number
  medicalVisit: number
  complianceBonus: number
}

export type AgentScoreResult = {
  score: number
  complete: boolean
  breakdown: AgentScoreBreakdown
}

export type AgentSummary = {
  agentId: number
  score: number
  complete: boolean
  compliant: boolean
  alerts: AgentAlert[]
  alertCount: number
  criticalAlertCount: number
  warningAlertCount: number
  missingItems: AgentMissingItem[]
  formations: number
  habilitations: number
  visitesMedicales: number
  documents: number
  competences: number
  contrats: number
}

type AgentRecord = {
  id: number
  nom: string | null
  statut: string | null
  temps: string | null
  poste_id: number | null
  service_id: number | null
  site_id: number | null
}

type CoordinatesRecord = {
  id?: number
  agent_id?: number
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  telephone?: string | null
  mobile?: string | null
  email_pro?: string | null
  email_perso?: string | null
  contact_urgence?: string | null
  telephone_urgence?: string | null
  matricule?: string | null
  date_naissance?: string | null
  date_embauche?: string | null
}

type FormationRecord = {
  id: number
  agent_id: number
  formation: string | null
  date_expiration: string | null
}

type HabilitationRecord = {
  id: number
  agent_id: number
  habilitation: string | null
  date_expiration: string | null
}

type MedicalVisitRecord = {
  id: number
  agent_id: number
  date_visite: string | null
  prochaine_visite: string | null
  aptitude: string | null
}

type DocumentRecord = {
  id: number
  agent_id: number
  categorie: string | null
  nom: string | null
  date_expiration: string | null
}

type CompetenceRecord = {
  id: number
  agent_id: number
  competence: string | null
  niveau: string | null
}

type ContractRecord = Record<string, unknown> & {
  id?: number
  agent_id?: number
}

type AgentData = {
  agent: AgentRecord
  coordinates: CoordinatesRecord | null
  formations: FormationRecord[]
  habilitations: HabilitationRecord[]
  medicalVisits: MedicalVisitRecord[]
  documents: DocumentRecord[]
  competences: CompetenceRecord[]
  contracts: ContractRecord[]
}

const ALERT_WARNING_DAYS = 30
const ALERT_INFO_DAYS = 90

export class AgentEngine {
  static async getAgentScore(
    agentId: number | string
  ): Promise<AgentScoreResult> {
    const data = await this.loadAgentData(agentId)
    const alerts = buildAlerts(data)
    const missingItems = buildMissingItems(data)

    return calculateScore(data, alerts, missingItems)
  }

  static async getAgentAlerts(
    agentId: number | string
  ): Promise<AgentAlert[]> {
    const data = await this.loadAgentData(agentId)

    return buildAlerts(data)
  }

  static async getMissingItems(
    agentId: number | string
  ): Promise<AgentMissingItem[]> {
    const data = await this.loadAgentData(agentId)

    return buildMissingItems(data)
  }

  static async isAgentCompliant(
    agentId: number | string
  ): Promise<boolean> {
    const data = await this.loadAgentData(agentId)
    const alerts = buildAlerts(data)
    const missingItems = buildMissingItems(data)

    return (
      alerts.every(
        (alert) => alert.level !== "critical"
      ) && missingItems.length === 0
    )
  }

  static async getAgentSummary(
    agentId: number | string
  ): Promise<AgentSummary> {
    const data = await this.loadAgentData(agentId)
    const alerts = buildAlerts(data)
    const missingItems = buildMissingItems(data)
    const scoreResult = calculateScore(
      data,
      alerts,
      missingItems
    )

    const criticalAlertCount = alerts.filter(
      (alert) => alert.level === "critical"
    ).length

    const warningAlertCount = alerts.filter(
      (alert) => alert.level === "warning"
    ).length

    return {
      agentId: data.agent.id,
      score: scoreResult.score,
      complete: scoreResult.complete,
      compliant:
        criticalAlertCount === 0 &&
        missingItems.length === 0,
      alerts,
      alertCount: alerts.length,
      criticalAlertCount,
      warningAlertCount,
      missingItems,
      formations: data.formations.length,
      habilitations: data.habilitations.length,
      visitesMedicales:
        data.medicalVisits.length,
      documents: data.documents.length,
      competences: data.competences.length,
      contrats: data.contracts.length,
    }
  }


  static async getGlobalAlerts(): Promise<
    GlobalAgentAlert[]
  > {
    const agents = await this.getAgentList()

    const summaries = await Promise.all(
      agents.map(async (agent) => {
        const summary = await this.getAgentSummary(
          agent.id
        )

        return {
          agent,
          summary,
        }
      })
    )

    return summaries
      .flatMap(({ agent, summary }) =>
        summary.alerts.map((alert) => ({
          ...alert,
          agentName:
            agent.nom?.trim() ||
            `Agent ${agent.id}`,
        }))
      )
      .sort(compareAlerts)
  }

  static async getDashboardStats(): Promise<
    AgentDashboardStats
  > {
    const agents = await this.getAgentList()

    const summaries = await Promise.all(
      agents.map((agent) =>
        this.getAgentSummary(agent.id)
      )
    )

    const activeAgents = agents.filter(
      (agent) =>
        String(agent.statut || "")
          .trim()
          .toLowerCase() === "actif"
    ).length

    const compliantAgents = summaries.filter(
      (summary) => summary.compliant
    ).length

    const incompleteAgents = summaries.filter(
      (summary) =>
        summary.missingItems.length > 0
    ).length

    const alerts = summaries.flatMap(
      (summary) => summary.alerts
    )

    return {
      totalAgents: agents.length,
      activeAgents,
      compliantAgents,
      incompleteAgents,
      complianceRate:
        agents.length === 0
          ? 0
          : Math.round(
              (compliantAgents / agents.length) *
                100
            ),
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(
        (alert) => alert.level === "critical"
      ).length,
      warningAlerts: alerts.filter(
        (alert) => alert.level === "warning"
      ).length,
      infoAlerts: alerts.filter(
        (alert) => alert.level === "info"
      ).length,
      renewalsWithin30Days: alerts.filter(
        (alert) =>
          alert.daysRemaining !== null &&
          alert.daysRemaining >= 0 &&
          alert.daysRemaining <=
            ALERT_WARNING_DAYS
      ).length,
      agentsWithAlerts: summaries.filter(
        (summary) => summary.alertCount > 0
      ).length,
    }
  }

  static async getComplianceRate(): Promise<number> {
    const stats = await this.getDashboardStats()

    return stats.complianceRate
  }

  static async getAgentsToRenew(): Promise<
    AgentRenewalItem[]
  > {
    const alerts = await this.getGlobalAlerts()

    return alerts
      .filter(
        (alert) =>
          alert.daysRemaining !== null &&
          alert.daysRemaining >= 0 &&
          alert.daysRemaining <=
            ALERT_WARNING_DAYS
      )
      .map((alert) => ({
        agentId: alert.agentId,
        agentName: alert.agentName,
        alert,
      }))
  }

  private static async getAgentList(): Promise<
    AgentRecord[]
  > {
    const result = await SafeSupabase.array<AgentRecord>(
      () =>
        supabase
          .from("agents")
          .select(`
            id,
            nom,
            statut,
            temps,
            poste_id,
            service_id,
            site_id
          `)
          .order("nom", { ascending: true }),
      "Chargement des agents"
    )

    return result.data
  }

  private static async loadAgentData(
    agentId: number | string
  ): Promise<AgentData> {
    const normalizedAgentId = normalizeAgentId(agentId)

    const [
      agentResult,
      coordinatesResult,
      formationsResult,
      habilitationsResult,
      medicalVisitsResult,
      documentsResult,
      competencesResult,
      contractsResult,
    ] = await Promise.all([
      SafeSupabase.nullable<AgentRecord>(
        () =>
          supabase
            .from("agents")
            .select(`
              id,
              nom,
              statut,
              temps,
              poste_id,
              service_id,
              site_id
            `)
            .eq("id", normalizedAgentId)
            .maybeSingle(),
        "Chargement de l’agent"
      ),

      SafeSupabase.nullable<CoordinatesRecord>(
        () =>
          supabase
            .from("agent_coordonnees")
            .select("*")
            .eq("agent_id", normalizedAgentId)
            .maybeSingle(),
        "Chargement des coordonnées"
      ),

      SafeSupabase.array<FormationRecord>(
        () =>
          supabase
            .from("agent_formations")
            .select(`
              id,
              agent_id,
              formation,
              date_expiration
            `)
            .eq("agent_id", normalizedAgentId),
        "Chargement des formations"
      ),

      SafeSupabase.array<HabilitationRecord>(
        () =>
          supabase
            .from("agent_habilitations")
            .select(`
              id,
              agent_id,
              habilitation,
              date_expiration
            `)
            .eq("agent_id", normalizedAgentId),
        "Chargement des habilitations"
      ),

      SafeSupabase.array<MedicalVisitRecord>(
        () =>
          supabase
            .from("agent_visites_medicales")
            .select(`
              id,
              agent_id,
              date_visite,
              prochaine_visite,
              aptitude
            `)
            .eq("agent_id", normalizedAgentId),
        "Chargement des visites médicales"
      ),

      SafeSupabase.array<DocumentRecord>(
        () =>
          supabase
            .from("agent_documents")
            .select(`
              id,
              agent_id,
              categorie,
              nom,
              date_expiration
            `)
            .eq("agent_id", normalizedAgentId),
        "Chargement des documents"
      ),

      SafeSupabase.array<CompetenceRecord>(
        () =>
          supabase
            .from("agent_competences")
            .select(`
              id,
              agent_id,
              competence,
              niveau
            `)
            .eq("agent_id", normalizedAgentId),
        "Chargement des compétences"
      ),

      SafeSupabase.array<ContractRecord>(
        () =>
          supabase
            .from("agent_contrats")
            .select("*")
            .eq("agent_id", normalizedAgentId),
        "Chargement des contrats"
      ),
    ])

    const agent = agentResult.data ?? {
      id: normalizedAgentId,
      nom: `Agent ${normalizedAgentId}`,
      statut: null,
      temps: null,
      poste_id: null,
      service_id: null,
      site_id: null,
    }

    return {
      agent,
      coordinates: coordinatesResult.data,
      formations: formationsResult.data,
      habilitations: habilitationsResult.data,
      medicalVisits: medicalVisitsResult.data,
      documents: documentsResult.data,
      competences: competencesResult.data,
      contracts: contractsResult.data,
    }
  }
}

export default AgentEngine


function compareAlerts(
  a: AgentAlert,
  b: AgentAlert
) {
  const priorityOrder: Record<
    AgentAlertLevel,
    number
  > = {
    critical: 0,
    warning: 1,
    info: 2,
  }

  const priorityComparison =
    priorityOrder[a.level] -
    priorityOrder[b.level]

  if (priorityComparison !== 0) {
    return priorityComparison
  }

  return (
    (a.daysRemaining ??
      Number.MAX_SAFE_INTEGER) -
    (b.daysRemaining ??
      Number.MAX_SAFE_INTEGER)
  )
}

function buildAlerts(
  data: AgentData
): AgentAlert[] {
  const alerts: AgentAlert[] = []

  data.formations.forEach((formation) => {
    if (!formation.date_expiration) return

    const alert = createDateAlert({
      id: `formation-${formation.id}`,
      agentId: data.agent.id,
      type: "FORMATION",
      title: "Formation à renouveler",
      itemLabel:
        formation.formation ||
        "Formation non renseignée",
      dueDate: formation.date_expiration,
      sourceTable: "agent_formations",
      sourceId: formation.id,
    })

    if (alert) alerts.push(alert)
  })

  data.habilitations.forEach((habilitation) => {
    if (!habilitation.date_expiration) return

    const alert = createDateAlert({
      id: `habilitation-${habilitation.id}`,
      agentId: data.agent.id,
      type: "HABILITATION",
      title: "Habilitation à renouveler",
      itemLabel:
        habilitation.habilitation ||
        "Habilitation non renseignée",
      dueDate: habilitation.date_expiration,
      sourceTable: "agent_habilitations",
      sourceId: habilitation.id,
    })

    if (alert) alerts.push(alert)
  })

  data.medicalVisits.forEach((visit) => {
    if (!visit.prochaine_visite) return

    const alert = createDateAlert({
      id: `medical-${visit.id}`,
      agentId: data.agent.id,
      type: "VISITE_MEDICALE",
      title: "Visite médicale à programmer",
      itemLabel: visit.aptitude
        ? `Aptitude actuelle : ${visit.aptitude}`
        : "Aptitude non renseignée",
      dueDate: visit.prochaine_visite,
      sourceTable: "agent_visites_medicales",
      sourceId: visit.id,
    })

    if (alert) alerts.push(alert)
  })

  data.documents.forEach((document) => {
    if (!document.date_expiration) return

    const label = [
      document.categorie,
      document.nom,
    ]
      .filter(Boolean)
      .join(" · ")

    const alert = createDateAlert({
      id: `document-${document.id}`,
      agentId: data.agent.id,
      type: "DOCUMENT",
      title: "Document à renouveler",
      itemLabel:
        label || "Document non renseigné",
      dueDate: document.date_expiration,
      sourceTable: "agent_documents",
      sourceId: document.id,
    })

    if (alert) alerts.push(alert)
  })

  data.contracts.forEach((contract) => {
    const contractId = toNumber(contract.id)
    const contractLabel =
      getFirstString(contract, [
        "type_contrat",
        "type",
        "nature_contrat",
        "statut",
      ]) || "Contrat"

    const contractEndDate =
      getFirstDate(contract, [
        "date_fin_contrat",
        "date_fin",
        "fin_contrat",
        "date_echeance",
      ])

    if (contractEndDate) {
      const alert = createDateAlert({
        id: `contract-${contractId ?? contractEndDate}`,
        agentId: data.agent.id,
        type: "CONTRAT",
        title: "Fin de contrat",
        itemLabel: contractLabel,
        dueDate: contractEndDate,
        sourceTable: "agent_contrats",
        sourceId: contractId,
      })

      if (alert) alerts.push(alert)
    }

    const trialEndDate =
      getFirstDate(contract, [
        "fin_periode_essai",
        "date_fin_periode_essai",
        "periode_essai_fin",
      ])

    if (trialEndDate) {
      const alert = createDateAlert({
        id: `trial-${contractId ?? trialEndDate}`,
        agentId: data.agent.id,
        type: "CONTRAT",
        title: "Fin de période d’essai",
        itemLabel: contractLabel,
        dueDate: trialEndDate,
        sourceTable: "agent_contrats",
        sourceId: contractId,
      })

      if (alert) alerts.push(alert)
    }
  })

  return alerts.sort(compareAlerts)
}

function buildMissingItems(
  data: AgentData
): AgentMissingItem[] {
  const missingItems: AgentMissingItem[] = []

  if (!isCoordinatesComplete(data.coordinates)) {
    missingItems.push({
      key: "coordonnees",
      label: "Coordonnées",
      message:
        "Les coordonnées principales de l’agent sont incomplètes.",
    })
  }

  if (data.contracts.length === 0) {
    missingItems.push({
      key: "contrat",
      label: "Contrat",
      message:
        "Aucun contrat n’est enregistré pour cet agent.",
    })
  }

  if (data.documents.length === 0) {
    missingItems.push({
      key: "documents",
      label: "Documents",
      message:
        "Aucun document RH n’est enregistré.",
    })
  }

  if (data.formations.length === 0) {
    missingItems.push({
      key: "formations",
      label: "Formations",
      message:
        "Aucune formation n’est enregistrée.",
    })
  }

  if (data.habilitations.length === 0) {
    missingItems.push({
      key: "habilitations",
      label: "Habilitations",
      message:
        "Aucune habilitation n’est enregistrée.",
    })
  }

  if (data.competences.length === 0) {
    missingItems.push({
      key: "competences",
      label: "Compétences",
      message:
        "Aucune compétence n’est enregistrée.",
    })
  }

  if (data.medicalVisits.length === 0) {
    missingItems.push({
      key: "visite_medicale",
      label: "Visite médicale",
      message:
        "Aucune visite médicale n’est enregistrée.",
    })
  }

  return missingItems
}

function calculateScore(
  data: AgentData,
  alerts: AgentAlert[],
  missingItems: AgentMissingItem[]
): AgentScoreResult {
  const breakdown: AgentScoreBreakdown = {
    identity: isIdentityComplete(data.agent)
      ? 10
      : 5,
    coordinates: isCoordinatesComplete(
      data.coordinates
    )
      ? 10
      : data.coordinates
        ? 5
        : 0,
    contract:
      data.contracts.length > 0 ? 15 : 0,
    documents:
      data.documents.length > 0 ? 15 : 0,
    formations:
      data.formations.length > 0 ? 15 : 0,
    habilitations:
      data.habilitations.length > 0 ? 10 : 0,
    competences:
      data.competences.length > 0 ? 10 : 0,
    medicalVisit:
      data.medicalVisits.length > 0 ? 10 : 0,
    complianceBonus: alerts.some(
      (alert) => alert.level === "critical"
    )
      ? 0
      : 5,
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      Object.values(breakdown).reduce(
        (total, value) => total + value,
        0
      )
    )
  )

  return {
    score,
    complete:
      missingItems.length === 0 &&
      score === 100,
    breakdown,
  }
}

function createDateAlert(params: {
  id: string
  agentId: number
  type: AgentAlertType
  title: string
  itemLabel: string
  dueDate: string
  sourceTable: string
  sourceId: number | null
}): AgentAlert | null {
  const daysRemaining = getDaysRemaining(
    params.dueDate
  )

  if (
    !Number.isFinite(daysRemaining) ||
    daysRemaining > ALERT_INFO_DAYS
  ) {
    return null
  }

  const level: AgentAlertLevel =
    daysRemaining <= 0
      ? "critical"
      : daysRemaining <= ALERT_WARNING_DAYS
        ? "warning"
        : "info"

  return {
    id: params.id,
    agentId: params.agentId,
    type: params.type,
    level,
    title: params.title,
    message: buildAlertMessage(
      params.itemLabel,
      daysRemaining
    ),
    dueDate: params.dueDate,
    daysRemaining,
    sourceTable: params.sourceTable,
    sourceId: params.sourceId,
  }
}

function buildAlertMessage(
  itemLabel: string,
  daysRemaining: number
) {
  if (daysRemaining < 0) {
    const daysLate = Math.abs(daysRemaining)

    return `${itemLabel} est expiré depuis ${daysLate} jour${
      daysLate > 1 ? "s" : ""
    }.`
  }

  if (daysRemaining === 0) {
    return `${itemLabel} arrive à échéance aujourd’hui.`
  }

  return `${itemLabel} arrive à échéance dans ${daysRemaining} jour${
    daysRemaining > 1 ? "s" : ""
  }.`
}

function getDaysRemaining(value: string) {
  const dueDate = new Date(`${value}T12:00:00`)

  if (Number.isNaN(dueDate.getTime())) {
    return Number.POSITIVE_INFINITY
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.ceil(
    (dueDate.getTime() - today.getTime()) /
      86_400_000
  )
}

function normalizeAgentId(
  agentId: number | string
) {
  const normalized = Number(agentId)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error("Identifiant agent invalide.")
  }

  return normalized
}

function isIdentityComplete(
  agent: AgentRecord
) {
  return Boolean(
    agent.nom?.trim() &&
      agent.statut?.trim() &&
      agent.temps?.trim() &&
      agent.poste_id &&
      agent.service_id &&
      agent.site_id
  )
}

function isCoordinatesComplete(
  coordinates: CoordinatesRecord | null
) {
  if (!coordinates) return false

  const hasEmail = Boolean(
    coordinates.email_pro?.trim() ||
      coordinates.email_perso?.trim()
  )

  const hasPhone = Boolean(
    coordinates.mobile?.trim() ||
      coordinates.telephone?.trim()
  )

  return Boolean(
    coordinates.matricule?.trim() &&
      coordinates.date_naissance &&
      coordinates.date_embauche &&
      hasEmail &&
      hasPhone &&
      coordinates.adresse?.trim() &&
      coordinates.code_postal?.trim() &&
      coordinates.ville?.trim()
  )
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

function getFirstString(
  record: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return null
}

function toNumber(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value)

    return Number.isFinite(parsed)
      ? parsed
      : null
  }

  return null
}