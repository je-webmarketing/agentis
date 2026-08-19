import type {
  AgentisAuditCheck,
  AgentisSeverity,
} from "../types"

export type AgentisPriorityLevel =
  | "urgent"
  | "high"
  | "medium"
  | "low"

export type AgentisPriorityResult = {
  score: number
  level: AgentisPriorityLevel
  reasons: string[]
}

const severityScores: Record<AgentisSeverity, number> = {
  critical: 80,
  warning: 50,
  info: 20,
  success: 0,
}

export class PriorityEngine {
  static evaluate(
    check: AgentisAuditCheck
  ): AgentisPriorityResult {
    const reasons: string[] = []

    let score =
      severityScores[check.severity] ?? 0

    reasons.push(
      `Sévérité : ${check.severity}`
    )

    const daysRemaining =
      this.getMetadataNumber(
        check,
        "daysRemaining"
      )

    if (daysRemaining !== null) {
      if (daysRemaining < 0) {
        score += 20
        reasons.push("Échéance dépassée")
      } else if (daysRemaining <= 7) {
        score += 15
        reasons.push("Échéance sous 7 jours")
      } else if (daysRemaining <= 30) {
        score += 10
        reasons.push("Échéance sous 30 jours")
      }
    }

    if (check.status === "error") {
      score += 10
      reasons.push("Contrôle en erreur")
    }

    if (check.status === "warning") {
      score += 5
      reasons.push("Contrôle à surveiller")
    }

    const normalizedScore = Math.max(
      0,
      Math.min(100, Math.round(score))
    )

    return {
      score: normalizedScore,
      level: this.getLevel(normalizedScore),
      reasons,
    }
  }

  static rank(
    checks: AgentisAuditCheck[]
  ): Array<{
    check: AgentisAuditCheck
    priority: AgentisPriorityResult
  }> {
    return checks
      .filter(
        (check) =>
          check.status === "error" ||
          check.status === "warning"
      )
      .map((check) => ({
        check,
        priority: this.evaluate(check),
      }))
      .sort(
        (first, second) =>
          second.priority.score -
          first.priority.score
      )
  }

  private static getLevel(
    score: number
  ): AgentisPriorityLevel {
    if (score >= 90) {
      return "urgent"
    }

    if (score >= 70) {
      return "high"
    }

    if (score >= 40) {
      return "medium"
    }

    return "low"
  }

  private static getMetadataNumber(
    check: AgentisAuditCheck,
    key: string
  ): number | null {
    const value = check.metadata?.[key]

    return typeof value === "number" &&
      Number.isFinite(value)
      ? value
      : null
  }
}