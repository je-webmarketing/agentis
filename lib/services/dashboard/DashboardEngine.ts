import { supabase } from "@/lib/supabase"

export type DashboardEngineStats = {
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

type AgentRow = {
  id: number
  nom?: string | null
  statut?: string | null
  temps?: string | number | null
  poste_id?: number | null
  service_id?: number | null
  site_id?: number | null
}

type AgentRelationRow = {
  agent_id?: number | string | null
}

type ExpiringRow = AgentRelationRow & {
  date_expiration?: string | null
}

type MedicalVisitRow = AgentRelationRow & {
  prochaine_visite?: string | null
}

type ContractRow = AgentRelationRow & {
  date_fin?: string | null
}

type AlertLevel = "critical" | "warning" | "info"

type DashboardAlert = {
  agentId: number
  level: AlertLevel
  daysRemaining: number
}

const WARNING_DAYS = 30
const INFO_DAYS = 90

export class DashboardEngine {
  static async getStats(): Promise<DashboardEngineStats> {
    const [
      agents,
      coordinates,
      formations,
      habilitations,
      medicalVisits,
      documents,
      competences,
      contracts,
    ] = await Promise.all([
      safeArray<AgentRow>(
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
          `),
        "agents"
      ),

      safeArray<AgentRelationRow>(
        supabase
          .from("agent_coordonnees")
          .select("agent_id"),
        "coordonnées"
      ),

      safeArray<ExpiringRow>(
        supabase
          .from("agent_formations")
          .select(`
            agent_id,
            date_expiration
          `),
        "formations"
      ),

      safeArray<ExpiringRow>(
        supabase
          .from("agent_habilitations")
          .select(`
            agent_id,
            date_expiration
          `),
        "habilitations"
      ),

      safeArray<MedicalVisitRow>(
        supabase
          .from("agent_visites_medicales")
          .select(`
            agent_id,
            prochaine_visite
          `),
        "visites médicales"
      ),

      safeArray<ExpiringRow>(
        supabase
          .from("agent_documents")
          .select(`
            agent_id,
            date_expiration
          `),
        "documents"
      ),

      safeArray<AgentRelationRow>(
        supabase
          .from("agent_competences")
          .select("agent_id"),
        "compétences"
      ),

      safeArray<ContractRow>(
        supabase
          .from("agent_contrats")
          .select(`
            agent_id,
            date_fin
          `),
        "contrats"
      ),
    ])

    const coordinatesByAgent =
      buildAgentIdSet(coordinates)

    const formationsByAgent =
      buildAgentIdSet(formations)

    const habilitationsByAgent =
      buildAgentIdSet(habilitations)

    const medicalVisitsByAgent =
      buildAgentIdSet(medicalVisits)

    const documentsByAgent =
      buildAgentIdSet(documents)

    const competencesByAgent =
      buildAgentIdSet(competences)

    const contractsByAgent =
      buildAgentIdSet(contracts)

    const alerts: DashboardAlert[] = [
      ...buildExpirationAlerts(
        formations,
        "date_expiration"
      ),
      ...buildExpirationAlerts(
        habilitations,
        "date_expiration"
      ),
      ...buildExpirationAlerts(
        documents,
        "date_expiration"
      ),
      ...buildExpirationAlerts(
        medicalVisits,
        "prochaine_visite"
      ),
      ...buildExpirationAlerts(
        contracts,
        "date_fin"
      ),
    ]

    const criticalAgents = new Set(
      alerts
        .filter(
          (alert) =>
            alert.level === "critical"
        )
        .map((alert) => alert.agentId)
    )

    const agentsWithAlerts = new Set(
      alerts.map((alert) => alert.agentId)
    )

    let compliantAgents = 0
    let incompleteAgents = 0

    for (const agent of agents) {
      const identityComplete =
        Boolean(agent.nom?.trim()) &&
        Boolean(agent.statut?.trim()) &&
        agent.poste_id !== null &&
        agent.poste_id !== undefined &&
        agent.service_id !== null &&
        agent.service_id !== undefined &&
        agent.site_id !== null &&
        agent.site_id !== undefined

      const complete =
        identityComplete &&
        coordinatesByAgent.has(agent.id) &&
        formationsByAgent.has(agent.id) &&
        habilitationsByAgent.has(agent.id) &&
        medicalVisitsByAgent.has(agent.id) &&
        documentsByAgent.has(agent.id) &&
        competencesByAgent.has(agent.id) &&
        contractsByAgent.has(agent.id)

      if (!complete) {
        incompleteAgents += 1
      }

      if (
        complete &&
        !criticalAgents.has(agent.id)
      ) {
        compliantAgents += 1
      }
    }

    const activeAgents = agents.filter(
      (agent) =>
        normalize(agent.statut) === "actif"
    ).length

    const totalAgents = agents.length

    return {
      totalAgents,
      activeAgents,
      compliantAgents,
      incompleteAgents,
      complianceRate:
        totalAgents === 0
          ? 0
          : Math.round(
              (compliantAgents / totalAgents) *
                100
            ),
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(
        (alert) =>
          alert.level === "critical"
      ).length,
      warningAlerts: alerts.filter(
        (alert) =>
          alert.level === "warning"
      ).length,
      infoAlerts: alerts.filter(
        (alert) => alert.level === "info"
      ).length,
      renewalsWithin30Days: alerts.filter(
        (alert) =>
          alert.daysRemaining >= 0 &&
          alert.daysRemaining <= WARNING_DAYS
      ).length,
      agentsWithAlerts:
        agentsWithAlerts.size,
    }
  }
}

function buildAgentIdSet(
  rows: AgentRelationRow[]
): Set<number> {
  const ids = new Set<number>()

  for (const row of rows) {
    const agentId = normalizeAgentId(
      row.agent_id
    )

    if (agentId !== null) {
      ids.add(agentId)
    }
  }

  return ids
}

function buildExpirationAlerts<
  T extends AgentRelationRow,
>(
  rows: T[],
  dateKey: keyof T
): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  for (const row of rows) {
    const agentId = normalizeAgentId(
      row.agent_id
    )

    const rawDate = row[dateKey]

    if (
      agentId === null ||
      typeof rawDate !== "string" ||
      !rawDate
    ) {
      continue
    }

    const daysRemaining =
      getDaysRemaining(rawDate)

    if (
      !Number.isFinite(daysRemaining) ||
      daysRemaining > INFO_DAYS
    ) {
      continue
    }

    alerts.push({
      agentId,
      daysRemaining,
      level:
        daysRemaining <= 0
          ? "critical"
          : daysRemaining <= WARNING_DAYS
            ? "warning"
            : "info",
    })
  }

  return alerts
}

function getDaysRemaining(
  value: string
): number {
  const dueDate = new Date(
    `${value.slice(0, 10)}T12:00:00`
  )

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
  value: number | string | null | undefined
): number | null {
  const id = Number(value)

  return Number.isInteger(id) && id > 0
    ? id
    : null
}

function normalize(
  value: string | null | undefined
): string {
  return String(value || "")
    .trim()
    .toLowerCase()
}

async function safeArray<T>(
  query: PromiseLike<{
    data: T[] | null
    error: {
      message?: string
    } | null
  }>,
  label: string
): Promise<T[]> {
  try {
    const { data, error } = await query

    if (error) {
      console.warn(
        `[DashboardEngine] ${label} :`,
        error.message
      )

      return []
    }

    return data ?? []
  } catch (error) {
    console.warn(
      `[DashboardEngine] ${label} :`,
      error
    )

    return []
  }
}

export default DashboardEngine