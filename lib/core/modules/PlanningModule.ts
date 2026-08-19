import { agentisCore } from "../AgentisCore"
import { planningAnalysisService } from "./PlanningAnalysisService"
import type { AgentisEvent } from "../types"

export class PlanningModule {
  initialize(): void {
    agentisCore.eventBus.subscribe(
      "PLANNING_UPDATED",
      this.onPlanningUpdated.bind(this)
    )

    agentisCore.eventBus.subscribe(
      "PLANNING_CREATED",
      this.onPlanningCreated.bind(this)
    )
  }

  private async analyze(event: AgentisEvent): Promise<void> {
    const analysis =
      await planningAnalysisService.analyze(event)

    const recommendation =
      await agentisCore.recommendationEngine.fromRuleResults(
        `planning-${event.entityId ?? event.id}`,
        event.payload,
        analysis.results
      )

    console.info("[PlanningModule] Analyse terminée", {
      event: event.name,
      valid: analysis.valid,
      errors: analysis.errors,
      warnings: analysis.warnings,
      recommendation,
    })
  }

  private async onPlanningCreated(
    event: AgentisEvent
  ): Promise<void> {
    console.info(
      "[PlanningModule] Planning créé",
      event.payload
    )

    await this.analyze(event)
  }

  private async onPlanningUpdated(
    event: AgentisEvent
  ): Promise<void> {
    console.info(
      "[PlanningModule] Planning mis à jour",
      event.payload
    )

    await this.analyze(event)
  }
}

export const planningModule = new PlanningModule()