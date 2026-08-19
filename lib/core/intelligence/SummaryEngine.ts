import type { AgentisDecision } from "./DecisionEngine"

export type AgentisSummary = {
  title: string
  introduction: string
  headline: string
  counts: {
    blocking: number
    critical: number
    important: number
    moderate: number
  }
  firstDecision: AgentisDecision | null
}

export class SummaryEngine {
  static build(
    decisions: AgentisDecision[]
  ): AgentisSummary {
    const blocking = decisions.filter(
      (d) => d.suggestion.risk.level === "blocking"
    ).length

    const critical = decisions.filter(
      (d) => d.suggestion.risk.level === "critical"
    ).length

    const important = decisions.filter(
      (d) => d.suggestion.risk.level === "important"
    ).length

    const moderate = decisions.filter(
      (d) => d.suggestion.risk.level === "moderate"
    ).length

    return {
      title: "🧠 Bonjour Eric,",

      introduction:
        "J'ai analysé les contrôles RH de votre organisation.",

      headline:
        decisions.length === 0
          ? "Aucune action prioritaire aujourd'hui."
          : `Je recommande de commencer par : ${decisions[0].title}.`,

      counts: {
        blocking,
        critical,
        important,
        moderate,
      },

      firstDecision:
        decisions.length > 0
          ? decisions[0]
          : null,
    }
  }
}