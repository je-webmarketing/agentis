export type PlanningStats = {
  total: number
  presents: number
  remplaces: number
  vacants: number
  couverture: number
}

type PlanningRow = {
  statut: string | null
  est_poste_vacant?: boolean | null
}

export const PlanningStatsService = {
  compute(rows: PlanningRow[]): PlanningStats {
    const total = rows.length

    const vacants = rows.filter(
      (row) => row.est_poste_vacant === true
    ).length

    const remplaces = rows.filter(
      (row) => row.statut === "Remplacé"
    ).length

    const presents = rows.filter(
      (row) =>
        row.statut === "Présent" &&
        row.est_poste_vacant !== true
    ).length

    const couverture =
      total === 0
        ? 100
        : Math.round(((total - vacants) / total) * 100)

    return {
      total,
      presents,
      remplaces,
      vacants,
      couverture,
    }
  },
}