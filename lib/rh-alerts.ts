export type RHAlertLevel = "success" | "warning" | "danger" | "info"

export type RHAlert = {
  level: RHAlertLevel
  title: string
  message: string
  target?: string
}

function daysUntil(dateValue?: string | null) {
  if (!dateValue) return null

  const today = new Date()
  const target = new Date(dateValue)

  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getExpiryAlert({
  title,
  date,
  warningDays = 30,
  target,
}: {
  title: string
  date?: string | null
  warningDays?: number
  target?: string
}): RHAlert | null {
  const days = daysUntil(date)

  if (days === null) return null

  if (days < 0) {
    return {
      level: "danger",
      title,
      message: `Expiré depuis ${Math.abs(days)} jour(s)`,
      target,
    }
  }

  if (days <= warningDays) {
    return {
      level: "warning",
      title,
      message: `Expire dans ${days} jour(s)`,
      target,
    }
  }

  return {
    level: "success",
    title,
    message: `Valide encore ${days} jour(s)`,
    target,
  }
}