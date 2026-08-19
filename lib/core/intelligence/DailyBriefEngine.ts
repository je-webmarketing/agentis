import type { AlertCenterResult } from "./AlertCenter"

export type DailyBrief = {
  title: string
  intro: string
  summary: string
  recommendation: string
  confidence: number
}

export class DailyBriefEngine {
  static build(params: {
    agents: number
    alerts: AlertCenterResult
  }): DailyBrief {
    const { agents, alerts } = params

    const intro = `J'ai analysé ${agents} agent${
      agents > 1 ? "s" : ""
    }.`

    if (alerts.critical > 0) {
      const first = alerts.alerts[0]

      return {
        title: "Attention requise",
        intro,
        summary: `${alerts.critical} situation(s) critique(s) détectée(s).`,
        recommendation:
          first?.title ??
          "Traitez les anomalies critiques en priorité.",
        confidence: 98,
      }
    }

    if (alerts.warning > 0) {
      return {
        title: "Organisation sous contrôle",
        intro,
        summary: `${alerts.warning} point(s) de vigilance à surveiller.`,
        recommendation:
          "Traitez les alertes importantes cette semaine.",
        confidence: 94,
      }
    }

    return {
      title: "Organisation stable",
      intro,
      summary:
        "Aucune anomalie critique détectée.",
      recommendation:
        "Aucune action urgente aujourd'hui.",
      confidence: 100,
    }
  }
}

export default DailyBriefEngine