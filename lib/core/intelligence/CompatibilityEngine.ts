import { AvailabilityEngine } from "@/lib/services/AvailabilityEngine"

import type {
  ReplacementCandidate,
  ReplacementContext,
} from "./ReplacementEngine"

export type CompatibilityReason = {
  label: string
  score: number
  description: string
}

export type CompatibilityResult = {
  candidate: ReplacementCandidate
  score: number
  reasons: CompatibilityReason[]
  warnings: string[]
}

export class CompatibilityEngine {
  static evaluate(
    candidate: ReplacementCandidate,
    context: ReplacementContext = {}
  ): CompatibilityResult {
    const reasons: CompatibilityReason[] = []
    const warnings: string[] = []

    let score = 40

    reasons.push({
      label: "Candidat actif",
      score: 40,
      description:
        "L’agent est éligible à la recherche de remplacement.",
    })

    if (
      context.requiredSiteId !== null &&
      context.requiredSiteId !== undefined
    ) {
      if (
        candidate.site_id !== null &&
        candidate.site_id !== undefined &&
        String(candidate.site_id) ===
          String(context.requiredSiteId)
      ) {
        score += 20

        reasons.push({
          label: "Même site",
          score: 20,
          description:
            "L’agent est rattaché au même site que le besoin.",
        })
      } else {
        warnings.push(
          "L’agent n’est pas rattaché au même site."
        )
      }
    }

    if (
      context.requiredServiceId !== null &&
      context.requiredServiceId !== undefined
    ) {
      if (
        candidate.service_id !== null &&
        candidate.service_id !== undefined &&
        String(candidate.service_id) ===
          String(context.requiredServiceId)
      ) {
        score += 20

        reasons.push({
          label: "Même service",
          score: 20,
          description:
            "L’agent appartient au même service que le besoin.",
        })
      } else {
        warnings.push(
          "L’agent n’appartient pas au même service."
        )
      }
    }

    const requiredPosteId =
      this.getContextPosteId(context)

    if (requiredPosteId !== null) {
      if (
        candidate.poste_id !== null &&
        candidate.poste_id !== undefined &&
        String(candidate.poste_id) ===
          String(requiredPosteId)
      ) {
        score += 20

        reasons.push({
          label: "Même poste",
          score: 20,
          description:
            "L’agent occupe déjà le même type de poste.",
        })
      } else {
        warnings.push(
          "Le poste principal de l’agent est différent."
        )
      }
    }

    return {
      candidate,
      score: Math.max(
        0,
        Math.min(100, Math.round(score))
      ),
      reasons,
      warnings,
    }
  }

  static async evaluateWithAvailability(
    candidate: ReplacementCandidate,
    date: string,
    context: ReplacementContext = {}
  ): Promise<CompatibilityResult> {
    const result = this.evaluate(
      candidate,
      context
    )

    const availability =
      await AvailabilityEngine.checkAgentAvailability(
        candidate.id,
        date
      )

    if (!availability.available) {
      return {
        ...result,
        score: 0,
        warnings: [
          ...result.warnings,
          availability.reason
            ? `Indisponible : ${availability.reason}`
            : "Agent indisponible à cette date.",
        ],
      }
    }

    return {
      ...result,
      reasons: [
        ...result.reasons,
        {
          label: "Disponible",
          score: 0,
          description:
            "Aucune absence ne bloque cet agent à la date du remplacement.",
        },
      ],
    }
  }

  static rank(
    candidates: ReplacementCandidate[],
    context: ReplacementContext = {}
  ): CompatibilityResult[] {
    return candidates
      .map((candidate) =>
        this.evaluate(candidate, context)
      )
      .sort((a, b) => b.score - a.score)
  }

  static async rankWithAvailability(
    candidates: ReplacementCandidate[],
    date: string,
    context: ReplacementContext = {}
  ): Promise<CompatibilityResult[]> {
    const results = await Promise.all(
      candidates.map((candidate) =>
        this.evaluateWithAvailability(
          candidate,
          date,
          context
        )
      )
    )

    return results
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  private static getContextPosteId(
    context: ReplacementContext
  ): string | number | null {
    const extendedContext =
      context as ReplacementContext & {
        requiredPosteId?:
          | string
          | number
          | null
      }

    return (
      extendedContext.requiredPosteId ??
      null
    )
  }
}