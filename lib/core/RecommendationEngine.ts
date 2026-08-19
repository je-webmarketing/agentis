import type {
  AgentisRecommendation,
  AgentisRecommendationReason,
  AgentisRuleResult,
  AgentisSeverity,
} from "./types"

export type RecommendationEvaluator<T> = {
  id: string
  label: string
  evaluate: (
    item: T
  ) =>
    | AgentisRecommendationReason
    | AgentisRecommendationReason[]
    | Promise<
        | AgentisRecommendationReason
        | AgentisRecommendationReason[]
      >
}

export class RecommendationEngine<T = unknown> {
  private evaluators = new Map<
    string,
    RecommendationEvaluator<T>
  >()

  register(evaluator: RecommendationEvaluator<T>): void {
    this.evaluators.set(evaluator.id, evaluator)
  }

  unregister(evaluatorId: string): boolean {
    return this.evaluators.delete(evaluatorId)
  }

  clear(): void {
    this.evaluators.clear()
  }

  list(): RecommendationEvaluator<T>[] {
    return Array.from(this.evaluators.values())
  }

  async evaluate(
    id: string,
    item: T
  ): Promise<AgentisRecommendation<T>> {
    const reasons: AgentisRecommendationReason[] = []
    const warnings: string[] = []

    for (const evaluator of this.list()) {
      try {
        const result = await evaluator.evaluate(item)

        if (Array.isArray(result)) {
          reasons.push(...result)
        } else {
          reasons.push(result)
        }
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? `${evaluator.label} : ${error.message}`
            : `${evaluator.label} : erreur inconnue`
        )
      }
    }

    return {
      id,
      score: this.computeScore(reasons),
      item,
      reasons,
      warnings,
    }
  }

  async fromRuleResults(
    id: string,
    item: T,
    results: AgentisRuleResult[]
  ): Promise<AgentisRecommendation<T>> {
    const recommendation = await this.evaluate(id, item)

    const ruleReasons = results
      .filter((result) => !result.valid)
      .map((result) =>
        this.ruleResultToReason(result)
      )

    const reasons = [
      ...recommendation.reasons,
      ...ruleReasons,
    ]

    return {
      ...recommendation,
      score: this.computeScore(reasons),
      reasons,
    }
  }

  async rank(
    items: Array<{
      id: string
      item: T
    }>
  ): Promise<AgentisRecommendation<T>[]> {
    const recommendations = await Promise.all(
      items.map(({ id, item }) =>
        this.evaluate(id, item)
      )
    )

    return recommendations.sort(
      (a, b) => b.score - a.score
    )
  }

  private ruleResultToReason(
    result: AgentisRuleResult
  ): AgentisRecommendationReason {
    return {
      label: result.message,
      score: this.severityScore(result.severity),
      severity: result.severity,
      description: result.code,
    }
  }

  private severityScore(
    severity: AgentisSeverity
  ): number {
    switch (severity) {
      case "critical":
        return 80
      case "warning":
        return 40
      case "info":
        return 15
      case "success":
        return 0
    }
  }

  private computeScore(
    reasons: AgentisRecommendationReason[]
  ): number {
    if (reasons.length === 0) {
      return 0
    }

    const rawScore = reasons.reduce(
      (total, reason) => total + reason.score,
      0
    )

    return Math.max(
      0,
      Math.min(100, Math.round(rawScore))
    )
  }
}

export const recommendationEngine =
  new RecommendationEngine()