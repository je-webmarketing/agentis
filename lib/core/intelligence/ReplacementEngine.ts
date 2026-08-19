export type ReplacementCandidate = {
  id: string | number
  nom: string | null
  statut?: string | null
  site_id?: string | number | null
  service_id?: string | number | null
  poste_id?: string | number | null
}

export type ReplacementContext = {
  absentAgentId?: string | number | null
  excludedAgentIds?: Array<string | number>
  requiredSiteId?: string | number | null
  requiredServiceId?: string | number | null
}

export type ReplacementCandidateResult = {
  candidate: ReplacementCandidate
  eligible: boolean
  reasons: string[]
}

export class ReplacementEngine {
  static findCandidates(
    agents: ReplacementCandidate[],
    context: ReplacementContext = {}
  ): ReplacementCandidate[] {
    return this.evaluateCandidates(
      agents,
      context
    )
      .filter((result) => result.eligible)
      .map((result) => result.candidate)
  }

  static evaluateCandidates(
    agents: ReplacementCandidate[],
    context: ReplacementContext = {}
  ): ReplacementCandidateResult[] {
    const excludedIds = new Set(
      (context.excludedAgentIds || []).map(
        (id) => String(id)
      )
    )

    if (
      context.absentAgentId !== null &&
      context.absentAgentId !== undefined
    ) {
      excludedIds.add(
        String(context.absentAgentId)
      )
    }

    return agents.map((agent) => {
      const reasons: string[] = []
      let eligible = true

      const agentId = String(agent.id)

      if (excludedIds.has(agentId)) {
        eligible = false
        reasons.push(
          "Agent exclu de la recherche."
        )
      }

      const normalizedStatus = String(
        agent.statut || ""
      )
        .trim()
        .toLowerCase()

      if (
        normalizedStatus &&
        normalizedStatus !== "actif"
      ) {
        eligible = false
        reasons.push(
          "Agent non actif."
        )
      }

      if (
        context.requiredSiteId !== null &&
        context.requiredSiteId !== undefined &&
        agent.site_id !== null &&
        agent.site_id !== undefined &&
        String(agent.site_id) !==
          String(context.requiredSiteId)
      ) {
        reasons.push(
          "Site principal différent."
        )
      }

      if (
        context.requiredServiceId !== null &&
        context.requiredServiceId !== undefined &&
        agent.service_id !== null &&
        agent.service_id !== undefined &&
        String(agent.service_id) !==
          String(context.requiredServiceId)
      ) {
        reasons.push(
          "Service principal différent."
        )
      }

      if (eligible && reasons.length === 0) {
        reasons.push(
          "Candidat potentiel."
        )
      }

      return {
        candidate: agent,
        eligible,
        reasons,
      }
    })
  }
}