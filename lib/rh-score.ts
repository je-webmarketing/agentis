export type RHChecklist = {
  coordonnees: boolean
  contrat: boolean
  affectation: boolean
  documents: boolean
  formations: boolean
  habilitations: boolean
  visiteMedicale: boolean
  planning: boolean
}

export function calculateRHScore(data: RHChecklist) {
  let score = 0

  if (data.coordonnees) score += 10
  if (data.contrat) score += 15
  if (data.affectation) score += 15
  if (data.documents) score += 20
  if (data.formations) score += 10
  if (data.habilitations) score += 10
  if (data.visiteMedicale) score += 10
  if (data.planning) score += 10

  return score
}