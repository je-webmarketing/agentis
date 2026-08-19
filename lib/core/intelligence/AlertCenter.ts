import type {
  AgentisAuditCheck,
  AgentisSeverity,
} from "../types"

import type { AgentisDecision } from "./DecisionEngine"

export type AlertCenterItem = {
  id: string
  origin: "audit" | "decision"
  severity: AgentisSeverity
  title: string
  message: string
  source: string
  entityId?: string
  entityLabel?: string
  actionUrl?: string
  score?: number
}

export type AlertCenterResult = {
  total: number
  critical: number
  warning: number
  info: number
  success: number
  alerts: AlertCenterItem[]
}

export class AlertCenter {
  static build(params: {
    checks?: AgentisAuditCheck[]
    decisions?: AgentisDecision[]
  }): AlertCenterResult {
    const alerts: AlertCenterItem[] = []

    for (const check of params.checks ?? []) {
      alerts.push(this.fromAuditCheck(check))
    }

    for (const decision of params.decisions ?? []) {
      alerts.push(this.fromDecision(decision))
    }

    const deduplicated = this.deduplicate(alerts)

    deduplicated.sort((first, second) => {
      const severityDifference =
        this.severityWeight(second.severity) -
        this.severityWeight(first.severity)

      if (severityDifference !== 0) {
        return severityDifference
      }

      return (
        (second.score ?? 0) -
        (first.score ?? 0)
      )
    })

    return {
      total: deduplicated.length,

      critical: deduplicated.filter(
        (alert) =>
          alert.severity === "critical"
      ).length,

      warning: deduplicated.filter(
        (alert) =>
          alert.severity === "warning"
      ).length,

      info: deduplicated.filter(
        (alert) => alert.severity === "info"
      ).length,

      success: deduplicated.filter(
        (alert) =>
          alert.severity === "success"
      ).length,

      alerts: deduplicated,
    }
  }

  private static fromAuditCheck(
    check: AgentisAuditCheck
  ): AlertCenterItem {
    const agentId =
      this.getMetadataId(
        check.metadata,
        "agentId"
      )

   return {
  id: `audit-${check.id}`,
  origin: "audit",
  severity: check.severity,
  title: check.label,
  message: check.message,
  source: check.module,
  entityId: agentId,
  entityLabel:
    this.getMetadataString(
      check.metadata,
      "agentName"
    ),
  actionUrl:
  this.getAuditActionUrl(
    check,
    agentId
  ),
}
  }

  private static fromDecision(
    decision: AgentisDecision
  ): AlertCenterItem {
    const check = decision.suggestion.check

    const agentId =
      this.getMetadataId(
        check.metadata,
        "agentId"
      )

    return {
  id: `decision-${check.id}`,
  origin: "decision",
  severity:
    decision.suggestion.risk.level ===
      "blocking" ||
    decision.suggestion.risk.level ===
      "critical"
      ? "critical"
      : decision.suggestion.risk.level ===
          "important"
        ? "warning"
        : "info",
  title: decision.title,
  message: decision.nextAction,
  source: check.module,
  entityId: agentId,
  entityLabel:
    this.getMetadataString(
      check.metadata,
      "agentName"
    ),
  actionUrl: decision.actionUrl,
  score: decision.score,
}
  }

  private static deduplicate(
    alerts: AlertCenterItem[]
  ): AlertCenterItem[] {
    const seen = new Map<
      string,
      AlertCenterItem
    >()

    for (const alert of alerts) {
     const key = [
  alert.source,
  alert.entityId ?? "",
  alert.title,
  alert.message,
].join("::")

      const existing = seen.get(key)

      if (!existing) {
        seen.set(key, alert)
        continue
      }

      if (
        this.severityWeight(
          alert.severity
        ) >
        this.severityWeight(
          existing.severity
        )
      ) {
        seen.set(key, alert)
        continue
      }

      if (
        (alert.score ?? 0) >
        (existing.score ?? 0)
      ) {
        seen.set(key, alert)
      }
    }

    return Array.from(seen.values())
  }

  private static severityWeight(
    severity: AgentisSeverity
  ): number {
    switch (severity) {
      case "critical":
        return 4

      case "warning":
        return 3

      case "info":
        return 2

      case "success":
        return 1
    }
  }

  private static getAuditActionUrl(
  check: AgentisAuditCheck,
  agentId?: string
): string {
  if (!agentId) {
    return "/dashboard/audits"
  }

  const base =
    `/dashboard/agents/${agentId}`

  /*
   * On privilégie les métadonnées.
   * C'est important car le module "agents"
   * peut correspondre à plusieurs contrôles.
   */

  if (
    check.metadata?.contractId !==
    undefined
  ) {
    return `${base}?tab=contrat`
  }

  if (
    check.metadata?.medicalVisitId !==
    undefined
  ) {
    return `${base}?tab=visites-medicales`
  }

  if (
    check.metadata?.habilitationId !==
    undefined
  ) {
    return `${base}?tab=habilitations`
  }

  if (
    check.metadata?.formationId !==
    undefined
  ) {
    return `${base}?tab=formations`
  }

  if (
    check.metadata?.absenceId !==
    undefined
  ) {
    return `${base}?tab=absences`
  }

  /*
   * Sécurité supplémentaire selon le module.
   */

  switch (check.module) {
    case "habilitations":
      return `${base}?tab=habilitations`

    case "visites-medicales":
      return `${base}?tab=visites-medicales`

    case "formations":
      return `${base}?tab=formations`

    case "planning":
      return `${base}?tab=planning`

    default:
      return base
  }
}

  private static getMetadataId(
    metadata:
      | Record<string, unknown>
      | undefined,
    key: string
  ): string | undefined {
    const value = metadata?.[key]

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return String(value)
    }

    return undefined
  }

  private static getMetadataString(
    metadata:
      | Record<string, unknown>
      | undefined,
    key: string
  ): string | undefined {
    const value = metadata?.[key]

    return typeof value === "string"
      ? value
      : undefined
  }
}