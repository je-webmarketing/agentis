import { eventBus } from "./EventBus"
import { ruleEngine } from "./RuleEngine"
import { workflowEngine } from "./WorkflowEngine"
import { auditEngine } from "./AuditEngine"
import { healthEngine } from "./HealthEngine"
import { recommendationEngine } from "./RecommendationEngine"
import {
  AgentisEvent,
  AgentisEventName,
  AgentisEventPayload,
  AgentisEntityType,
  AgentisModule,
  AgentisSeverity,
} from "./types"

import { PlanningConflictRule } from "./rules/PlanningConflictRule"
import { PlanningNotEmptyRule } from "./rules/PlanningNotEmptyRule"

export class AgentisCore {
  readonly eventBus = eventBus

  readonly ruleEngine = ruleEngine

  readonly workflowEngine = workflowEngine

  readonly auditEngine = auditEngine

  readonly healthEngine = healthEngine

  readonly recommendationEngine = recommendationEngine

  async emit(params: {
    name: AgentisEventName
    module: AgentisModule
    payload?: AgentisEventPayload
    entityType?: AgentisEntityType
    entityId?: string
    severity?: AgentisSeverity
    userId?: string
    source?: string
  }): Promise<void> {
    const event: AgentisEvent = {
      id: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      severity: params.severity ?? "info",
      payload: params.payload ?? {},
      ...params,
    }

    await this.eventBus.publish(event)
  }

  initialize(): void {
    this.ruleEngine.register(PlanningNotEmptyRule)
    this.ruleEngine.register(PlanningConflictRule)

    console.info("✅ Agentis Core initialisé")
  }

  shutdown(): void {
    console.info("🛑 Agentis Core arrêté")
  }
}

export const agentisCore = new AgentisCore()