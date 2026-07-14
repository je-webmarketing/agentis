import { supabase } from "@/lib/supabase"

type ValidateAssignmentPayload = {
  agent_id: string | number
  date: string
  heure_debut?: string | null
  heure_fin?: string | null
}

export const PlanningValidator = {
  async validateAssignment(payload: ValidateAssignmentPayload) {
    const errors: string[] = []
    const warnings: string[] = []

    const { data: existingPlanning, error } = await supabase
      .from("planning_journalier")
      .select("*")
      .eq("agent_id", payload.agent_id)
      .eq("date", payload.date)

    if (error) throw error

    if (existingPlanning && existingPlanning.length > 0) {
      const conflict = existingPlanning.find((item) => {
        if (!payload.heure_debut || !item.heure_debut) return true

        return item.heure_debut === payload.heure_debut
      })

      if (conflict) {
        errors.push("Cet agent est déjà affecté sur ce créneau.")
      } else {
        warnings.push("Cet agent possède déjà une affectation ce jour-là.")
      }
    }

    const { data: contrats, error: contratsError } = await supabase
      .from("agent_contrats")
      .select("*")
      .eq("agent_id", payload.agent_id)

    if (!contratsError && contrats && contrats.length === 0) {
      warnings.push("Aucun contrat enregistré pour cet agent.")
    }

    const { data: visites, error: visitesError } = await supabase
      .from("agent_visites_medicales")
      .select("*")
      .eq("agent_id", payload.agent_id)

    if (!visitesError && visites && visites.length === 0) {
      warnings.push("Aucune visite médicale enregistrée pour cet agent.")
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}