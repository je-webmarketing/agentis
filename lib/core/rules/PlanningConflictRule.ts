import type { AgentisRule } from "../RuleEngine"

type PlanningEntry = {
  id?: string | number
  agent_id?: string | number
  date?: string
  heure_debut?: string
  heure_fin?: string
}

function isPlanningEntry(
  value: unknown
): value is PlanningEntry {
  return typeof value === "object" && value !== null
}

export const PlanningConflictRule: AgentisRule = {
  id: "planning-conflict",

  label: "Conflit de planning",

  description:
    "Détecte une affectation simultanée pour un même agent.",

  appliesTo(context) {
    return context.module === "planning"
  },

  validate(context) {
    const data = context.data ?? {}

    const assignment = data.assignment
    const conflict = data.conflict

    if (!isPlanningEntry(assignment)) {
      return {
        valid: true,
        code: "PLANNING_CONFLICT_NOT_CHECKED",
        message:
          "Les données du planning ne permettent pas de vérifier les conflits.",
        severity: "info",
      }
    }

    if (!isPlanningEntry(conflict)) {
      return {
        valid: true,
        code: "PLANNING_NO_CONFLICT",
        message: "Aucun conflit de planning détecté.",
        severity: "success",
      }
    }

    return {
      valid: false,
      code: "PLANNING_CONFLICT",
      message:
        "Cet agent possède déjà une affectation sur ce créneau.",
      severity: "critical",
      metadata: {
        planningId: assignment.id,
        conflictingPlanningId: conflict.id,
        agentId: assignment.agent_id,
        date: assignment.date,
        heureDebut: assignment.heure_debut,
        heureFin: assignment.heure_fin,
      },
    }
  },
}