import { agentisCore } from "@/lib/core"
import { supabase } from "@/lib/supabase"

export type AbsencePayload = {
  agent_id: number
  type: string
  date_debut: string
  date_fin: string
  statut_validation: string
  commentaire?: string | null
}

export type AbsenceRow = AbsencePayload & {
  id: number
}

const absenceSelect = `
  id,
  agent_id,
  type,
  date_debut,
  date_fin,
  statut_validation,
  commentaire
`

const AbsenceService = {
  async createAbsence(
    payload: AbsencePayload
  ): Promise<AbsenceRow> {
    const { data, error } = await supabase
      .from("absences")
      .insert(payload)
      .select(absenceSelect)
      .single()

    if (error) {
      throw error
    }

    await agentisCore.emit({
      name: "ABSENCE_CREATED",
      module: "absences",
      entityType: "absence",
      entityId: String(data.id),
      payload: data,
    })

    if (data.statut_validation === "Validée") {
      await agentisCore.emit({
        name: "ABSENCE_VALIDATED",
        module: "absences",
        entityType: "absence",
        entityId: String(data.id),
        severity: "success",
        payload: data,
      })
    }

    if (data.statut_validation === "Refusée") {
      await agentisCore.emit({
        name: "ABSENCE_REFUSED",
        module: "absences",
        entityType: "absence",
        entityId: String(data.id),
        severity: "warning",
        payload: data,
      })
    }

    return data
  },

  async updateAbsence(
    id: string | number,
    updates: Partial<AbsencePayload>
  ): Promise<AbsenceRow> {
    const { data: before, error: beforeError } =
      await supabase
        .from("absences")
        .select(absenceSelect)
        .eq("id", id)
        .single()

    if (beforeError) {
      throw beforeError
    }

    const { data, error } = await supabase
      .from("absences")
      .update(updates)
      .eq("id", id)
      .select(absenceSelect)
      .single()

    if (error) {
      throw error
    }

    await agentisCore.emit({
      name: "ABSENCE_UPDATED",
      module: "absences",
      entityType: "absence",
      entityId: String(data.id),
      payload: {
        before,
        after: data,
      },
    })

    const statusChanged =
      before.statut_validation !==
      data.statut_validation

    if (
      statusChanged &&
      data.statut_validation === "Validée"
    ) {
      await agentisCore.emit({
        name: "ABSENCE_VALIDATED",
        module: "absences",
        entityType: "absence",
        entityId: String(data.id),
        severity: "success",
        payload: data,
      })
    }

    if (
      statusChanged &&
      data.statut_validation === "Refusée"
    ) {
      await agentisCore.emit({
        name: "ABSENCE_REFUSED",
        module: "absences",
        entityType: "absence",
        entityId: String(data.id),
        severity: "warning",
        payload: data,
      })
    }

    return data
  },
}

export default AbsenceService