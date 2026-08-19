import { supabase } from "@/lib/supabase"

type UnknownRecord = Record<string, unknown>

export type SkillCheckResult = {
  eligible: boolean
  score: number
  reasons: string[]
  warnings: string[]
}

function getFirstString(
  record: UnknownRecord | null | undefined,
  keys: string[]
): string | null {
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
): string | null {
  const value = getFirstString(record, keys)

  if (!value) return null

  const match = value.match(/^\d{4}-\d{2}-\d{2}/)

  return match ? match[0] : null
}

function isActiveContract(
  contract: UnknownRecord,
  referenceDate: string
): boolean {
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
}

function hasValidMedicalVisit(
  visits: UnknownRecord[],
  referenceDate: string
): boolean {
  return visits.some((visit) => {
    const aptitude =
      getFirstString(visit, [
        "aptitude",
        "statut",
        "resultat",
      ]) || ""

    if (
      aptitude
        .toLowerCase()
        .includes("inapte")
    ) {
      return false
    }

    const nextVisit = getFirstDate(visit, [
      "prochaine_visite",
      "date_prochaine_visite",
      "date_echeance",
    ])

    return !nextVisit || nextVisit >= referenceDate
  })
}

function countValidFormations(
  formations: UnknownRecord[],
  referenceDate: string
): number {
  return formations.filter((formation) => {
    const expiration = getFirstDate(formation, [
      "date_expiration",
      "date_echeance",
      "expiration",
    ])

    return !expiration || expiration >= referenceDate
  }).length
}

function countValidHabilitations(
  habilitations: UnknownRecord[],
  referenceDate: string
): number {
  return habilitations.filter((habilitation) => {
    const expiration = getFirstDate(habilitation, [
      "date_expiration",
      "date_echeance",
      "expiration",
    ])

    return !expiration || expiration >= referenceDate
  }).length
}

export class SkillEngine {
  static async evaluateAgent(
    agentId: string | number,
    referenceDate = new Date()
      .toISOString()
      .slice(0, 10)
  ): Promise<SkillCheckResult> {
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
          id,
          statut,
          poste_id,
          service_id,
          site_id
        `)
        .eq("id", agentId)
        .single(),

      supabase
        .from("agent_contrats")
        .select("*")
        .eq("agent_id", agentId),

      supabase
        .from("agent_visites_medicales")
        .select("*")
        .eq("agent_id", agentId),

      supabase
        .from("agent_formations")
        .select("*")
        .eq("agent_id", agentId),

      supabase
        .from("agent_habilitations")
        .select("*")
        .eq("agent_id", agentId),
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

    const reasons: string[] = []
    const warnings: string[] = []

    const agent =
      (agentResult.data || {}) as UnknownRecord

    const contracts =
      (contractsResult.data || []) as UnknownRecord[]

    const visits =
      (visitsResult.data || []) as UnknownRecord[]

    const formations =
      (formationsResult.data || []) as UnknownRecord[]

    const habilitations =
      (habilitationsResult.data || []) as UnknownRecord[]

    let score = 0
    let eligible = true

    const statut =
      getFirstString(agent, ["statut"]) || ""

    if (statut.toLowerCase() === "actif") {
      score += 20
      reasons.push("Agent actif.")
    } else {
      eligible = false
      warnings.push("Agent non actif.")
    }

    const hasActiveContract = contracts.some(
      (contract) =>
        isActiveContract(
          contract,
          referenceDate
        )
    )

    if (hasActiveContract) {
      score += 20
      reasons.push("Contrat actif.")
    } else {
      eligible = false
      warnings.push(
        "Aucun contrat actif confirmé."
      )
    }

    if (
      hasValidMedicalVisit(
        visits,
        referenceDate
      )
    ) {
      score += 20
      reasons.push(
        "Visite médicale valide."
      )
    } else {
      warnings.push(
        "Visite médicale absente, échue ou inapte."
      )
    }

    const validFormations =
      countValidFormations(
        formations,
        referenceDate
      )

    if (validFormations > 0) {
      score += 20
      reasons.push(
        `${validFormations} formation(s) valide(s).`
      )
    } else {
      warnings.push(
        "Aucune formation valide enregistrée."
      )
    }

    const validHabilitations =
      countValidHabilitations(
        habilitations,
        referenceDate
      )

    if (validHabilitations > 0) {
      score += 20
      reasons.push(
        `${validHabilitations} habilitation(s) valide(s).`
      )
    } else {
      warnings.push(
        "Aucune habilitation valide enregistrée."
      )
    }

    return {
      eligible,
      score: Math.max(
        0,
        Math.min(100, Math.round(score))
      ),
      reasons,
      warnings,
    }
  }
}