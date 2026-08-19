import { supabase } from "@/lib/supabase"
import { agentisCore } from "@/lib/core"

export type PlanningAssignmentPayload = {
  date: string
  agent_id: string | number
  site_id: string | number
  service?: string | null
  service_id?: string | number | null
  heure_debut?: string | null
  heure_fin?: string | null
  statut?: string
  commentaire?: string | null
}

export type PlanningAssignmentUpdate =
  Partial<PlanningAssignmentPayload>

const planningSelect = `
  *,
  agent:agent_id (
    id,
    nom
  ),
  site:site_id (
    id,
    nom,
    structure_id
  ),
  service_ref:service_id (
    id,
    nom
  )
`

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function hasTimeOverlap(
  firstStart?: string | null,
  firstEnd?: string | null,
  secondStart?: string | null,
  secondEnd?: string | null
): boolean {
  if (
    !firstStart ||
    !firstEnd ||
    !secondStart ||
    !secondEnd
  ) {
    return firstStart === secondStart
  }

  return (
    firstStart < secondEnd &&
    secondStart < firstEnd
  )
}

export const PlanningService = {
  /**
   * Récupère toutes les affectations.
   */
  async list() {
    const { data, error } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .order("date", { ascending: false })
      .order("heure_debut", { ascending: true })

    if (error) throw error

    return data ?? []
  },

  /**
   * Récupère une affectation par son identifiant.
   */
  async getById(id: string | number) {
    const { data, error } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("id", id)
      .single()

    if (error) throw error

    return data
  },

  /**
   * Récupère le planning complet d'un agent.
   */
  async getAgentPlanning(agentId: string | number) {
    const { data, error } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("agent_id", agentId)
      .order("date", { ascending: false })
      .order("heure_debut", { ascending: true })

    if (error) throw error

    return data ?? []
  },

  /**
   * Récupère les prochaines affectations d'un agent.
   */
  async getNextAssignments(agentId: string | number) {
    const today = formatDate(new Date())

    const { data, error } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("agent_id", agentId)
      .gte("date", today)
      .order("date", { ascending: true })
      .order("heure_debut", { ascending: true })

    if (error) throw error

    return data ?? []
  },

  /**
   * Récupère toutes les affectations d'une journée.
   */
  async getDay(date: string) {
    const { data, error } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("date", date)
      .order("site_id", { ascending: true })
      .order("heure_debut", { ascending: true })

    if (error) throw error

    return data ?? []
  },

  /**
 * Renvoie tous les postes non couverts d'une journée.
 */
async getUncoveredPosts(date: string) {
  const { data, error } = await supabase
    .from("planning_journalier")
    .select(planningSelect)
    .eq("date", date)
    .eq("est_poste_vacant", true)
    .order("heure_debut", {
      ascending: true,
    })

  if (error) {
    throw error
  }

  return data ?? []
},

  /**
   * Récupère les affectations comprises entre deux dates incluses.
   */
  async getBetweenDates(
    startDate: string,
    endDate: string
  ) {
    const { data, error } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("heure_debut", { ascending: true })

    if (error) throw error

    return data ?? []
  },

  /**
   * Récupère une semaine à partir d'une date.
   */
  async getWeek(referenceDate: string) {
    const reference = new Date(
      `${referenceDate}T12:00:00`
    )
    const day = reference.getDay()

    const mondayOffset = day === 0 ? -6 : 1 - day

    const monday = new Date(reference)
    monday.setDate(
      reference.getDate() + mondayOffset
    )

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return this.getBetweenDates(
      formatDate(monday),
      formatDate(sunday)
    )
  },

  /**
   * Crée une nouvelle affectation.
   */
async createAssignment(
  payload: PlanningAssignmentPayload
) {
  const conflict = await this.findAgentConflict({
    agentId: payload.agent_id,
    date: payload.date,
    heureDebut: payload.heure_debut,
    heureFin: payload.heure_fin,
  })

  if (conflict) {
    throw new Error(
      "Cet agent est déjà affecté dans une autre structure sur ce créneau."
    )
  }

  const { data, error } = await supabase
    .from("planning_journalier")
    .insert({
      date: payload.date,
      agent_id: payload.agent_id,
      site_id: payload.site_id,
      service: payload.service ?? null,
      service_id: payload.service_id ?? null,
      heure_debut: payload.heure_debut ?? null,
      heure_fin: payload.heure_fin ?? null,
      statut: payload.statut || "Présent",
      commentaire: payload.commentaire ?? null,
    })
    .select(planningSelect)
    .single()

  if (error) {
    throw error
  }

  await this.logHistory({
    assignment_id: data.id,
    agent_id: data.agent_id,
    action: "creation",
    date_planning: data.date,

    nouveau_site_id: data.site_id,
    nouveau_service: data.service,

    nouvelle_heure_debut: data.heure_debut,
    nouvelle_heure_fin: data.heure_fin,

    nouveau_statut: data.statut,
    commentaire: data.commentaire,
  })

  await agentisCore.emit({
    name: "PLANNING_CREATED",
    module: "planning",
    entityType: "planning",
    entityId: String(data.id),
    payload: {
      assignment: data,
      conflict: null,
    },
  })

  return data
},

  /**
   * Renvoie l'historique du planning.
   */
  async listHistory(limit = 200) {
    const { data, error } = await supabase
      .from("planning_history")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(limit)

    if (error) {
      throw new Error(
        error.message ||
          "Impossible de charger l’historique du planning."
      )
    }

    return data ?? []
  },

  /**
   * Met à jour une affectation existante.
   */
  async updateAssignment(
    id: string | number,
    payload: PlanningAssignmentUpdate,
    historyAction:
      | "modification"
      | "deplacement" = "modification"
  ) {
    const {
      data: before,
      error: beforeError,
    } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("id", id)
      .single()

    if (beforeError) {
      throw beforeError
    }

    const nextAgentId =
      payload.agent_id ?? before.agent_id

    const nextDate =
      payload.date ?? before.date

    const nextStart =
      payload.heure_debut !== undefined
        ? payload.heure_debut
        : before.heure_debut

    const nextEnd =
      payload.heure_fin !== undefined
        ? payload.heure_fin
        : before.heure_fin

    const conflict = await this.findAgentConflict({
      agentId: nextAgentId,
      date: nextDate,
      heureDebut: nextStart,
      heureFin: nextEnd,
      excludeAssignmentId: id,
    })

    if (conflict) {
      throw new Error(
        "Cet agent est déjà affecté dans une autre structure sur ce créneau."
      )
    }

    const { data, error } = await supabase
      .from("planning_journalier")
      .update(payload)
      .eq("id", id)
      .select(planningSelect)
      .single()

    if (error) {
      throw error
    }

    await this.logHistory({
      assignment_id: data.id,
      agent_id: data.agent_id,
      action: historyAction,
      date_planning: data.date,

      ancien_site_id: before.site_id,
      nouveau_site_id: data.site_id,

      ancien_service: before.service,
      nouveau_service: data.service,

      ancienne_heure_debut:
        before.heure_debut,
      nouvelle_heure_debut:
        data.heure_debut,

      ancienne_heure_fin:
        before.heure_fin,
      nouvelle_heure_fin: data.heure_fin,

      ancien_statut: before.statut,
      nouveau_statut: data.statut,

      commentaire: data.commentaire,
    })

    await agentisCore.emit({
      name: "PLANNING_UPDATED",
      module: "planning",
      entityType: "planning",
      entityId: String(data.id),
      payload: {
        before,
        assignment: data,
        conflict: null,
      },
    })

    return data
  },

  /**
   * Déplace une affectation.
   */
  async moveAssignment(
    id: string | number,
    destination: {
      date?: string
      site_id?: string | number
      service?: string | null
      service_id?: string | number | null
      heure_debut?: string | null
      heure_fin?: string | null
    }
  ) {
    return this.updateAssignment(
      id,
      destination,
      "deplacement"
    )
  },

  /**
   * Change uniquement le statut.
   */
  async updateStatus(
    id: string | number,
    statut: string,
    commentaire?: string | null
  ) {
    return this.updateAssignment(id, {
      statut,
      commentaire,
    })
  },

  /**
   * Supprime une affectation.
   */
  async deleteAssignment(
    id: string | number
  ) {
    const {
      data: before,
      error: beforeError,
    } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("id", id)
      .single()

    if (beforeError) {
      throw beforeError
    }

    const { data, error } = await supabase
      .from("planning_journalier")
      .delete()
      .eq("id", id)
      .select("id")

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error(
        `L’affectation ${id} n’a pas pu être supprimée.`
      )
    }

    await this.logHistory({
      assignment_id: before.id,
      agent_id: before.agent_id,
      action: "suppression",
      date_planning: before.date,

      ancien_site_id: before.site_id,
      ancien_service: before.service,

      ancienne_heure_debut:
        before.heure_debut,
      ancienne_heure_fin:
        before.heure_fin,

      ancien_statut: before.statut,
      commentaire: before.commentaire,
    })

    return data[0]
  },

  /**
   * Duplique toutes les affectations d'une journée.
   */
  async duplicateDay(
    sourceDate: string,
    targetDate: string
  ) {
    if (sourceDate === targetDate) {
      throw new Error(
        "La date source et la date de destination doivent être différentes."
      )
    }

    const sourceAssignments =
      await this.getDay(sourceDate)

    if (sourceAssignments.length === 0) {
      throw new Error(
        "Aucune affectation n'a été trouvée pour la date source."
      )
    }

    for (const assignment of sourceAssignments) {
      if (
        assignment.agent_id === null ||
        assignment.agent_id === undefined
      ) {
        continue
      }

      const conflict =
        await this.findAgentConflict({
          agentId: assignment.agent_id,
          date: targetDate,
          heureDebut:
            assignment.heure_debut,
          heureFin: assignment.heure_fin,
        })

      if (conflict) {
        throw new Error(
          "La duplication créerait un conflit de planning pour au moins un agent."
        )
      }
    }

    const rowsToInsert =
      sourceAssignments.map((assignment) => ({
        date: targetDate,
        agent_id: assignment.agent_id,
        site_id: assignment.site_id,
        service: assignment.service ?? null,
        service_id:
          assignment.service_id ?? null,
        heure_debut:
          assignment.heure_debut ?? null,
        heure_fin:
          assignment.heure_fin ?? null,
        statut:
          assignment.statut || "Présent",
        commentaire:
          assignment.commentaire ?? null,
      }))

    const { data, error } = await supabase
      .from("planning_journalier")
      .insert(rowsToInsert)
      .select(planningSelect)

    if (error) throw error

    return data ?? []
  },

  /**
   * Recherche un chevauchement pour un agent.
   */
  async findAgentConflict(params: {
    agentId: string | number
    date: string
    heureDebut?: string | null
    heureFin?: string | null
    excludeAssignmentId?:
      | string
      | number
  }) {
    let query = supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("agent_id", params.agentId)
      .eq("date", params.date)

    if (
      params.excludeAssignmentId !== undefined
    ) {
      query = query.neq(
        "id",
        params.excludeAssignmentId
      )
    }

    const { data, error } = await query

    if (error) throw error

    const assignments = data ?? []

    return (
      assignments.find((assignment) =>
        hasTimeOverlap(
          params.heureDebut,
          params.heureFin,
          assignment.heure_debut,
          assignment.heure_fin
        )
      ) ?? null
    )
  },

  async logHistory(payload: {
    assignment_id?:
      | string
      | number
      | null
    agent_id?: string | number | null

    action:
      | "creation"
      | "modification"
      | "deplacement"
      | "duplication"
      | "remplacement"
      | "suppression"

    date_planning?: string | null

    ancien_site_id?:
      | string
      | number
      | null
    nouveau_site_id?:
      | string
      | number
      | null

    ancien_service?: string | null
    nouveau_service?: string | null

    ancienne_heure_debut?: string | null
    nouvelle_heure_debut?: string | null

    ancienne_heure_fin?: string | null
    nouvelle_heure_fin?: string | null

    ancien_statut?: string | null
    nouveau_statut?: string | null

    commentaire?: string | null
  }) {
    const { error } = await supabase
      .from("planning_history")
      .insert(payload)

    if (error) {
      console.error(
        "Historique Planning :",
        error
      )
    }
  },

  /**
   * Déplace une affectation et maintient les postes vacants.
   */
  async moveAssignmentWithVacancy(params: {
    assignmentId: string | number
    date: string

    sourceSiteId: string | number
    sourceService: string
    sourceStart: string | null
    sourceEnd: string | null

    targetSiteId: string | number
    targetService: string
    targetStart: string | null
    targetEnd: string | null

    targetVacancyId?:
      | string
      | number
      | null
  }) {
    const currentAssignment =
      await this.getById(params.assignmentId)

    const conflict =
      await this.findAgentConflict({
        agentId: currentAssignment.agent_id,
        date: params.date,
        heureDebut: params.targetStart,
        heureFin: params.targetEnd,
        excludeAssignmentId:
          params.assignmentId,
      })

    if (conflict) {
      throw new Error(
        "Cet agent est déjà affecté dans une autre structure sur ce créneau."
      )
    }

    const { error: moveError } =
      await supabase
        .from("planning_journalier")
        .update({
          site_id: params.targetSiteId,
          service: params.targetService,
          heure_debut: params.targetStart,
          heure_fin: params.targetEnd,
          statut: "Présent",
          est_poste_vacant: false,
        })
        .eq("id", params.assignmentId)

    if (moveError) {
      throw moveError
    }

    const {
      data: movedAssignment,
      error: readError,
    } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("id", params.assignmentId)
      .maybeSingle()

    if (readError) {
      throw readError
    }

    if (!movedAssignment) {
      throw new Error(
        `L’affectation ${params.assignmentId} est introuvable après le déplacement.`
      )
    }

    const siteWasUpdated =
      String(movedAssignment.site_id) ===
      String(params.targetSiteId)

    const serviceWasUpdated =
      movedAssignment.service ===
      params.targetService

    if (
      !siteWasUpdated ||
      !serviceWasUpdated
    ) {
      throw new Error(
        "Le déplacement n’a pas été appliqué par Supabase."
      )
    }

    await this.logHistory({
      assignment_id: movedAssignment.id,
      agent_id: movedAssignment.agent_id,
      action: "deplacement",
      date_planning: movedAssignment.date,

      ancien_site_id:
        params.sourceSiteId,
      nouveau_site_id:
        movedAssignment.site_id,

      ancien_service:
        params.sourceService,
      nouveau_service:
        movedAssignment.service,

      ancienne_heure_debut:
        params.sourceStart,
      nouvelle_heure_debut:
        movedAssignment.heure_debut,

      ancienne_heure_fin:
        params.sourceEnd,
      nouvelle_heure_fin:
        movedAssignment.heure_fin,

      ancien_statut: "Présent",
      nouveau_statut:
        movedAssignment.statut,

      commentaire:
        movedAssignment.commentaire,
    })

    await agentisCore.emit({
      name: "PLANNING_UPDATED",
      module: "planning",
      entityType: "planning",
      entityId: String(
        movedAssignment.id
      ),
      payload: {
        before: currentAssignment,
        assignment: movedAssignment,
        conflict: null,
      },
    })

    if (
      params.targetVacancyId !== null &&
      params.targetVacancyId !== undefined
    ) {
      const {
        error: deleteVacancyError,
      } = await supabase
        .from("planning_journalier")
        .delete()
        .eq("id", params.targetVacancyId)
        .eq("est_poste_vacant", true)

      if (deleteVacancyError) {
        console.warn(
          "La vacance cible n’a pas pu être supprimée :",
          deleteVacancyError.message
        )
      }
    }

    const {
      data: existingVacancy,
      error: existingVacancyError,
    } = await supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("date", params.date)
      .eq("site_id", params.sourceSiteId)
      .eq("service", params.sourceService)
      .eq(
        "heure_debut",
        params.sourceStart
      )
      .eq("heure_fin", params.sourceEnd)
      .eq("est_poste_vacant", true)
      .maybeSingle()

    if (existingVacancyError) {
      throw existingVacancyError
    }

    if (existingVacancy) {
      return {
        movedAssignment,
        createdVacancy:
          existingVacancy,
      }
    }

    const {
      data: createdVacancies,
      error: vacancyError,
    } = await supabase
      .from("planning_journalier")
      .insert({
        date: params.date,
        agent_id: null,
        site_id: params.sourceSiteId,
        service: params.sourceService,
        heure_debut: params.sourceStart,
        heure_fin: params.sourceEnd,
        statut: "Absent",
        commentaire:
          "Poste devenu vacant après déplacement",
        est_poste_vacant: true,
      })
      .select(planningSelect)

    if (vacancyError) {
      console.warn(
        "La vacance source n’a pas pu être créée :",
        vacancyError.message
      )

      return {
        movedAssignment,
        createdVacancy: null,
      }
    }

    return {
      movedAssignment,
      createdVacancy:
        createdVacancies?.[0] ?? null,
    }
  },

  /**
   * Renvoie la date la plus récente du planning.
   */
  async getLatestPlanningDate() {
    const { data, error } = await supabase
      .from("planning_journalier")
      .select("date")
      .not("date", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return data?.date ?? null
  },

  /**
   * Affecte un agent à un poste vacant.
   */
  async replaceVacancy(params: {
    vacancyId: string | number
    date: string
    agentId: string | number
    siteId: string | number
    service: string
    start: string | null
    end: string | null
    commentaire?: string | null
  }) {
    const conflict =
      await this.findAgentConflict({
        agentId: params.agentId,
        date: params.date,
        heureDebut: params.start,
        heureFin: params.end,
        excludeAssignmentId:
          params.vacancyId,
      })

    if (conflict) {
      throw new Error(
        "Cet agent est déjà affecté dans une autre structure sur ce créneau."
      )
    }

    const { data, error } = await supabase
      .from("planning_journalier")
      .update({
        date: params.date,
        agent_id: params.agentId,
        site_id: params.siteId,
        service: params.service,
        heure_debut: params.start,
        heure_fin: params.end,
        statut: "Remplacé",
        commentaire:
          params.commentaire?.trim() ||
          "Poste vacant remplacé",
        est_poste_vacant: false,
      })
      .eq("id", params.vacancyId)
      .select(planningSelect)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error(
        `Le poste vacant ${params.vacancyId} n’a pas pu être remplacé.`
      )
    }

    const assignment = data[0]

    await agentisCore.emit({
      name: "PLANNING_UPDATED",
      module: "planning",
      entityType: "planning",
      entityId: String(assignment.id),
      payload: {
        assignment,
        conflict: null,
      },
    })

    return assignment
  },
}