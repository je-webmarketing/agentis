import type {
  ForecastEvent,
  ForecastEventType,
} from "@/lib/services/ForecastService"

export type ForecastDecisionPriority =
  | "critical"
  | "urgent"
  | "prepare"
  | "preventive"

export type ForecastDecision = {
  id: string
  eventId: string
  type: ForecastEventType
  title: string
  agentId: string | number | null
  agentName: string
  daysRemaining: number
  priority: ForecastDecisionPriority
  context: string
  impact: string
  recommendedAction: string
  actionUrl: string
}

export class ForecastDecisionEngine {
  static build(
    events: ForecastEvent[]
  ): ForecastDecision[] {
    return events
      .map((event) =>
        this.fromEvent(event)
      )
      .sort((first, second) => {
        const priorityDifference =
          this.priorityWeight(
            second.priority
          ) -
          this.priorityWeight(
            first.priority
          )

        if (priorityDifference !== 0) {
          return priorityDifference
        }

        return (
          first.daysRemaining -
          second.daysRemaining
        )
      })
  }

  private static fromEvent(
    event: ForecastEvent
  ): ForecastDecision {
    const priority =
      this.getPriority(
        event.daysRemaining
      )

    return {
      id: `forecast-decision-${event.id}`,
      eventId: event.id,
      type: event.type,
      title: this.getTitle(event),
      agentId: event.agentId,
      agentName: event.agentName,
      daysRemaining:
        event.daysRemaining,
      priority,
      context:
        this.getContext(event),
      impact:
        this.getImpact(event),
      recommendedAction:
        this.getRecommendedAction(
          event
        ),
      actionUrl:
  this.getActionUrl(event),
    }
  }

  private static getPriority(
    daysRemaining: number
  ): ForecastDecisionPriority {
    if (daysRemaining < 0) {
      return "critical"
    }

    if (daysRemaining <= 7) {
      return "urgent"
    }

    if (daysRemaining <= 15) {
      return "prepare"
    }

    return "preventive"
  }

private static getTitle(
  event: ForecastEvent
): string {
  switch (event.type) {
    case "contrat":
      return event.daysRemaining < 0
        ? `Traiter le contrat échu de ${event.agentName}`
        : `Préparer l’échéance du contrat de ${event.agentName}`

    case "visite-medicale":
      return event.daysRemaining < 0
        ? `Régulariser la visite médicale de ${event.agentName}`
        : `Préparer la visite médicale de ${event.agentName}`

    case "habilitation":
      return event.daysRemaining < 0
        ? `Renouveler l’habilitation ${event.label}`
        : `Anticiper le renouvellement de l’habilitation ${event.label}`

    case "formation":
      return event.daysRemaining < 0
        ? `Renouveler la formation ${event.label}`
        : `Préparer le renouvellement de la formation ${event.label}`

    case "absence":
      return event.daysRemaining <= 0
        ? `Traiter l’absence de ${event.agentName}`
        : `Préparer l’absence de ${event.agentName}`
  }
}

  private static getContext(
    event: ForecastEvent
  ): string {
    if (event.daysRemaining < 0) {
      return `${event.title} depuis ${Math.abs(
        event.daysRemaining
      )} jour${
        Math.abs(
          event.daysRemaining
        ) > 1
          ? "s"
          : ""
      }.`
    }

    if (event.daysRemaining === 0) {
      return `${event.title} arrive à échéance aujourd’hui.`
    }

    return `${event.title} dans ${event.daysRemaining} jour${
      event.daysRemaining > 1
        ? "s"
        : ""
    }.`
  }

 private static getImpact(
  event: ForecastEvent
): string {
  switch (event.type) {
    case "contrat":
      return event.daysRemaining < 0
        ? "Le contrat est arrivé à son terme et nécessite une décision RH."
        : "Le contrat arrive prochainement à son terme. Une décision doit être préparée avant l’échéance."

    case "visite-medicale":
      return event.daysRemaining < 0
        ? "La situation médicale administrative doit être régularisée."
        : "La visite médicale approche. Son organisation doit être vérifiée pour éviter un retard."

    case "habilitation":
      return event.daysRemaining < 0
        ? "L’habilitation n’est plus valide et peut empêcher certaines affectations."
        : "L’habilitation approche de son échéance et peut devenir bloquante si elle n’est pas renouvelée."

    case "formation":
      return event.daysRemaining < 0
        ? "La formation est arrivée à échéance et peut nécessiter un renouvellement."
        : "La formation approche de son échéance. Son renouvellement doit être anticipé."

    case "absence":
      return event.daysRemaining <= 0
        ? "L’absence impacte la disponibilité de l’agent et doit être prise en compte dans le planning."
        : "L’absence approche. Il faut vérifier les affectations prévues et anticiper un éventuel besoin de remplacement."
  }
}

  private static getRecommendedAction(
  event: ForecastEvent
): string {
  switch (event.type) {
    case "contrat":
      return event.daysRemaining < 0
        ? "Vérifier immédiatement la situation contractuelle et enregistrer la décision."
        : "Préparer la décision de renouvellement, de prolongation ou de fin de contrat."

    case "visite-medicale":
      return event.daysRemaining < 0
        ? "Programmer ou régulariser la visite médicale dès que possible."
        : "Vérifier la convocation et confirmer la programmation de la visite."

    case "habilitation":
      return event.daysRemaining < 0
        ? `Renouveler l’habilitation ${event.label} avant toute affectation concernée.`
        : `Préparer le renouvellement de l’habilitation ${event.label} avant son échéance.`

    case "formation":
      return event.daysRemaining < 0
        ? `Programmer le renouvellement de la formation ${event.label}.`
        : `Préparer le renouvellement de la formation ${event.label} avant son échéance.`

    case "absence":
      return event.daysRemaining <= 0
        ? "Vérifier la validation de l’absence et contrôler le planning concerné."
        : "Valider l’absence si nécessaire, vérifier les affectations prévues et préparer un remplacement en cas de besoin."
  }
}

  private static priorityWeight(
    priority: ForecastDecisionPriority
  ): number {
    switch (priority) {
      case "critical":
        return 4

      case "urgent":
        return 3

      case "prepare":
        return 2

      case "preventive":
        return 1
    }
  }

 private static getActionUrl(
  event: ForecastEvent
): string {
  if (!event.agentId) {
    return "/dashboard/intelligence"
  }

  const base =
    `/dashboard/agents/${event.agentId}`

  switch (event.type) {
    case "contrat":
      return `${base}?tab=contrat`

    case "visite-medicale":
      return `${base}?tab=visites-medicales`

    case "habilitation":
      return `${base}?tab=habilitations`

    case "formation":
      return `${base}?tab=formations`

    case "absence":
      return `${base}?tab=absences`

    default:
      return base
  }
}
}

export default ForecastDecisionEngine