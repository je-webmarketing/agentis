import type {
  PlanningRequirementRoleKey,
} from "@/lib/services/PlanningRequirementsService"

function normalizeRoleLabel(
  value: string | null | undefined
) {
  return value
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim() ?? ""
}

export function mapPosteToRequirementRole(
  posteName: string | null | undefined
): PlanningRequirementRoleKey | null {
  const normalized =
    normalizeRoleLabel(
      posteName
    )

  if (!normalized) {
    return null
  }

  if (
    normalized.includes(
      "surveillant"
    )
  ) {
    return "surveillant"
  }

  if (
    normalized.includes(
      "enseignant"
    ) ||
    normalized.includes(
      "instituteur"
    )
  ) {
    return "enseignant"
  }

  if (
    normalized.includes(
      "atsem"
    )
  ) {
    return "atsem"
  }

  if (
    normalized.includes(
      "cuisinier"
    )
  ) {
    return "cuisinier"
  }

  if (
    normalized.includes(
      "restauration"
    )
  ) {
    return "agent_restauration"
  }

  if (
    normalized.includes(
      "animateur"
    )
  ) {
    return "animateur"
  }

  if (
    normalized.includes(
      "agent technique"
    ) ||
    normalized.includes(
      "technique"
    )
  ) {
    return "agent_technique"
  }

  return null
}