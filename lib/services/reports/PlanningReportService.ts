export type PlanningReportRow = {
  id: string | number
  date: string
  heure_debut: string | null
  heure_fin: string | null
  service: string | null
  statut: string | null
  commentaire: string | null
  agent_id: string | number | null
  site_id: string | number | null
  est_poste_vacant?: boolean | null
  agent?: {
    id: string | number
    nom: string | null
  } | null
  site?: {
    id: string | number
    nom: string | null
  } | null
}

export type PlanningReportStatus =
  | "present"
  | "absent"
  | "remplacement"
  | "vacant"
  | "autre"

export type PlanningReportStats = {
  total: number
  presents: number
  absents: number
  replacements: number
  vacancies: number
  others: number
  presenceRate: number
  absenceRate: number
  replacementRate: number
  vacancyRate: number
}

export type PlanningReportResult = {
  rows: PlanningReportRow[]
  presents: PlanningReportRow[]
  absents: PlanningReportRow[]
  replacements: PlanningReportRow[]
  vacancies: PlanningReportRow[]
  others: PlanningReportRow[]
  stats: PlanningReportStats
}

function normalize(value?: string | null) {
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

export const PlanningReportService = {
  normalize,

  isVacant(row: PlanningReportRow) {
    return (
      row.est_poste_vacant === true ||
      row.agent_id === null
    )
  },

  getStatus(
    row: PlanningReportRow
  ): PlanningReportStatus {
    if (this.isVacant(row)) {
      return "vacant"
    }

    const status = normalize(row.statut)

    if (status === "present") {
      return "present"
    }

    if (
      status === "absent" ||
      status === "absence"
    ) {
      return "absent"
    }

    if (
      status === "remplace" ||
      status === "remplacement"
    ) {
      return "remplacement"
    }

    return "autre"
  },

  isPresent(row: PlanningReportRow) {
    return this.getStatus(row) === "present"
  },

  isAbsent(row: PlanningReportRow) {
    return this.getStatus(row) === "absent"
  },

  isReplacement(row: PlanningReportRow) {
    return this.getStatus(row) === "remplacement"
  },

  build(
    rows: PlanningReportRow[]
  ): PlanningReportResult {
    const presents: PlanningReportRow[] = []
    const absents: PlanningReportRow[] = []
    const replacements: PlanningReportRow[] = []
    const vacancies: PlanningReportRow[] = []
    const others: PlanningReportRow[] = []

    rows.forEach((row) => {
      const status = this.getStatus(row)

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

      if (status === "vacant") {
        vacancies.push(row)
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
      vacancies,
      others,
      stats: {
        total,
        presents: presents.length,
        absents: absents.length,
        replacements: replacements.length,
        vacancies: vacancies.length,
        others: others.length,
        presenceRate: percentage(
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
        vacancyRate: percentage(
          vacancies.length,
          total
        ),
      },
    }
  },

  getBadge(row: PlanningReportRow) {
    const status = this.getStatus(row)

    if (status === "vacant") {
      return {
        label: "Poste vacant",
        tone: "yellow" as const,
      }
    }

    if (status === "absent") {
      return {
        label: "Absent",
        tone: "red" as const,
      }
    }

    if (status === "remplacement") {
      return {
        label: "Remplacement",
        tone: "violet" as const,
      }
    }

    if (status === "present") {
      return {
        label: row.statut || "Présent",
        tone: "green" as const,
      }
    }

    return {
      label: row.statut || "Non défini",
      tone: "slate" as const,
    }
  },

  sortRows(rows: PlanningReportRow[]) {
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

      const firstSite =
        first.site?.nom || ""

      const secondSite =
        second.site?.nom || ""

      const siteComparison =
        firstSite.localeCompare(secondSite, "fr")

      if (siteComparison !== 0) {
        return siteComparison
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

  filterRows(
    rows: PlanningReportRow[],
    filters: {
      search?: string
      siteId?: string
      status?: string
    }
  ) {
    const normalizedSearch =
      normalize(filters.search)

    return rows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          row.agent?.nom,
          row.site?.nom,
          row.service,
          row.statut,
          row.commentaire,
        ].some((value) =>
          normalize(value).includes(
            normalizedSearch
          )
        )

      const matchesSite =
        !filters.siteId ||
        filters.siteId === "tous" ||
        String(row.site_id) === filters.siteId

      const status = this.getStatus(row)

      const matchesStatus =
        !filters.status ||
        filters.status === "tous" ||
        filters.status === status

      return (
        matchesSearch &&
        matchesSite &&
        matchesStatus
      )
    })
  },

  toCsvRows(rows: PlanningReportRow[]) {
    return rows.map((row) => ({
      date: row.date,
      heure_debut: row.heure_debut || "",
      heure_fin: row.heure_fin || "",
      agent: this.isVacant(row)
        ? "Poste vacant"
        : row.agent?.nom || "",
      site: row.site?.nom || "",
      service: row.service || "",
      statut: this.getBadge(row).label,
      commentaire: row.commentaire || "",
    }))
  },
}