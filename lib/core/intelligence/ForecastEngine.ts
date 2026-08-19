import type { AlertCenterResult } from "./AlertCenter"

export type ForecastItem = {
  id: string
  title: string
  message: string
  source: string
  daysRemaining: number | null
  severity: "critical" | "warning" | "info"
  actionUrl?: string
}

export type ForecastResult = {
  generatedAt: string
  horizonDays: number
  total: number
  overdue: number
  next7Days: number
  next30Days: number
  items: ForecastItem[]
}

export class ForecastEngine {
  static build(
    alerts: AlertCenterResult,
    horizonDays = 7
  ): ForecastResult {
    const items: ForecastItem[] = []

    for (const alert of alerts.alerts) {
      const daysRemaining =
        this.extractDaysRemaining(alert)

      if (daysRemaining === null) {
        continue
      }

      /*
       * Une échéance dépassée reste visible.
       * Une échéance future n'est affichée que si elle
       * se trouve dans l'horizon demandé.
       */
      if (
        daysRemaining >= 0 &&
        daysRemaining > horizonDays
      ) {
        continue
      }

      items.push({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        source: alert.source,
        daysRemaining,
        severity:
          daysRemaining < 0
            ? "critical"
            : daysRemaining <= 7
              ? "warning"
              : "info",
        actionUrl: alert.actionUrl,
      })
    }

    items.sort((first, second) => {
      const firstDays =
        first.daysRemaining ??
        Number.MAX_SAFE_INTEGER

      const secondDays =
        second.daysRemaining ??
        Number.MAX_SAFE_INTEGER

      return firstDays - secondDays
    })

    return {
      generatedAt: new Date().toISOString(),
      horizonDays,
      total: items.length,

      overdue: items.filter(
        (item) =>
          item.daysRemaining !== null &&
          item.daysRemaining < 0
      ).length,

      next7Days: items.filter(
        (item) =>
          item.daysRemaining !== null &&
          item.daysRemaining >= 0 &&
          item.daysRemaining <= 7
      ).length,

      next30Days: items.filter(
        (item) =>
          item.daysRemaining !== null &&
          item.daysRemaining >= 0 &&
          item.daysRemaining <= 30
      ).length,

      items,
    }
  }

  static headline(
    forecast: ForecastResult
  ): string {
    if (forecast.total === 0) {
      return `Aucune échéance critique détectée dans les ${forecast.horizonDays} prochains jours.`
    }

    if (forecast.overdue > 0) {
      return `${forecast.overdue} situation${
        forecast.overdue > 1 ? "s" : ""
      } déjà échue${
        forecast.overdue > 1 ? "s" : ""
      } nécessite${
        forecast.overdue > 1 ? "nt" : ""
      } une action.`
    }

    return `${forecast.total} échéance${
      forecast.total > 1 ? "s" : ""
    } à anticiper dans les ${forecast.horizonDays} prochains jours.`
  }

  private static extractDaysRemaining(
    alert: AlertCenterResult["alerts"][number]
  ): number | null {
    const message = (
      alert.message || ""
    ).trim()

    const normalized =
      message.toLowerCase()

    /*
     * IMPORTANT :
     * on ignore les phrases de conformité comme :
     *
     * "Aucun contrat expiré..."
     * "Aucune visite médicale échue..."
     *
     * Elles ne représentent pas une échéance.
     */
    if (
      /\baucun(?:e|s|es)?\b/i.test(
        normalized
      )
    ) {
      return null
    }

    /*
     * Cas :
     * "expiré depuis 12 jours"
     * "échue depuis 5 jours"
     */
    const overdueMatch =
      normalized.match(
        /(?:expir(?:é|ée|és|ées)|échu(?:e|s|es)?)\s+depuis\s+(\d+)\s+jour/i
      )

    if (overdueMatch) {
      return -Number(overdueMatch[1])
    }

    /*
     * Cas :
     * "dans 5 jours"
     * "sous 7 jours"
     */
    const remainingMatch =
      normalized.match(
        /(?:dans|sous)\s+(\d+)\s+jour/i
      )

    if (remainingMatch) {
      return Number(
        remainingMatch[1]
      )
    }

    /*
     * Cas avec date ISO réelle :
     *
     * "habilitation expirée le 2026-07-20"
     * "contrat arrive à échéance le 2026-08-15"
     * "visite prévue le 2026-08-12"
     */
    const isoDateMatch =
      message.match(
        /\b(\d{4}-\d{2}-\d{2})\b/
      )

    if (isoDateMatch) {
      return this.daysUntil(
        isoDateMatch[1]
      )
    }

    return null
  }

  private static daysUntil(
    isoDate: string
  ): number | null {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const target = new Date(
      `${isoDate}T12:00:00`
    )

    if (
      Number.isNaN(
        target.getTime()
      )
    ) {
      return null
    }

    return Math.ceil(
      (target.getTime() -
        today.getTime()) /
        86_400_000
    )
  }
}

export default ForecastEngine