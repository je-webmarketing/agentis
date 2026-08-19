import type { AgentisSuggestion } from "./SuggestionEngine"

export type AgentisDecision = {
  rank: number
  score: number
  title: string
  summary: string
  why: string
  nextAction: string
  actionUrl: string
  suggestion: AgentisSuggestion
}

export class DecisionEngine {
  static decide(
    suggestions: AgentisSuggestion[]
  ): AgentisDecision[] {
    return suggestions
      .map((suggestion) => ({
        suggestion,
        score: this.computeScore(suggestion),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ suggestion, score }, index) => ({
        rank: index + 1,
        score,
        title: suggestion.title,
        summary: suggestion.description,
        why: suggestion.impact,
        nextAction:
          suggestion.recommendedAction,
        actionUrl: suggestion.action,
        suggestion,
      }))
  }

  private static computeScore(
    suggestion: AgentisSuggestion
  ): number {
    let score = 0

    score += suggestion.priority.score

    score += suggestion.risk.score

    switch (suggestion.risk.level) {
      case "blocking":
        score += 40
        break

      case "critical":
        score += 30
        break

      case "important":
        score += 15
        break

      case "moderate":
        score += 5
        break
    }

    return Math.min(
      100,
      Math.round(score / 2)
    )
  }

  static top(
    suggestions: AgentisSuggestion[],
    limit = 5
  ): AgentisDecision[] {
    return this.decide(suggestions).slice(
      0,
      limit
    )
  }

  static headline(
    decisions: AgentisDecision[]
  ): string {
    if (decisions.length === 0) {
      return "Aucune action prioritaire aujourd'hui."
    }

    const first = decisions[0]

    return `Je recommande de commencer par : ${first.title}.`
  }
}