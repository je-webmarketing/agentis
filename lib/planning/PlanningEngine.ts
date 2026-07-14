import {
  PlanningAgent,
  PlanningSlotKey,
} from "./planning.types"

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
    const dragged = planning.find((agent) => agent.id === draggedAgentId)
    const target = planning.find((agent) => agent.id === targetAgentId)

    if (!dragged || !target) return planning

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
}