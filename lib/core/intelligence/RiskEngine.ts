import type { AgentisAuditCheck } from "../types"

export type AgentisRiskLevel =
  | "blocking"
  | "critical"
  | "important"
  | "moderate"

export type AgentisRiskAssessment = {
  level: AgentisRiskLevel
  score: number
  context: string
  impact: string
  recommendedAction: string
}

export class RiskEngine {
  static evaluate(
    check: AgentisAuditCheck
  ): AgentisRiskAssessment {
    const daysRemaining =
      this.getMetadataNumber(
        check,
        "daysRemaining"
      )

    switch (check.module) {
      case "habilitations":
        return this.evaluateHabilitation(
          check,
          daysRemaining
        )

      case "visites-medicales":
        return this.evaluateMedicalVisit(
          check,
          daysRemaining
        )

      case "agents":
        return this.evaluateContract(
          check,
          daysRemaining
        )

      case "formations":
        return this.evaluateFormation(
          check,
          daysRemaining
        )

      case "planning":
        return {
          level:
            check.status === "error"
              ? "blocking"
              : "important",
          score:
            check.status === "error"
              ? 100
              : 70,
          context:
            "Une anomalie a été détectée dans le planning.",
          impact:
            "Cette situation peut provoquer une affectation impossible, un conflit horaire ou un poste non couvert.",
          recommendedAction:
            "Vérifier et corriger l’affectation concernée.",
        }

      default:
        return this.evaluateDefault(check)
    }
  }

  private static evaluateHabilitation(
    check: AgentisAuditCheck,
    daysRemaining: number | null
  ): AgentisRiskAssessment {
    if (
      check.status === "error" ||
      (daysRemaining !== null &&
        daysRemaining < 0)
    ) {
      return {
        level: "blocking",
        score: 100,
        context:
          "L’habilitation nécessaire à certaines missions n’est plus valide.",
        impact:
          "L’agent peut devenir inéligible à une affectation nécessitant cette habilitation.",
        recommendedAction:
          "Renouveler l’habilitation avant toute nouvelle affectation concernée.",
      }
    }

    return {
      level: "important",
      score: 75,
      context:
        "Une habilitation arrive prochainement à expiration.",
      impact:
        "Sans renouvellement, certaines futures affectations pourraient être bloquées.",
      recommendedAction:
        "Programmer le renouvellement de l’habilitation.",
    }
  }

  private static evaluateMedicalVisit(
    check: AgentisAuditCheck,
    daysRemaining: number | null
  ): AgentisRiskAssessment {
    if (
      check.status === "error" ||
      (daysRemaining !== null &&
        daysRemaining < 0)
    ) {
      return {
        level: "critical",
        score: 95,
        context:
          "La prochaine visite médicale enregistrée est dépassée.",
        impact:
          "La situation nécessite une vérification RH avant de confirmer la conformité de l’agent.",
        recommendedAction:
          "Programmer une visite médicale et mettre à jour le dossier.",
      }
    }

    return {
      level: "important",
      score: 70,
      context:
        "Une visite médicale approche de son échéance.",
      impact:
        "Un retard de planification pourrait créer une situation de non-conformité.",
      recommendedAction:
        "Planifier la visite médicale avant son échéance.",
    }
  }

  private static evaluateContract(
    check: AgentisAuditCheck,
    daysRemaining: number | null
  ): AgentisRiskAssessment {
    if (
      check.status === "error" ||
      (daysRemaining !== null &&
        daysRemaining < 0)
    ) {
      return {
        level: "critical",
        score: 95,
        context:
          "Le contrat enregistré est arrivé à expiration.",
        impact:
          "La situation administrative de l’agent doit être vérifiée avant de poursuivre ses affectations.",
        recommendedAction:
          "Contrôler le contrat et enregistrer son renouvellement ou sa clôture.",
      }
    }

    return {
      level: "important",
      score: 70,
      context:
        "Le contrat arrive prochainement à échéance.",
      impact:
        "Sans anticipation, la continuité des affectations de l’agent peut être perturbée.",
      recommendedAction:
        "Préparer le renouvellement ou la fin du contrat.",
    }
  }

  private static evaluateFormation(
    check: AgentisAuditCheck,
    daysRemaining: number | null
  ): AgentisRiskAssessment {
    if (
      check.status === "error" ||
      (daysRemaining !== null &&
        daysRemaining < 0)
    ) {
      return {
        level: "critical",
        score: 90,
        context:
          "Une formation obligatoire ou utile au poste est expirée.",
        impact:
          "L’agent peut ne plus répondre aux prérequis de certaines missions.",
        recommendedAction:
          "Inscrire l’agent à une session de renouvellement.",
      }
    }

    return {
      level: "moderate",
      score: 60,
      context:
        "Une formation arrive prochainement à expiration.",
      impact:
        "Une absence d’anticipation peut limiter les futures possibilités d’affectation.",
      recommendedAction:
        "Planifier le renouvellement de la formation.",
    }
  }

  private static evaluateDefault(
    check: AgentisAuditCheck
  ): AgentisRiskAssessment {
    if (check.status === "error") {
      return {
        level: "critical",
        score: 85,
        context:
          "Une anomalie nécessitant une action a été détectée.",
        impact:
          "Cette anomalie peut affecter la conformité ou l’organisation RH.",
        recommendedAction:
          "Ouvrir le contrôle et corriger les données concernées.",
      }
    }

    return {
      level: "moderate",
      score: 50,
      context:
        "Un point de vigilance a été détecté.",
      impact:
        "La situation doit être suivie afin d’éviter une anomalie future.",
      recommendedAction:
        "Examiner le contrôle et planifier l’action adaptée.",
    }
  }

  private static getMetadataNumber(
    check: AgentisAuditCheck,
    key: string
  ): number | null {
    const value = check.metadata?.[key]

    return typeof value === "number" &&
      Number.isFinite(value)
      ? value
      : null
  }
}