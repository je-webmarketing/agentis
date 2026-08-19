import type {
  AgentisRuleContext,
  AgentisRuleResult,
} from "./types"

export type AgentisRule = {
  id: string
  label: string
  description?: string
  appliesTo: (context: AgentisRuleContext) => boolean
  validate: (
    context: AgentisRuleContext
  ) => AgentisRuleResult | Promise<AgentisRuleResult>
}

export class RuleEngine {
  private rules = new Map<string, AgentisRule>()

  register(rule: AgentisRule): void {
    this.rules.set(rule.id, rule)
  }

  unregister(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  has(ruleId: string): boolean {
    return this.rules.has(ruleId)
  }

  get(ruleId: string): AgentisRule | undefined {
    return this.rules.get(ruleId)
  }

  list(): AgentisRule[] {
    return Array.from(this.rules.values())
  }

  clear(): void {
    this.rules.clear()
  }

  async evaluate(
    context: AgentisRuleContext
  ): Promise<AgentisRuleResult[]> {
    const applicableRules = this.list().filter((rule) => {
      try {
        return rule.appliesTo(context)
      } catch {
        return false
      }
    })

    return Promise.all(
      applicableRules.map(async (rule) => {
        try {
          return await rule.validate(context)
        } catch (error) {
          return {
            valid: false,
            code: `RULE_ERROR_${rule.id}`,
            message:
              error instanceof Error
                ? error.message
                : `Erreur inconnue dans la règle ${rule.label}`,
            severity: "critical",
            metadata: {
              ruleId: rule.id,
              ruleLabel: rule.label,
            },
          } satisfies AgentisRuleResult
        }
      })
    )
  }

  async validate(
    context: AgentisRuleContext
  ): Promise<{
    valid: boolean
    results: AgentisRuleResult[]
    errors: AgentisRuleResult[]
    warnings: AgentisRuleResult[]
  }> {
    const results = await this.evaluate(context)

    const errors = results.filter(
      (result) =>
        !result.valid &&
        result.severity === "critical"
    )

    const warnings = results.filter(
      (result) =>
        !result.valid &&
        result.severity === "warning"
    )

    return {
      valid: errors.length === 0,
      results,
      errors,
      warnings,
    }
  }
}

export const ruleEngine = new RuleEngine()