import type {
  AgentisEvent,
  AgentisRuleResult,
} from "../types"
import { ruleEngine } from "../RuleEngine"

export type PlanningAnalysisResult = {
  valid: boolean
  results: AgentisRuleResult[]
  errors: AgentisRuleResult[]
  warnings: AgentisRuleResult[]
}

export class PlanningAnalysisService {
  async analyze(
    event: AgentisEvent
  ): Promise<PlanningAnalysisResult> {
    return ruleEngine.validate({
      module: "planning",
      action: event.name,
      entityType: "planning",
      entityId: event.entityId,
      data: event.payload,
      userId: event.userId,
    })
  }
}

export const planningAnalysisService =
  new PlanningAnalysisService()