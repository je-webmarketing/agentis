import { supabase } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"

export type ForecastEventType =
  | "habilitation"
  | "visite-medicale"
  | "contrat"
  | "formation"
  | "absence"

export type ForecastEvent = {
  id: string
  type: ForecastEventType
  title: string
  agentId: string | number | null
  agentName: string
  label: string
  date: string
  daysRemaining: number
  status:
    | "overdue"
    | "next7"
    | "next15"
    | "next30"
}

type AgentRelation = {
  id: string | number
  nom: string | null
}

type HabilitationRow = {
  id: string | number
  agent_id: string | number | null
  habilitation: string | null
  date_expiration: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

type MedicalVisitRow = {
  id: string | number
  agent_id: string | number | null
  date_visite: string | null
  aptitude: string | null
  prochaine_visite: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

type ContractRow = {
  id: string | number
  agent_id: string | number | null
  type_contrat: string | null
  date_debut: string | null
  date_fin: string | null
  statut: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

type FormationRow = {
  id: string | number
  agent_id: string | number | null
  formation: string | null
  organisme: string | null
  date_formation: string | null
  date_expiration: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

type AbsenceRow = {
  id: string | number
  agent_id: string | number | null
  type: string | null
  date_debut: string | null
  date_fin: string | null
  statut_validation: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

function getAgent(
  relation:
    | AgentRelation
    | AgentRelation[]
    | null
): AgentRelation | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

function getDaysRemaining(
  date: string
): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(
    `${date}T12:00:00`
  )

  return Math.ceil(
    (target.getTime() -
      today.getTime()) /
      86_400_000
  )
}

function getStatus(
  daysRemaining: number
): ForecastEvent["status"] {
  if (daysRemaining < 0) {
    return "overdue"
  }

  if (daysRemaining <= 7) {
    return "next7"
  }

  if (daysRemaining <= 15) {
    return "next15"
  }

  return "next30"
}

function isContractClosed(
  status: string | null
): boolean {
  const normalized = String(
    status || ""
  )
    .trim()
    .toLowerCase()

  return [
    "terminé",
    "termine",
    "expiré",
    "expire",
    "clos",
    "clôturé",
    "cloture",
  ].includes(normalized)
}

export const ForecastService = {
  async getHabilitationForecast(
  horizonDays = 30,
  client: SupabaseClient = supabase
): Promise<ForecastEvent[]> {
  const { data, error } = await client
    .from("agent_habilitations")
      .select(`
        id,
        agent_id,
        habilitation,
        date_expiration,
        agent:agent_id (
          id,
          nom
        )
      `)
      .not("date_expiration", "is", null)

    if (error) {
      throw new Error(
        `Impossible de charger les habilitations à anticiper : ${error.message}`
      )
    }

       const events: ForecastEvent[] = []

    for (const row of (data ?? []) as HabilitationRow[]) {
      if (!row.date_expiration) {
        continue
      }

      const daysRemaining =
        getDaysRemaining(
          row.date_expiration
        )

      if (
        daysRemaining > horizonDays
      ) {
        continue
      }

      const agent = getAgent(
        row.agent
      )

      const agentName =
        agent?.nom?.trim() ||
        "Agent non renseigné"

      const habilitationName =
        row.habilitation?.trim() ||
        "Habilitation non renseignée"

      events.push({
        id: `habilitation-${row.id}`,
        type: "habilitation",
        title:
          daysRemaining < 0
            ? `Habilitation expirée : ${habilitationName}`
            : `Habilitation à renouveler : ${habilitationName}`,
        agentId: row.agent_id,
        agentName,
        label: habilitationName,
        date: row.date_expiration,
        daysRemaining,
        status:
          getStatus(daysRemaining),
      })
    }

    return events.sort(
      (first, second) =>
        first.daysRemaining -
        second.daysRemaining
    )
  },

 async getMedicalVisitForecast(
  horizonDays = 30,
  client: SupabaseClient = supabase
): Promise<ForecastEvent[]> {
  const { data, error } = await client
    .from("agent_visites_medicales") 
    .select(`
      id,
      agent_id,
      date_visite,
      aptitude,
      prochaine_visite,
      agent:agent_id (
        id,
        nom
      )
    `)

  if (error) {
    throw new Error(
      `Impossible de charger les visites médicales à anticiper : ${error.message}`
    )
  }

  const events: ForecastEvent[] = []

  for (const row of (data ?? []) as MedicalVisitRow[]) {
    const forecastDate =
  row.prochaine_visite

if (!forecastDate) {
  continue
}

    const daysRemaining =
      getDaysRemaining(forecastDate)

    if (daysRemaining > horizonDays) {
      continue
    }

    const agent = getAgent(row.agent)

    const agentName =
      agent?.nom
        ?.replace(/\s+/g, " ")
        .trim() ||
      "Agent non renseigné"

    const status =
      getStatus(daysRemaining)

    events.push({
      id: `visite-medicale-${row.id}`,
      type: "visite-medicale",
      title:
  daysRemaining < 0
    ? "Visite médicale échue"
    : "Visite médicale programmée",
      agentId: row.agent_id,
      agentName,
      label:
        row.aptitude?.trim() ||
        "Visite médicale",
      date: forecastDate,
      daysRemaining,
      status,
    })
  }

  return events.sort(
    (first, second) =>
      first.daysRemaining -
      second.daysRemaining
  )
},

async getForecast(
  horizonDays = 30,
  client: SupabaseClient = supabase
): Promise<ForecastEvent[]> {
  const [
  habilitations,
  medicalVisits,
  contracts,
  formations,
  absences,
] = await Promise.all([
  this.getHabilitationForecast(horizonDays, client),
  this.getMedicalVisitForecast(horizonDays, client),
  this.getContractForecast(horizonDays, client),
  this.getFormationForecast(horizonDays, client),
  this.getAbsenceForecast(horizonDays, client),
])

return [
  ...habilitations,
  ...medicalVisits,
  ...contracts,
  ...formations,
  ...absences,
].sort(
  (first, second) =>
    first.daysRemaining -
    second.daysRemaining
)
},

async getContractForecast(
  horizonDays = 30,
  client: SupabaseClient = supabase
): Promise<ForecastEvent[]> {
  const { data, error } = await client
    .from("agent_contrats")
  .select(`
    id,
    agent_id,
    type_contrat,
    date_debut,
    date_fin,
    statut,
    agent:agent_id (
      id,
      nom
    )
  `)
  .not("date_fin", "is", null)


if (error) {
  throw new Error(
    `Impossible de charger les contrats à anticiper : ${error.message}`
  )
}

  const events: ForecastEvent[] = []

  for (const row of (data ?? []) as ContractRow[]) {
    if (!row.date_fin) {
      continue
    }

   if (isContractClosed(row.statut)) {
  continue
} 

    const daysRemaining =
      getDaysRemaining(row.date_fin)

    if (daysRemaining > horizonDays) {
      continue
    }

    const agent = getAgent(row.agent)

    const agentName =
      agent?.nom
        ?.replace(/\s+/g, " ")
        .trim() ||
      "Agent non renseigné"

    const contractLabel =
      row.type_contrat?.trim() ||
      "Contrat"

    events.push({
      id: `contrat-${row.id}`,
      type: "contrat",
      title:
        daysRemaining < 0
          ? `Contrat échu : ${contractLabel}`
          : `Contrat à échéance : ${contractLabel}`,
      agentId: row.agent_id,
      agentName,
      label: contractLabel,
      date: row.date_fin,
      daysRemaining,
      status: getStatus(daysRemaining),
    })
  }

  return events.sort(
    (first, second) =>
      first.daysRemaining -
      second.daysRemaining
  )
},

async getFormationForecast(
  horizonDays = 30,
  client: SupabaseClient = supabase
): Promise<ForecastEvent[]> {
  const { data, error } = await client
    .from("agent_formations")
    .select(`
      id,
      agent_id,
      formation,
      organisme,
      date_formation,
      date_expiration,
      agent:agent_id (
        id,
        nom
      )
    `)
    .not("date_expiration", "is", null)

  if (error) {
    throw new Error(
      `Impossible de charger les formations à anticiper : ${error.message}`
    )
  }

  const events: ForecastEvent[] = []

  for (const row of (data ?? []) as FormationRow[]) {
    if (!row.date_expiration) {
      continue
    }

    const daysRemaining =
      getDaysRemaining(row.date_expiration)

    if (daysRemaining > horizonDays) {
      continue
    }

    const agent = getAgent(row.agent)

    const agentName =
      agent?.nom
        ?.replace(/\s+/g, " ")
        .trim() ||
      "Agent non renseigné"

    const formationName =
      row.formation?.trim() ||
      "Formation non renseignée"

    events.push({
      id: `formation-${row.id}`,
      type: "formation",
      title:
        daysRemaining < 0
          ? `Formation expirée : ${formationName}`
          : `Formation à renouveler : ${formationName}`,
      agentId: row.agent_id,
      agentName,
      label: formationName,
      date: row.date_expiration,
      daysRemaining,
      status: getStatus(daysRemaining),
    })
  }

  return events.sort(
    (first, second) =>
      first.daysRemaining -
      second.daysRemaining
  )
},

async getAbsenceForecast(
  horizonDays = 30,
  client: SupabaseClient = supabase
): Promise<ForecastEvent[]> {
  const { data, error } = await client
    .from("absences")
    .select(`
      id,
      agent_id,
      type,
      date_debut,
      date_fin,
      statut_validation,
      agent:agent_id (
        id,
        nom
      )
    `)
    .neq("statut_validation", "Refusée")

  if (error) {
    throw new Error(
      `Impossible de charger les absences à anticiper : ${error.message}`
    )
  }

  const events: ForecastEvent[] = []

  for (const row of (data ?? []) as AbsenceRow[]) {
    if (!row.date_debut) {
      continue
    }

    const daysRemaining =
      getDaysRemaining(row.date_debut)

    // Ici on ne garde que les absences futures.
    // Les absences déjà commencées sont gérées ailleurs.
    if (
      daysRemaining < 0 ||
      daysRemaining > horizonDays
    ) {
      continue
    }

    const agent = getAgent(row.agent)

    const agentName =
      agent?.nom
        ?.replace(/\s+/g, " ")
        .trim() ||
      "Agent non renseigné"

    const absenceLabel =
      row.type?.trim() ||
      "Absence"

    events.push({
      id: `absence-${row.id}`,
      type: "absence",
      title:
        row.statut_validation === "Validée"
          ? `Absence planifiée : ${absenceLabel}`
          : `Absence à valider : ${absenceLabel}`,
      agentId: row.agent_id,
      agentName,
      label: absenceLabel,
      date: row.date_debut,
      daysRemaining,
      status: getStatus(daysRemaining),
    })
  }

  return events.sort(
    (first, second) =>
      first.daysRemaining -
      second.daysRemaining
  )
},
}

export default ForecastService