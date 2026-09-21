import { supabase } from "@/lib/supabase"

export type AgentAffectation = {
  id: string | number
  agent_id: string | number
  site_id: string | number | null
  service_id: string | number | null
  poste_id: string | number | null
  date_debut: string | null
  date_fin: string | null
  principal: boolean
  actif: boolean
  created_at: string
  updated_at: string
site: {
  nom: string
} | null

service: {
  nom: string
} | null

poste: {
  nom: string
} | null
}

export type CreateAgentAffectationParams = {
  agentId: string | number
  siteId?: string | number | null
  serviceId?: string | number | null
  posteId?: string | number | null
  dateDebut?: string | null
  dateFin?: string | null
  principal?: boolean
}

export const AgentAffectationService = {
  async listByAgent(
    agentId: string | number
  ): Promise<AgentAffectation[]> {
    const { data, error } = await supabase
      .from("agent_affectations")
      .select(`
        id,
        agent_id,
        site_id,
        service_id,
        poste_id,
        date_debut,
        date_fin,
        principal,
        actif,
        created_at,
        updated_at,
site:sites!agent_affectations_site_id_fkey (
  nom
),
service:services!agent_affectations_service_id_fkey (
  nom
),
poste:postes!agent_affectations_poste_id_fkey (
  nom
)
      `)
      .eq("agent_id", agentId)
      .eq("actif", true)
      .order("principal", { ascending: false })
      .order("id", { ascending: true })

    if (error) throw error

    console.log("AFFECTATIONS SUPABASE:", data)

   return (data ?? []) as unknown as AgentAffectation[]
  },

  async create(
    params: CreateAgentAffectationParams
  ): Promise<AgentAffectation> {
    const { data, error } = await supabase
      .from("agent_affectations")
      .insert({
        agent_id: params.agentId,
        site_id: params.siteId ?? null,
        service_id: params.serviceId ?? null,
        poste_id: params.posteId ?? null,
        date_debut: params.dateDebut ?? null,
        date_fin: params.dateFin ?? null,
        principal: params.principal ?? false,
        actif: true,
      })
      .select()
      .single()

    if (error) throw error

    return data as AgentAffectation
  },

  async setPrincipal(
    affectationId: string | number,
    agentId: string | number
  ): Promise<void> {
    const { error: resetError } = await supabase
      .from("agent_affectations")
      .update({ principal: false })
      .eq("agent_id", agentId)
      .eq("actif", true)

    if (resetError) throw resetError

    const { error } = await supabase
      .from("agent_affectations")
      .update({ principal: true })
      .eq("id", affectationId)
      .eq("agent_id", agentId)

    if (error) throw error
  },

async deactivate(
  affectationId: string | number
): Promise<void> {
  // 1. Récupérer l'affectation avant sa désactivation
  const {
    data: affectation,
    error: affectationError,
  } = await supabase
    .from("agent_affectations")
    .select("id, agent_id, principal")
    .eq("id", affectationId)
    .single()

  if (affectationError) {
    throw affectationError
  }

  // 2. Désactiver l'affectation
  const { error: deactivateError } =
    await supabase
      .from("agent_affectations")
      .update({
        actif: false,
        principal: false,
      })
      .eq("id", affectationId)

  if (deactivateError) {
    throw deactivateError
  }

  // 3. Si elle n'était pas principale,
  // rien d'autre à faire
  if (!affectation.principal) {
    return
  }

  // 4. Chercher une autre affectation active
  const {
    data: replacement,
    error: replacementError,
  } = await supabase
    .from("agent_affectations")
    .select("id")
    .eq("agent_id", affectation.agent_id)
    .eq("actif", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (replacementError) {
    throw replacementError
  }

  // 5. S'il en reste une, elle devient principale
  if (replacement) {
    const { error: principalError } =
      await supabase
        .from("agent_affectations")
        .update({
          principal: true,
        })
        .eq("id", replacement.id)

    if (principalError) {
      throw principalError
    }
  }
},
}