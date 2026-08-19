import { AuditRunner } from "../audits/AuditRunner"
import type {
  AgentisAuditReport,
  AgentisSeverity,
} from "../types"
import {
  SuggestionEngine,
  type AgentisSuggestion,
} from "./SuggestionEngine"

export type AgentisIntelligenceSummary = {
  generatedAt: string
  audit: AgentisAuditReport
  totalActions: number
  urgentActions: number
  highPriorityActions: number
  mediumPriorityActions: number
  lowPriorityActions: number
  actions: AgentisSuggestion[]
}

export class AgentisIntelligence {
  static async analyze(
    limit = 10
  ): Promise<AgentisIntelligenceSummary> {
    const audit = await AuditRunner.run()

    const actions = SuggestionEngine
      .build(audit.checks)
      .slice(0, Math.max(0, limit))

    return {
      generatedAt: new Date().toISOString(),
      audit,
      totalActions: actions.length,
      urgentActions: actions.filter(
        (action) =>
          action.priority.level === "urgent"
      ).length,
      highPriorityActions: actions.filter(
        (action) =>
          action.priority.level === "high"
      ).length,
      mediumPriorityActions: actions.filter(
        (action) =>
          action.priority.level === "medium"
      ).length,
      lowPriorityActions: actions.filter(
        (action) =>
          action.priority.level === "low"
      ).length,
      actions,
    }
  }

  static getGlobalSeverity(
    summary: AgentisIntelligenceSummary
  ): AgentisSeverity {
    if (
      summary.urgentActions > 0 ||
      summary.audit.failedChecks > 0
    ) {
      return "critical"
    }

    if (
      summary.highPriorityActions > 0 ||
      summary.audit.warningChecks > 0
    ) {
      return "warning"
    }

    if (summary.totalActions > 0) {
      return "info"
    }

    return "success"
  }

  static getHeadline(
    summary: AgentisIntelligenceSummary
  ): string {
    if (summary.totalActions === 0) {
      return "Aucune action prioritaire détectée."
    }

    if (summary.urgentActions > 0) {
      return `${summary.urgentActions} action${
        summary.urgentActions > 1 ? "s" : ""
      } urgente${
        summary.urgentActions > 1 ? "s" : ""
      } à traiter.`
    }

    if (summary.highPriorityActions > 0) {
      return `${summary.highPriorityActions} action${
        summary.highPriorityActions > 1 ? "s" : ""
      } prioritaire${
        summary.highPriorityActions > 1 ? "s" : ""
      } à examiner.`
    }

    return `${summary.totalActions} action${
      summary.totalActions > 1 ? "s" : ""
    } recommandée${
      summary.totalActions > 1 ? "s" : ""
    }.`
  }
}