import {
  PlanningAgent,
  PlanningSlotKey,
} from "./planning.types"

export type PlanningCoverageStatus =
  | "ok"
  | "warning"
  | "danger"

export type PlanningSlotRequirements =
  Partial<Record<PlanningSlotKey, number>>

export type PlanningSiteRequirements =
  Record<string, PlanningSlotRequirements>

export type PlanningSlotCoverage = {
  siteId: string
  slot: PlanningSlotKey
  expected: number
  assigned: number
  missing: number
  extra: number
  coverage: number
  status: PlanningCoverageStatus
}

export type PlanningSiteCoverage = {
  siteId: string
  expected: number
  assigned: number
  missing: number
  extra: number
  coverage: number
  status: PlanningCoverageStatus
  slots: PlanningSlotCoverage[]
}

export default class PlanningEngine {
  static moveAgent(
    planning: PlanningAgent[],
    agentId: string,
    targetSiteId: string,
    targetSlot: PlanningSlotKey
  ): PlanningAgent[] {
    return planning.map((agent) =>
      agent.id === agentId
        ? {
            ...agent,
            siteId: targetSiteId,
            slot: targetSlot,
          }
        : agent
    )
  }

  static swapAgents(
    planning: PlanningAgent[],
    draggedAgentId: string,
    targetAgentId: string
  ): PlanningAgent[] {
    const dragged = planning.find(
      (agent) => agent.id === draggedAgentId
    )

    const target = planning.find(
      (agent) => agent.id === targetAgentId
    )

    if (!dragged || !target) {
      return planning
    }

    return planning.map((agent) => {
      if (agent.id === draggedAgentId) {
        return {
          ...agent,
          siteId: target.siteId,
          slot: target.slot,
          start: target.start,
          end: target.end,
        }
      }

      if (agent.id === targetAgentId) {
        return {
          ...agent,
          siteId: dragged.siteId,
          slot: dragged.slot,
          start: dragged.start,
          end: dragged.end,
        }
      }

      return agent
    })
  }

  static countAssignedAgents(
    planning: PlanningAgent[],
    siteId: string,
    slot: PlanningSlotKey
  ): number {
    return planning.filter(
      (agent) =>
        agent.siteId === siteId &&
        agent.slot === slot
    ).length
  }

  static computeSlotCoverage(
    planning: PlanningAgent[],
    siteId: string,
    slot: PlanningSlotKey,
    expected: number
  ): PlanningSlotCoverage {
    const safeExpected = Math.max(
      0,
      Math.trunc(expected)
    )

    const assigned = this.countAssignedAgents(
      planning,
      siteId,
      slot
    )

    const missing = Math.max(
      0,
      safeExpected - assigned
    )

    const extra = Math.max(
      0,
      assigned - safeExpected
    )

    const coverage =
      safeExpected === 0
        ? 100
        : Math.min(
            100,
            Math.round(
              (assigned / safeExpected) * 100
            )
          )

    return {
      siteId,
      slot,
      expected: safeExpected,
      assigned,
      missing,
      extra,
      coverage,
      status: this.getCoverageStatus(missing),
    }
  }

  static computeSiteCoverage(
    planning: PlanningAgent[],
    siteId: string,
    requirements: PlanningSlotRequirements
  ): PlanningSiteCoverage {
    const slots = (
      Object.entries(requirements) as Array<
        [PlanningSlotKey, number | undefined]
      >
    ).map(([slot, expected]) =>
      this.computeSlotCoverage(
        planning,
        siteId,
        slot,
        expected ?? 0
      )
    )

    const expected = slots.reduce(
      (total, slot) => total + slot.expected,
      0
    )

    const assigned = slots.reduce(
      (total, slot) => total + slot.assigned,
      0
    )

    const missing = slots.reduce(
      (total, slot) => total + slot.missing,
      0
    )

    const extra = slots.reduce(
      (total, slot) => total + slot.extra,
      0
    )

    const coverage =
      expected === 0
        ? 100
        : Math.min(
            100,
            Math.round(
              (assigned / expected) * 100
            )
          )

    return {
      siteId,
      expected,
      assigned,
      missing,
      extra,
      coverage,
      status: this.getCoverageStatus(missing),
      slots,
    }
  }

  static computeAllSitesCoverage(
    planning: PlanningAgent[],
    requirementsBySite: PlanningSiteRequirements
  ): PlanningSiteCoverage[] {
    return Object.entries(
      requirementsBySite
    ).map(([siteId, requirements]) =>
      this.computeSiteCoverage(
        planning,
        siteId,
        requirements
      )
    )
  }


  static computeCoverageFromCounts(
    expected: number,
    assigned: number
  ) {
    const safeExpected = Math.max(0, Math.trunc(expected))
    const safeAssigned = Math.max(0, Math.trunc(assigned))

    const missing = Math.max(
      0,
      safeExpected - safeAssigned
    )

    const extra = Math.max(
      0,
      safeAssigned - safeExpected
    )

    const coverage =
      safeExpected === 0
        ? 100
        : Math.min(
            100,
            Math.round(
              (safeAssigned / safeExpected) * 100
            )
          )

    return {
      expected: safeExpected,
      assigned: safeAssigned,
      missing,
      extra,
      coverage,
      status: this.getCoverageStatus(missing),
    }
  }

  static getCoverageStatus(
    missing: number
  ): PlanningCoverageStatus {
    if (missing >= 2) {
      return "danger"
    }

    if (missing === 1) {
      return "warning"
    }

    return "ok"
  }

  static getMissingCount(
    planning: PlanningAgent[],
    siteId: string,
    requirements: PlanningSlotRequirements
  ): number {
    return this.computeSiteCoverage(
      planning,
      siteId,
      requirements
    ).missing
  }

  static getCoverageRate(
    planning: PlanningAgent[],
    siteId: string,
    requirements: PlanningSlotRequirements
  ): number {
    return this.computeSiteCoverage(
      planning,
      siteId,
      requirements
    ).coverage
  }
}