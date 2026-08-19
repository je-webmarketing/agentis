import {
  CompatibilityEngine,
  type CompatibilityResult,
} from "@/lib/core/intelligence/CompatibilityEngine"

import {
  ReplacementEngine,
  type ReplacementCandidate,
  type ReplacementContext,
} from "@/lib/core/intelligence/ReplacementEngine"

export class PlanningReplacementService {
  static async findBestReplacement(
    agents: ReplacementCandidate[],
    date: string,
    context: ReplacementContext = {}
  ): Promise<{
    found: boolean
    best: CompatibilityResult | null
    candidates: CompatibilityResult[]
  }> {
    const candidates =
      ReplacementEngine.findCandidates(
        agents,
        context
      )

    if (candidates.length === 0) {
      return {
        found: false,
        best: null,
        candidates: [],
      }
    }

    const ranked =
      await CompatibilityEngine.rankWithAvailability(
        candidates,
        date,
        context
      )

    return {
      found: ranked.length > 0,
      best:
        ranked.length > 0
          ? ranked[0]
          : null,
      candidates: ranked,
    }
  }
}

export default PlanningReplacementService