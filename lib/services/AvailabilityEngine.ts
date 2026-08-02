import { supabase } from "@/lib/supabase"

export type AvailabilityResult = {
  available: boolean
  reason: string | null
  absenceId: string | number | null
}

export type ReleasedAssignment = {
  id: string | number
  date: string
  site_id: string | number | null
  service: string | null
  heure_debut: string | null
  heure_fin: string | null
}

export type AbsenceProcessingResult = {
  absenceId: string | number
  agentId: string | number
  startDate: string
  endDate: string
  releasedCount: number
  releasedAssignments: ReleasedAssignment[]
}

type AbsenceRow = {
  id: string | number
  agent_id: string | number
  type: string | null
  date_debut: string
  date_fin: string
  statut_validation: string | null
}

type PlanningAssignmentRow = ReleasedAssignment & {
  agent_id: string | number | null
  agent_initial_id: string | number | null
  statut: string | null
  commentaire: string | null
  est_poste_vacant: boolean | null
}

export const AvailabilityEngine = {
  async checkAgentAvailability(
    agentId: string | number,
    date: string,
    excludeAbsenceId?: string | number
  ): Promise<AvailabilityResult> {
    validateIsoDate(date, "La date d’affectation")

    let query = supabase
      .from("absences")
      .select("id,type,date_debut,date_fin,statut_validation")
      .eq("agent_id", agentId)
      .neq("statut_validation", "Refusée")
      .lte("date_debut", date)
      .gte("date_fin", date)
      .order("date_debut", { ascending: true })
      .limit(1)

    if (excludeAbsenceId !== undefined) {
      query = query.neq("id", excludeAbsenceId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(
        `Impossible de vérifier la disponibilité de l’agent : ${error.message}`
      )
    }

    if (!data?.length) {
      return {
        available: true,
        reason: null,
        absenceId: null,
      }
    }

    const absence = data[0]

    return {
      available: false,
      reason: `${absence.type ?? "Absence"} du ${formatDate(
        absence.date_debut
      )} au ${formatDate(absence.date_fin)}`,
      absenceId: absence.id,
    }
  },

  async ensureAvailable(
    agentId: string | number,
    date: string,
    excludeAbsenceId?: string | number
  ) {
    const result = await this.checkAgentAvailability(
      agentId,
      date,
      excludeAbsenceId
    )

    if (!result.available) {
      throw new Error(
        `Affectation impossible : l’agent est indisponible (${result.reason}).`
      )
    }

    return true
  },

  async processValidatedAbsence(
    absenceId: string | number
  ): Promise<AbsenceProcessingResult> {
    const { data, error } = await supabase
      .from("absences")
      .select("id,agent_id,type,date_debut,date_fin,statut_validation")
      .eq("id", absenceId)
      .single()

    if (error) {
      throw new Error(
        `Impossible de charger l’absence : ${error.message}`
      )
    }

    const absence = data as AbsenceRow

    if (absence.statut_validation !== "Validée") {
      throw new Error(
        "L’absence doit être validée avant de synchroniser le planning."
      )
    }

    validateIsoDate(absence.date_debut, "La date de début")
    validateIsoDate(absence.date_fin, "La date de fin")

    if (absence.date_fin < absence.date_debut) {
      throw new Error(
        "La date de fin de l’absence est antérieure à la date de début."
      )
    }

    const releasedAssignments =
      await this.releaseAssignmentsForAbsence(
        absence.agent_id,
        absence.date_debut,
        absence.date_fin
      )

    await writeAgentHistory({
      agentId: absence.agent_id,
      type: "ABSENCE_SYNCHRONISATION",
      description:
        releasedAssignments.length > 0
          ? `${releasedAssignments.length} affectation${
              releasedAssignments.length > 1 ? "s ont" : " a"
            } été transformée${
              releasedAssignments.length > 1 ? "s" : ""
            } en poste${
              releasedAssignments.length > 1 ? "s" : ""
            } vacant${
              releasedAssignments.length > 1 ? "s" : ""
            } pour l’absence du ${formatDate(
              absence.date_debut
            )} au ${formatDate(absence.date_fin)}.`
          : `Aucune affectation à libérer pour l’absence du ${formatDate(
              absence.date_debut
            )} au ${formatDate(absence.date_fin)}.`,
    })

    return {
      absenceId: absence.id,
      agentId: absence.agent_id,
      startDate: absence.date_debut,
      endDate: absence.date_fin,
      releasedCount: releasedAssignments.length,
      releasedAssignments,
    }
  },

  async releaseAssignmentsForAbsence(
    agentId: string | number,
    startDate: string,
    endDate: string
  ): Promise<ReleasedAssignment[]> {
    validateIsoDate(startDate, "La date de début")
    validateIsoDate(endDate, "La date de fin")

    if (endDate < startDate) {
      throw new Error(
        "La date de fin est antérieure à la date de début."
      )
    }

    const { data, error } = await supabase
      .from("planning_journalier")
      .select(
        "id,date,agent_id,agent_initial_id,site_id,service,heure_debut,heure_fin,statut,commentaire,est_poste_vacant"
      )
      .eq("agent_id", agentId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("heure_debut", { ascending: true })

    if (error) {
      throw new Error(
        `Impossible de rechercher les affectations de l’agent : ${error.message}`
      )
    }

    const assignments = (data || []) as PlanningAssignmentRow[]

    if (assignments.length === 0) {
      return []
    }

    const assignmentIds = assignments.map(
      (assignment) => assignment.id
    )

    const { data: updatedRows, error: updateError } =
      await supabase
        .from("planning_journalier")
        .update({
          agent_initial_id: agentId,
          agent_id: null,
          est_poste_vacant: true,
          statut: "Absent",
          commentaire:
            "Poste vacant suite à une absence validée",
        })
        .in("id", assignmentIds)
        .eq("agent_id", agentId)
        .select(
          "id,date,site_id,service,heure_debut,heure_fin"
        )

    if (updateError) {
      throw new Error(
        `Impossible de libérer les affectations : ${updateError.message}`
      )
    }

    const releasedAssignments =
      (updatedRows || []) as ReleasedAssignment[]

    if (releasedAssignments.length !== assignments.length) {
      throw new Error(
        `${assignments.length} affectation(s) devaient être libérées, mais ${releasedAssignments.length} seulement ont été mises à jour.`
      )
    }

    await Promise.all(
      assignments.map((assignment) =>
        writePlanningHistory({
          assignment,
          agentId,
        })
      )
    )

    return releasedAssignments
  },
}

export default AvailabilityEngine

async function writePlanningHistory({
  assignment,
  agentId,
}: {
  assignment: PlanningAssignmentRow
  agentId: string | number
}) {
  const { error } = await supabase
    .from("planning_history")
    .insert({
      assignment_id: assignment.id,
      agent_id: agentId,
      action: "modification",
      date_planning: assignment.date,
      ancien_site_id: assignment.site_id,
      nouveau_site_id: assignment.site_id,
      ancien_service: assignment.service,
      nouveau_service: assignment.service,
      ancienne_heure_debut: assignment.heure_debut,
      nouvelle_heure_debut: assignment.heure_debut,
      ancienne_heure_fin: assignment.heure_fin,
      nouvelle_heure_fin: assignment.heure_fin,
      ancien_statut: assignment.statut,
      nouveau_statut: "Absent",
      commentaire:
        "Affectation transformée en poste vacant à la suite d’une absence validée.",
    })

  if (error) {
    console.error("Historique planning :", error)
  }
}

async function writeAgentHistory({
  agentId,
  type,
  description,
}: {
  agentId: string | number
  type: string
  description: string
}) {
  const { error } = await supabase
    .from("agent_historique")
    .insert({
      agent_id: agentId,
      type,
      description,
      utilisateur: "Administrateur",
      date_evenement: new Date().toISOString(),
    })

  if (error) {
    console.error("Historique RH :", error)
  }
}

function validateIsoDate(
  date: string,
  label: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(
      new Date(`${date}T12:00:00`).getTime()
    )
  ) {
    throw new Error(`${label} est invalide.`)
  }
}

function formatDate(date: string) {
  const value = new Date(`${date}T12:00:00`)

  if (Number.isNaN(value.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat("fr-FR").format(value)
}