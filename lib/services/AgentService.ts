import { supabase } from "@/lib/supabase"

type UnknownRecord = Record<string, unknown>

export type AgentQuickProfile = {
  agentId: string | number
  name: string
  positionLabel: string
  contractLabel: string
  medicalVisitLabel: string
  formationLabel: string
  habilitationLabel: string
}

function getFirstString(
  record: UnknownRecord | null | undefined,
  keys: string[]
) {
  if (!record) return null

  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim()
    }
  }

  return null
}

function getFirstDate(
  record: UnknownRecord | null | undefined,
  keys: string[]
) {
  const value = getFirstString(record, keys)

  if (!value) return null

  const match = value.match(/^\d{4}-\d{2}-\d{2}/)

  return match ? match[0] : null
}

function getRelationName(
  relation: unknown
) {
  if (
    relation &&
    typeof relation === "object" &&
    !Array.isArray(relation)
  ) {
    const name = (relation as UnknownRecord).nom

    return typeof name === "string"
      ? name.trim()
      : null
  }

  if (Array.isArray(relation)) {
    const first = relation[0]

    if (
      first &&
      typeof first === "object"
    ) {
      const name = (first as UnknownRecord).nom

      return typeof name === "string"
        ? name.trim()
        : null
    }
  }

  return null
}

function formatDateFr(value: string | null) {
  if (!value) return null

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR").format(date)
}

function buildContractLabel(
  contracts: UnknownRecord[],
  referenceDate: string
) {
  if (contracts.length === 0) {
    return "Aucun contrat enregistré"
  }

  const activeContract = contracts.find((contract) => {
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

    return (
      (!start || start <= referenceDate) &&
      (!end || end >= referenceDate)
    )
  })

  if (!activeContract) {
    return "Aucun contrat actif"
  }

  const type =
    getFirstString(activeContract, [
      "type_contrat",
      "type",
      "contrat",
      "nature_contrat",
    ]) || "Contrat actif"

  const end = getFirstDate(activeContract, [
    "date_fin",
    "date_fin_contrat",
    "fin_contrat",
    "date_echeance",
  ])

  return end
    ? `${type} · jusqu’au ${formatDateFr(end)}`
    : type
}

function buildMedicalVisitLabel(
  visits: UnknownRecord[],
  referenceDate: string
) {
  if (visits.length === 0) {
    return "Aucune visite enregistrée"
  }

  const sortedVisits = [...visits].sort((a, b) => {
    const dateA =
      getFirstDate(a, [
        "prochaine_visite",
        "date_prochaine_visite",
        "date_visite",
      ]) || ""

    const dateB =
      getFirstDate(b, [
        "prochaine_visite",
        "date_prochaine_visite",
        "date_visite",
      ]) || ""

    return dateB.localeCompare(dateA)
  })

  const visit = sortedVisits[0]

  const aptitude =
    getFirstString(visit, [
      "aptitude",
      "statut",
      "resultat",
    ]) || ""

  const nextVisit = getFirstDate(visit, [
    "prochaine_visite",
    "date_prochaine_visite",
    "date_echeance",
  ])

  if (
    aptitude.toLowerCase().includes("inapte")
  ) {
    return "Inaptitude enregistrée"
  }

  if (!nextVisit) {
    return aptitude || "Visite enregistrée"
  }

  if (nextVisit < referenceDate) {
    return `Échue depuis le ${formatDateFr(nextVisit)}`
  }

  return `Valide jusqu’au ${formatDateFr(nextVisit)}`
}

function buildFormationLabel(
  formations: UnknownRecord[]
) {
  if (formations.length === 0) {
    return "Aucune formation enregistrée"
  }

  if (formations.length === 1) {
    const title =
      getFirstString(formations[0], [
        "formation",
        "nom",
        "intitule",
        "titre",
      ]) || "1 formation enregistrée"

    return title
  }

  return `${formations.length} formations enregistrées`
}

function buildHabilitationLabel(
  habilitations: UnknownRecord[],
  referenceDate: string
) {
  if (habilitations.length === 0) {
    return "Aucune habilitation enregistrée"
  }

  const active = habilitations.filter((habilitation) => {
    const expiration = getFirstDate(habilitation, [
      "date_expiration",
      "date_echeance",
      "expiration",
    ])

    return !expiration || expiration >= referenceDate
  })

  if (active.length === 0) {
    return "Toutes les habilitations sont expirées"
  }

  if (active.length === 1) {
    const title =
      getFirstString(active[0], [
        "habilitation",
        "nom",
        "intitule",
        "titre",
      ]) || "1 habilitation active"

    const expiration = getFirstDate(active[0], [
      "date_expiration",
      "date_echeance",
      "expiration",
    ])

    return expiration
      ? `${title} · jusqu’au ${formatDateFr(expiration)}`
      : title
  }

  return `${active.length} habilitations actives`
}

export const AgentService = {
  async list() {
    const { data, error } = await supabase
      .from("agents")
      .select(`
        *,
        poste:poste_id(id, nom),
        service_ref:service_id(id, nom),
        site:site_id(id, nom, structure_id)
      `)
      .order("nom")

    if (error) throw error
    return data ?? []
  },

  async listPlanningCandidates() {
  const { data, error } = await supabase
    .rpc("planning_candidate_agents")

 console.log(
  "JARRY DANS PLANNING:",
  data?.filter(
    (agent: { nom: string | null }) =>
      agent.nom?.toUpperCase().includes("JARRY")
  )
)

  console.log(
    "PLANNING CANDIDATES ERROR:",
    error
  )

  if (error) throw error

  return data ?? []
},

  async getById(id: string | number) {
    const { data, error } = await supabase
      .from("agents")
      .select(`
        *,
        poste:poste_id(id, nom),
        service_ref:service_id(id, nom),
        site:site_id(id, nom, structure_id)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  async getQuickProfile(
    id: string | number,
    referenceDate = new Date()
      .toISOString()
      .slice(0, 10)
  ): Promise<AgentQuickProfile> {
    const [
      agentResult,
      contractsResult,
      visitsResult,
      formationsResult,
      habilitationsResult,
    ] = await Promise.all([
      supabase
        .from("agents")
        .select(`
          *,
          poste:poste_id(id, nom),
          service_ref:service_id(id, nom),
          site:site_id(id, nom, structure_id)
        `)
        .eq("id", id)
        .single(),

      supabase
        .from("agent_contrats")
        .select("*")
        .eq("agent_id", id),

      supabase
        .from("agent_visites_medicales")
        .select("*")
        .eq("agent_id", id),

      supabase
        .from("agent_formations")
        .select("*")
        .eq("agent_id", id),

      supabase
        .from("agent_habilitations")
        .select("*")
        .eq("agent_id", id),
    ])

    

    const firstError =
      agentResult.error ||
      contractsResult.error ||
      visitsResult.error ||
      formationsResult.error ||
      habilitationsResult.error

    if (firstError) {
      throw firstError
    }

    const agent =
      (agentResult.data || {}) as UnknownRecord

    const name =
      getFirstString(agent, ["nom"]) ||
      `Agent ${id}`

    const positionLabel =
      getRelationName(agent.poste) ||
      getFirstString(agent, [
        "poste",
        "fonction",
        "emploi",
      ]) ||
      "Poste non renseigné"

    return {
      agentId: id,
      name,
      positionLabel,
      contractLabel: buildContractLabel(
        (contractsResult.data || []) as UnknownRecord[],
        referenceDate
      ),
      medicalVisitLabel: buildMedicalVisitLabel(
        (visitsResult.data || []) as UnknownRecord[],
        referenceDate
      ),
      formationLabel: buildFormationLabel(
        (formationsResult.data || []) as UnknownRecord[]
      ),
      habilitationLabel: buildHabilitationLabel(
        (habilitationsResult.data || []) as UnknownRecord[],
        referenceDate
      ),
    }
  },

  async create(payload: any) {
    const { data, error } = await supabase
      .from("agents")
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string | number, payload: any) {
    const { data, error } = await supabase
      .from("agents")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string | number) {
    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", id)

    if (error) throw error
    return true
  },

  async getBySite(siteId: string | number) {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("site_id", siteId)
      .order("nom")

    if (error) throw error
    return data ?? []
  },

  async search(search: string) {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .ilike("nom", `%${search}%`)
      .order("nom")

    if (error) throw error
    return data ?? []
  },
}