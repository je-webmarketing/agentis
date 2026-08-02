import AvailabilityEngine from "@/lib/services/AvailabilityEngine"
import { supabase } from "@/lib/supabase"

type ValidateAssignmentPayload = {
  agent_id: string | number
  date: string
  heure_debut?: string | null
  heure_fin?: string | null
  excludeAssignmentId?: string | number | null
}

export type ValidateAssignmentResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export const PlanningValidator = {
  async validateAssignment(
    payload: ValidateAssignmentPayload
  ): Promise<ValidateAssignmentResult> {
    const errors: string[] = []
    const warnings: string[] = []

    validatePayload(payload)

    /*
     * 1. Contrôle bloquant de disponibilité RH.
     *
     * Un agent absent, en congé, en RTT, en maladie
     * ou dans toute autre absence non refusée ne peut
     * jamais être affecté sur cette journée.
     */
    try {
      const availability =
        await AvailabilityEngine.checkAgentAvailability(
          payload.agent_id,
          payload.date
        )

      if (!availability.available) {
        errors.push(
          `Cet agent est indisponible : ${
            availability.reason ||
            "une absence couvre cette date"
          }.`
        )
      }
    } catch (error: unknown) {
      throw new Error(
        getErrorMessage(
          error,
          "Impossible de contrôler la disponibilité de l’agent."
        )
      )
    }

    /*
     * 2. Contrôle des conflits de planning.
     */
    let planningQuery = supabase
      .from("planning_journalier")
      .select(`
        id,
        date,
        heure_debut,
        heure_fin,
        statut,
        est_poste_vacant
      `)
      .eq("agent_id", payload.agent_id)
      .eq("date", payload.date)

    if (
      payload.excludeAssignmentId !== null &&
      payload.excludeAssignmentId !== undefined
    ) {
      planningQuery = planningQuery.neq(
        "id",
        payload.excludeAssignmentId
      )
    }

    const {
      data: existingPlanning,
      error: planningError,
    } = await planningQuery

    if (planningError) {
      throw new Error(
        `Impossible de contrôler les conflits de planning : ${planningError.message}`
      )
    }

    const activeAssignments =
      (existingPlanning || []).filter(
        (item) =>
          item.est_poste_vacant !== true &&
          !isAbsenceStatus(item.statut)
      )

    if (activeAssignments.length > 0) {
      const exactConflict =
        activeAssignments.find((item) =>
          hasTimeConflict(
            payload.heure_debut,
            payload.heure_fin,
            item.heure_debut,
            item.heure_fin
          )
        )

      if (exactConflict) {
        errors.push(
          "Cet agent est déjà affecté sur un créneau qui chevauche cet horaire."
        )
      } else {
        warnings.push(
          "Cet agent possède déjà une autre affectation ce jour-là."
        )
      }
    }

    /*
     * 3. Contrôle du contrat.
     */
    const { data: contrats, error: contratsError } =
      await supabase
        .from("agent_contrats")
        .select("*")
        .eq("agent_id", payload.agent_id)

    if (contratsError) {
      warnings.push(
        "Le contrat de l’agent n’a pas pu être vérifié."
      )
    } else if (!contrats || contrats.length === 0) {
      warnings.push(
        "Aucun contrat enregistré pour cet agent."
      )
    } else if (
      !hasActiveContract(
        contrats as Record<string, unknown>[],
        payload.date
      )
    ) {
      errors.push(
        "Aucun contrat actif ne couvre cette date."
      )
    }

    /*
     * 4. Contrôle de la visite médicale.
     */
    const { data: visites, error: visitesError } =
      await supabase
        .from("agent_visites_medicales")
        .select(`
          prochaine_visite,
          aptitude
        `)
        .eq("agent_id", payload.agent_id)

    if (visitesError) {
      warnings.push(
        "La visite médicale de l’agent n’a pas pu être vérifiée."
      )
    } else if (!visites || visites.length === 0) {
      warnings.push(
        "Aucune visite médicale enregistrée pour cet agent."
      )
    } else {
      const hasInaptitude = visites.some(
        (visite) =>
          String(visite.aptitude || "")
            .trim()
            .toLowerCase()
            .includes("inapte")
      )

      if (hasInaptitude) {
        errors.push(
          "Cet agent est déclaré inapte et ne peut pas être affecté."
        )
      } else {
        const validVisit = visites.some(
          (visite) =>
            !visite.prochaine_visite ||
            visite.prochaine_visite >=
              payload.date
        )

        if (!validVisit) {
          warnings.push(
            "La visite médicale de cet agent semble échue."
          )
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: Array.from(new Set(errors)),
      warnings: Array.from(
        new Set(warnings)
      ),
    }
  },
}

export default PlanningValidator

function validatePayload(
  payload: ValidateAssignmentPayload
) {
  if (!payload.agent_id) {
    throw new Error(
      "L’identifiant de l’agent est obligatoire."
    )
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      payload.date
    ) ||
    Number.isNaN(
      new Date(
        `${payload.date}T12:00:00`
      ).getTime()
    )
  ) {
    throw new Error(
      "La date de l’affectation est invalide."
    )
  }

  if (
    payload.heure_debut &&
    payload.heure_fin &&
    toMinutes(payload.heure_debut) >=
      toMinutes(payload.heure_fin)
  ) {
    throw new Error(
      "L’heure de fin doit être postérieure à l’heure de début."
    )
  }
}

function hasTimeConflict(
  newStart?: string | null,
  newEnd?: string | null,
  existingStart?: string | null,
  existingEnd?: string | null
) {
  if (
    !newStart ||
    !newEnd ||
    !existingStart ||
    !existingEnd
  ) {
    return true
  }

  const startA = toMinutes(newStart)
  const endA = toMinutes(newEnd)
  const startB = toMinutes(existingStart)
  const endB = toMinutes(existingEnd)

  return startA < endB && startB < endA
}

function toMinutes(value: string) {
  const [hours, minutes] = value
    .slice(0, 5)
    .split(":")
    .map(Number)

  return hours * 60 + minutes
}

function isAbsenceStatus(
  status?: string | null
) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()

  return (
    normalized === "absent" ||
    normalized === "absence"
  )
}

function hasActiveContract(
  contracts: Record<string, unknown>[],
  referenceDate: string
) {
  return contracts.some((contract) => {
    const startDate = getFirstDate(
      contract,
      [
        "date_debut",
        "date_debut_contrat",
        "debut_contrat",
      ]
    )

    const endDate = getFirstDate(
      contract,
      [
        "date_fin",
        "date_fin_contrat",
        "fin_contrat",
        "date_echeance",
      ]
    )

    const startsBeforeDate =
      !startDate ||
      startDate <= referenceDate

    const endsAfterDate =
      !endDate ||
      endDate >= referenceDate

    return (
      startsBeforeDate &&
      endsAfterDate
    )
  })
}

function getFirstDate(
  record: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {
      return value.slice(0, 10)
    }
  }

  return null
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return fallback
}