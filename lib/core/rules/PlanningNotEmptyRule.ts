import type {
  AgentisRule,
} from "../RuleEngine"

export const PlanningNotEmptyRule: AgentisRule = {
  id: "planning-not-empty",

  label: "Planning non vide",

  description:
    "Vérifie qu'un événement Planning contient bien des données.",

  appliesTo(context) {
    return context.module === "planning"
  },

  async validate(context) {
    const hasData =
      context.data != null &&
      Object.keys(context.data).length > 0

    if (hasData) {
      return {
        valid: true,
        code: "PLANNING_OK",
        message: "Le planning contient des données.",
        severity: "success",
      }
    }

    return {
      valid: false,
      code: "PLANNING_EMPTY",
      message: "Le planning ne contient aucune donnée.",
      severity: "warning",
    }
  },
}