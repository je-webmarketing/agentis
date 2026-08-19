import ReplacementEngine, {
  type ReplacementCandidate,
} from "./ReplacementEngine"

import { SkillEngine } from "@/lib/core/intelligence/SkillEngine"

export type SmartReplacementCandidate = {
  candidate: ReplacementCandidate

  /**
   * Score métier calculé par le ReplacementEngine existant.
   * On ne le recalcule pas ici pour éviter de compter
   * deux fois les mêmes critères.
   */
  score: number

  skillScore: number
  skillEligible: boolean

  reasons: string[]
  warnings: string[]
}

export type SmartReplacementResult = {
  found: boolean
  recommendation: SmartReplacementCandidate | null
  alternatives: SmartReplacementCandidate[]
}

export class SmartReplacementService {
  /**
   * Recherche et enrichit les meilleurs candidats
   * pour un poste vacant existant.
   */
  static async recommend(
    vacancyId: string | number,
    limit = 8
  ): Promise<SmartReplacementResult> {
    const candidates =
      await ReplacementEngine.getBestCandidates(
        vacancyId,
        limit
      )

    if (candidates.length === 0) {
      return {
        found: false,
        recommendation: null,
        alternatives: [],
      }
    }

    const enriched = await Promise.all(
      candidates.map(async (candidate) => {
        const skill =
          await SkillEngine.evaluateAgent(
            candidate.agentId
          )

        return {
          candidate,

          // Le ReplacementEngine reste la source
          // officielle du score de remplacement.
          score: candidate.score,

          skillScore: skill.score,
          skillEligible: skill.eligible,

          reasons: Array.from(
            new Set([
              ...candidate.reasons,
              ...skill.reasons,
            ])
          ),

          warnings: Array.from(
            new Set([
              ...candidate.warnings,
              ...skill.warnings,
            ])
          ),
        } satisfies SmartReplacementCandidate
      })
    )

    /*
     * Le moteur existant renvoie déjà les candidats
     * classés, mais on sécurise l'ordre ici.
     */
    enriched.sort(
      (first, second) =>
        second.score - first.score
    )

    return {
      found: enriched.length > 0,
      recommendation:
        enriched[0] ?? null,
      alternatives: enriched,
    }
  }

  /**
   * Affecte réellement le candidat.
   *
   * On délègue volontairement au ReplacementEngine :
   * il revérifie que l'agent est encore disponible,
   * met à jour planning_journalier et écrit l'historique.
   */
  static async assign(params: {
    vacancyId: string | number
    agentId: string | number
    commentaire?: string | null
  }) {
    return ReplacementEngine.assignCandidate(
      params
    )
  }
}

export default SmartReplacementService