import type {
  AgentisHealthMetric,
  AgentisHealthReport,
  AgentisSeverity,
} from "./types"

export class HealthEngine {
  private metrics = new Map<string, AgentisHealthMetric>()

  register(metric: AgentisHealthMetric): void {
    this.metrics.set(metric.key, metric)
  }

  unregister(key: string): boolean {
    return this.metrics.delete(key)
  }

  clear(): void {
    this.metrics.clear()
  }

  getMetrics(): AgentisHealthMetric[] {
    return Array.from(this.metrics.values())
  }

  buildReport(): AgentisHealthReport {
    const metrics = this.getMetrics()

    if (metrics.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        score: 100,
        status: "success",
        metrics: [],
      }
    }

    const score = Math.round(
      metrics.reduce((sum, metric) => sum + metric.score, 0) /
        metrics.length
    )

    return {
      generatedAt: new Date().toISOString(),
      score,
      status: this.computeSeverity(score),
      metrics,
    }
  }

  private computeSeverity(score: number): AgentisSeverity {
    if (score >= 90) return "success"
    if (score >= 75) return "info"
    if (score >= 50) return "warning"
    return "critical"
  }
}

export const healthEngine = new HealthEngine()