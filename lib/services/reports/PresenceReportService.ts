export type PresenceReportRow = {
  id: string | number
  date: string
  statut: string | null
  heure_debut: string | null
  heure_fin: string | null
  service: string | null
  commentaire: string | null
  agent?: {
    id: string | number
    nom: string | null
  } | null
  site?: {
    id: string | number
    nom: string | null
  } | null
}

export type PresenceReportStatus =
  | "present"
  | "absent"
  | "remplacement"
  | "autre"

export type PresenceReportStats = {
  total: number
  presents: number
  absents: number
  replacements: number
  others: number
  attendanceRate: number
  absenceRate: number
  replacementRate: number
}

export type PresenceReportResult = {
  rows: PresenceReportRow[]
  presents: PresenceReportRow[]
  absents: PresenceReportRow[]
  replacements: PresenceReportRow[]
  others: PresenceReportRow[]
  stats: PresenceReportStats
}

function normalizeStatus(value?: string | null) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || ""
  )
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0

  return Math.round((value / total) * 100)
}

export const PresenceReportService = {
  normalizeStatus,

  getStatus(
    status?: string | null
  ): PresenceReportStatus {
    const normalized = normalizeStatus(status)

    if (normalized === "present") {
      return "present"
    }

    if (
      normalized === "absent" ||
      normalized === "absence"
    ) {
      return "absent"
    }

    if (
      normalized === "remplace" ||
      normalized === "remplacement"
    ) {
      return "remplacement"
    }

    return "autre"
  },

  isPresent(status?: string | null) {
    return this.getStatus(status) === "present"
  },

  isAbsent(status?: string | null) {
    return this.getStatus(status) === "absent"
  },

  isReplacement(status?: string | null) {
    return this.getStatus(status) === "remplacement"
  },

  build(
    rows: PresenceReportRow[]
  ): PresenceReportResult {
    const presents: PresenceReportRow[] = []
    const absents: PresenceReportRow[] = []
    const replacements: PresenceReportRow[] = []
    const others: PresenceReportRow[] = []

    rows.forEach((row) => {
      const status = this.getStatus(row.statut)

      if (status === "present") {
        presents.push(row)
        return
      }

      if (status === "absent") {
        absents.push(row)
        return
      }

      if (status === "remplacement") {
        replacements.push(row)
        return
      }

      others.push(row)
    })

    const total = rows.length

    return {
      rows,
      presents,
      absents,
      replacements,
      others,
      stats: {
        total,
        presents: presents.length,
        absents: absents.length,
        replacements: replacements.length,
        others: others.length,
        attendanceRate: percentage(
          presents.length,
          total
        ),
        absenceRate: percentage(
          absents.length,
          total
        ),
        replacementRate: percentage(
          replacements.length,
          total
        ),
      },
    }
  },

  getBadge(status?: string | null) {
    const normalizedStatus =
      this.getStatus(status)

    if (normalizedStatus === "absent") {
      return {
        label: "Absent",
        tone: "red" as const,
      }
    }

    if (
      normalizedStatus === "remplacement"
    ) {
      return {
        label: "Remplacement",
        tone: "violet" as const,
      }
    }

    if (normalizedStatus === "present") {
      return {
        label: "Présent",
        tone: "green" as const,
      }
    }

    return {
      label: status || "Non défini",
      tone: "slate" as const,
    }
  },

  sortRows(rows: PresenceReportRow[]) {
    return [...rows].sort((first, second) => {
      const firstTime =
        first.heure_debut || "99:99"

      const secondTime =
        second.heure_debut || "99:99"

      const timeComparison =
        firstTime.localeCompare(secondTime)

      if (timeComparison !== 0) {
        return timeComparison
      }

      const firstAgent =
        first.agent?.nom || ""

      const secondAgent =
        second.agent?.nom || ""

      return firstAgent.localeCompare(
        secondAgent,
        "fr"
      )
    })
  },

  filterBySearch(
    rows: PresenceReportRow[],
    search: string
  ) {
    const normalizedSearch =
      search
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

    if (!normalizedSearch) {
      return rows
    }

    return rows.filter((row) => {
      const values = [
        row.agent?.nom,
        row.site?.nom,
        row.service,
        row.statut,
        row.commentaire,
      ]

      return values.some((value) =>
        normalizeStatus(value).includes(
          normalizedSearch
        )
      )
    })
  },
}