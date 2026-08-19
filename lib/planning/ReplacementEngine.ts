export type ReplacementCriterionKey =
  | "availability"
  | "sameSite"
  | "samePosition"
  | "habilitation"
  | "formation"
  | "medicalVisit"
  | "contract"
  | "sameService"
  | "workload"
  | "distance"

export type ReplacementWeights = Record<
  ReplacementCriterionKey,
  number
>

export type ReplacementCandidate = {
  agentId: string | number
  name: string

  siteId?: string | number | null
  positionId?: string | number | null
  serviceId?: string | number | null

  available: boolean
  hasAbsence?: boolean
  hasPlanningConflict?: boolean

  hasValidHabilitation?: boolean
  hasRequiredFormation?: boolean
  hasValidMedicalVisit?: boolean
  hasActiveContract?: boolean

  workedMinutesToday?: number
  maxMinutesPerDay?: number

  distanceKm?: number | null

  metadata?: Record<string, unknown>
}

export type ReplacementContext = {
  date: string
  siteId: string | number
  slotKey: string

  positionId?: string | number | null
  serviceId?: string | number | null

  requiresHabilitation?: boolean
  requiresFormation?: boolean
  requiresMedicalVisit?: boolean
  requiresActiveContract?: boolean

  maxDistanceKm?: number | null

  excludeAgentIds?: Array<string | number>
}

export type ReplacementCriterionResult = {
  key: ReplacementCriterionKey
  label: string
  matched: boolean
  required: boolean
  points: number
  maxPoints: number
  message: string
}

export type ReplacementRecommendation = {
  rank: number
  agentId: string | number
  name: string

  score: number
  level:
    | "excellent"
    | "very_good"
    | "compatible"
    | "review"

  eligible: boolean
  blockedReasons: string[]

  positives: ReplacementCriterionResult[]
  warnings: ReplacementCriterionResult[]
  criteria: ReplacementCriterionResult[]

  candidate: ReplacementCandidate
}

export type ReplacementEngineOptions = {
  weights?: Partial<ReplacementWeights>

  hardBlockOnConflict?: boolean
  hardBlockOnAbsence?: boolean
  hardBlockOnUnavailable?: boolean

  hardBlockMissingHabilitation?: boolean
  hardBlockMissingFormation?: boolean
  hardBlockInvalidMedicalVisit?: boolean
  hardBlockInactiveContract?: boolean

  minimumScore?: number
}

const DEFAULT_WEIGHTS: ReplacementWeights = {
  availability: 30,
  sameSite: 12,
  samePosition: 15,
  habilitation: 10,
  formation: 8,
  medicalVisit: 8,
  contract: 7,
  sameService: 5,
  workload: 3,
  distance: 2,
}

const DEFAULT_OPTIONS: Required<
  Omit<ReplacementEngineOptions, "weights">
> = {
  hardBlockOnConflict: true,
  hardBlockOnAbsence: true,
  hardBlockOnUnavailable: true,

  hardBlockMissingHabilitation: false,
  hardBlockMissingFormation: false,
  hardBlockInvalidMedicalVisit: false,
  hardBlockInactiveContract: false,

  minimumScore: 0,
}

function sameValue(
  left: string | number | null | undefined,
  right: string | number | null | undefined
) {
  if (
    left === null ||
    left === undefined ||
    right === null ||
    right === undefined
  ) {
    return false
  }

  return String(left) === String(right)
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function getLevel(
  score: number
): ReplacementRecommendation["level"] {
  if (score >= 85) return "excellent"
  if (score >= 70) return "very_good"
  if (score >= 55) return "compatible"
  return "review"
}

function createCriterion(params: {
  key: ReplacementCriterionKey
  label: string
  matched: boolean
  required?: boolean
  points: number
  maxPoints: number
  message: string
}): ReplacementCriterionResult {
  return {
    key: params.key,
    label: params.label,
    matched: params.matched,
    required: params.required ?? false,
    points: params.matched ? params.points : 0,
    maxPoints: params.maxPoints,
    message: params.message,
  }
}

export default class ReplacementEngine {
  static getDefaultWeights(): ReplacementWeights {
    return { ...DEFAULT_WEIGHTS }
  }

  static evaluateCandidate(
    candidate: ReplacementCandidate,
    context: ReplacementContext,
    options: ReplacementEngineOptions = {}
  ): ReplacementRecommendation {
    const weights: ReplacementWeights = {
      ...DEFAULT_WEIGHTS,
      ...(options.weights || {}),
    }

    const resolvedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    }

    const blockedReasons: string[] = []

    const isExcluded = (context.excludeAgentIds || []).some(
      (agentId) =>
        String(agentId) === String(candidate.agentId)
    )

    if (isExcluded) {
      blockedReasons.push("Agent exclu de cette recherche")
    }

    if (
      resolvedOptions.hardBlockOnUnavailable &&
      !candidate.available
    ) {
      blockedReasons.push("Agent indisponible")
    }

    if (
      resolvedOptions.hardBlockOnAbsence &&
      candidate.hasAbsence === true
    ) {
      blockedReasons.push("Absence déclarée")
    }

    if (
      resolvedOptions.hardBlockOnConflict &&
      candidate.hasPlanningConflict === true
    ) {
      blockedReasons.push(
        "Déjà affecté sur ce créneau"
      )
    }

    if (
      context.requiresHabilitation &&
      resolvedOptions.hardBlockMissingHabilitation &&
      candidate.hasValidHabilitation !== true
    ) {
      blockedReasons.push(
        "Habilitation obligatoire absente ou expirée"
      )
    }

    if (
      context.requiresFormation &&
      resolvedOptions.hardBlockMissingFormation &&
      candidate.hasRequiredFormation !== true
    ) {
      blockedReasons.push(
        "Formation obligatoire absente"
      )
    }

    if (
      context.requiresMedicalVisit &&
      resolvedOptions.hardBlockInvalidMedicalVisit &&
      candidate.hasValidMedicalVisit !== true
    ) {
      blockedReasons.push(
        "Visite médicale invalide ou échue"
      )
    }

    if (
      context.requiresActiveContract &&
      resolvedOptions.hardBlockInactiveContract &&
      candidate.hasActiveContract !== true
    ) {
      blockedReasons.push(
        "Contrat actif non confirmé"
      )
    }

    const workloadLimit =
      candidate.maxMinutesPerDay ?? 0

    const workedMinutes =
      candidate.workedMinutesToday ?? 0

    const workloadOk =
      workloadLimit <= 0 ||
      workedMinutes < workloadLimit

    const distanceLimit =
      context.maxDistanceKm ?? null

    const distanceKnown =
      candidate.distanceKm !== null &&
      candidate.distanceKm !== undefined

    const distanceOk =
      distanceLimit === null ||
      !distanceKnown ||
      (candidate.distanceKm as number) <=
        distanceLimit

    const criteria: ReplacementCriterionResult[] = [
      createCriterion({
        key: "availability",
        label: "Disponibilité",
        matched:
          candidate.available &&
          candidate.hasAbsence !== true &&
          candidate.hasPlanningConflict !== true,
        required: true,
        points: weights.availability,
        maxPoints: weights.availability,
        message:
          candidate.hasPlanningConflict === true
            ? "Agent déjà affecté sur ce créneau"
            : candidate.hasAbsence === true
              ? "Absence déclarée"
              : candidate.available
                ? "Disponible sur ce créneau"
                : "Indisponible",
      }),

      createCriterion({
        key: "sameSite",
        label: "Structure",
        matched: sameValue(
          candidate.siteId,
          context.siteId
        ),
        points: weights.sameSite,
        maxPoints: weights.sameSite,
        message: sameValue(
          candidate.siteId,
          context.siteId
        )
          ? "Même structure principale"
          : "Autre structure principale",
      }),

      createCriterion({
        key: "samePosition",
        label: "Poste",
        matched: sameValue(
          candidate.positionId,
          context.positionId
        ),
        required:
          context.positionId !== null &&
          context.positionId !== undefined,
        points: weights.samePosition,
        maxPoints: weights.samePosition,
        message: sameValue(
          candidate.positionId,
          context.positionId
        )
          ? "Même poste"
          : context.positionId
            ? "Poste différent ou non renseigné"
            : "Poste cible non défini",
      }),

      createCriterion({
        key: "habilitation",
        label: "Habilitation",
        matched:
          candidate.hasValidHabilitation === true,
        required:
          context.requiresHabilitation === true,
        points: weights.habilitation,
        maxPoints: weights.habilitation,
        message:
          candidate.hasValidHabilitation === true
            ? "Habilitation valide"
            : context.requiresHabilitation
              ? "Habilitation obligatoire absente ou expirée"
              : "Aucune habilitation valide enregistrée",
      }),

      createCriterion({
        key: "formation",
        label: "Formation",
        matched:
          candidate.hasRequiredFormation === true,
        required:
          context.requiresFormation === true,
        points: weights.formation,
        maxPoints: weights.formation,
        message:
          candidate.hasRequiredFormation === true
            ? "Formation adaptée enregistrée"
            : context.requiresFormation
              ? "Formation obligatoire absente"
              : "Aucune formation adaptée enregistrée",
      }),

      createCriterion({
        key: "medicalVisit",
        label: "Visite médicale",
        matched:
          candidate.hasValidMedicalVisit === true,
        required:
          context.requiresMedicalVisit === true,
        points: weights.medicalVisit,
        maxPoints: weights.medicalVisit,
        message:
          candidate.hasValidMedicalVisit === true
            ? "Visite médicale valide"
            : context.requiresMedicalVisit
              ? "Visite médicale obligatoire absente ou échue"
              : "Visite médicale absente ou échue",
      }),

      createCriterion({
        key: "contract",
        label: "Contrat",
        matched:
          candidate.hasActiveContract === true,
        required:
          context.requiresActiveContract === true,
        points: weights.contract,
        maxPoints: weights.contract,
        message:
          candidate.hasActiveContract === true
            ? "Contrat actif confirmé"
            : context.requiresActiveContract
              ? "Contrat actif obligatoire non confirmé"
              : "Contrat actif non confirmé",
      }),

      createCriterion({
        key: "sameService",
        label: "Service",
        matched: sameValue(
          candidate.serviceId,
          context.serviceId
        ),
        points: weights.sameService,
        maxPoints: weights.sameService,
        message: sameValue(
          candidate.serviceId,
          context.serviceId
        )
          ? "Même service"
          : context.serviceId
            ? "Autre service"
            : "Service cible non défini",
      }),

      createCriterion({
        key: "workload",
        label: "Charge de travail",
        matched: workloadOk,
        points: weights.workload,
        maxPoints: weights.workload,
        message: workloadOk
          ? "Charge de travail compatible"
          : "Durée journalière maximale atteinte",
      }),

      createCriterion({
        key: "distance",
        label: "Distance",
        matched: distanceOk,
        points: weights.distance,
        maxPoints: weights.distance,
        message:
          !distanceKnown
            ? "Distance non renseignée"
            : distanceOk
              ? `${candidate.distanceKm} km`
              : `Distance supérieure à ${distanceLimit} km`,
      }),
    ]

    const totalPossible = criteria.reduce(
      (total, criterion) =>
        total + criterion.maxPoints,
      0
    )

    const totalEarned = criteria.reduce(
      (total, criterion) =>
        total + criterion.points,
      0
    )

    const score =
      totalPossible <= 0
        ? 0
        : clampScore(
            (totalEarned / totalPossible) * 100
          )

    const eligible =
      blockedReasons.length === 0 &&
      score >= resolvedOptions.minimumScore

    const positives = criteria.filter(
      (criterion) => criterion.matched
    )

    const warnings = criteria.filter(
      (criterion) => !criterion.matched
    )

    return {
      rank: 0,
      agentId: candidate.agentId,
      name: candidate.name,
      score,
      level: getLevel(score),
      eligible,
      blockedReasons,
      positives,
      warnings,
      criteria,
      candidate,
    }
  }

  static rankCandidates(
    candidates: ReplacementCandidate[],
    context: ReplacementContext,
    options: ReplacementEngineOptions = {}
  ): ReplacementRecommendation[] {
    return candidates
      .map((candidate) =>
        this.evaluateCandidate(
          candidate,
          context,
          options
        )
      )
      .sort((left, right) => {
        if (left.eligible !== right.eligible) {
          return left.eligible ? -1 : 1
        }

        if (left.score !== right.score) {
          return right.score - left.score
        }

        return left.name.localeCompare(
          right.name,
          "fr"
        )
      })
      .map((recommendation, index) => ({
        ...recommendation,
        rank: index + 1,
      }))
  }

  static getEligibleCandidates(
    candidates: ReplacementCandidate[],
    context: ReplacementContext,
    options: ReplacementEngineOptions = {}
  ): ReplacementRecommendation[] {
    return this.rankCandidates(
      candidates,
      context,
      options
    ).filter(
      (recommendation) =>
        recommendation.eligible
    )
  }

  static getBestCandidate(
    candidates: ReplacementCandidate[],
    context: ReplacementContext,
    options: ReplacementEngineOptions = {}
  ): ReplacementRecommendation | null {
    return (
      this.getEligibleCandidates(
        candidates,
        context,
        options
      )[0] || null
    )
  }
}