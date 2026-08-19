import type { AgentisAuditCheck } from "../types"
import {
  PriorityEngine,
  type AgentisPriorityResult,
} from "./PriorityEngine"
import {
  RiskEngine,
  type AgentisRiskAssessment,
} from "./RiskEngine"

export type AgentisSuggestion = {
  id: string
  title: string
  description: string
  action: string
  priority: AgentisPriorityResult
  risk: AgentisRiskAssessment
  context: string
  impact: string
  recommendedAction: string
  check: AgentisAuditCheck
}

export class SuggestionEngine {
  static build(
    checks: AgentisAuditCheck[]
  ): AgentisSuggestion[] {
    return PriorityEngine.rank(checks)
      .map(({ check, priority }) => {
        const risk = RiskEngine.evaluate(check)

        return {
          id: check.id,
          title: this.getTitle(check),
          description: check.message,
          action: this.getAction(check),
          priority,
          risk,
          context: risk.context,
          impact: risk.impact,
          recommendedAction:
            risk.recommendedAction,
          check,
        }
      })
      .sort((first, second) => {
        const riskDifference =
          second.risk.score - first.risk.score

        if (riskDifference !== 0) {
          return riskDifference
        }

        return (
          second.priority.score -
          first.priority.score
        )
      })
  }

  private static getTitle(
  check: AgentisAuditCheck
): string {
  switch (check.module) {
    case "habilitations": {
      const habilitationName =
        this.getMetadataString(
          check,
          "habilitationName"
        )

      return habilitationName
        ? `Renouveler l’habilitation ${habilitationName}`
        : "Renouveler une habilitation"
    }

    case "visites-medicales":
      return "Programmer une visite médicale"

    case "agents":
      return "Mettre à jour un contrat"

    case "formations":
      return "Renouveler une formation"

    case "planning":
      return "Corriger une anomalie de planning"

    default:
      return check.label
  }
}

  private static getAction(
    check: AgentisAuditCheck
  ): string {
    const agentId =
      this.getMetadataId(check, "agentId")

    switch (check.module) {
    case "habilitations":
  return agentId
    ? `/dashboard/agents/${agentId}?tab=habilitations`
    : "/dashboard/agents"

case "visites-medicales":
  return agentId
    ? `/dashboard/agents/${agentId}?tab=visites-medicales`
    : "/dashboard/agents"

case "formations":
  return agentId
    ? `/dashboard/agents/${agentId}?tab=formations`
    : "/dashboard/agents"

case "agents":
  return agentId
    ? `/dashboard/agents/${agentId}`
    : "/dashboard/agents"
      case "planning":
        return "/dashboard/planning"

      case "documents":
        return "/dashboard/documents"

      default:
        return "/dashboard/audits"
    }
  }

  private static getMetadataId(
  check: AgentisAuditCheck,
  key: string
): string | null {
  const value = check.metadata?.[key]

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value)
  }

  return null
}

private static getMetadataString(
  check: AgentisAuditCheck,
  key: string
): string | null {
  const value = check.metadata?.[key]

  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : null
}
}