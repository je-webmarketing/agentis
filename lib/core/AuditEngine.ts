import type {
  AgentisAuditCheck,
  AgentisAuditReport,
} from "./types"

export class AuditEngine {
  private checks: AgentisAuditCheck[] = []

  addCheck(check: AgentisAuditCheck): void {
    this.checks.push(check)
  }

  clear(): void {
    this.checks = []
  }

  getChecks(): AgentisAuditCheck[] {
    return [...this.checks]
  }

  buildReport(): AgentisAuditReport {
    const totalChecks = this.checks.length

    const passedChecks = this.checks.filter(
      (check) => check.status === "success"
    ).length

    const warningChecks = this.checks.filter(
      (check) => check.status === "warning"
    ).length

    const failedChecks = this.checks.filter(
      (check) => check.status === "error"
    ).length

    const score =
      totalChecks === 0
        ? 100
        : Math.round((passedChecks / totalChecks) * 100)

    return {
      generatedAt: new Date().toISOString(),
      score,
      totalChecks,
      passedChecks,
      warningChecks,
      failedChecks,
      checks: this.getChecks(),
    }
  }
}

export const auditEngine = new AuditEngine()