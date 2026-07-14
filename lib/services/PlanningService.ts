import { supabase } from "@/lib/supabase"

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
   * Récupère les affectations comprises entre deux dates incluses.
   */
  async getBetweenDates(startDate: string, endDate: string) {
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
   * La semaine commence le lundi et se termine le dimanche.
   */
  async getWeek(referenceDate: string) {
    const reference = new Date(`${referenceDate}T12:00:00`)
    const day = reference.getDay()

    const mondayOffset = day === 0 ? -6 : 1 - day

    const monday = new Date(reference)
    monday.setDate(reference.getDate() + mondayOffset)

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
  async createAssignment(payload: PlanningAssignmentPayload) {
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

    if (error) throw error

    return data
  },

  /**
   * Met à jour une affectation existante.
   */
  async updateAssignment(
    id: string | number,
    payload: PlanningAssignmentUpdate
  ) {
    const { data, error } = await supabase
      .from("planning_journalier")
      .update(payload)
      .eq("id", id)
      .select(planningSelect)
      .single()

    if (error) throw error

    return data
  },

  /**
   * Déplace une affectation vers un autre site,
   * une autre date ou un autre créneau.
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
    return this.updateAssignment(id, destination)
  },

  /**
   * Change uniquement le statut d'une affectation.
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
 * Supprime une affectation et vérifie que la ligne
 * a réellement été supprimée.
 */
async deleteAssignment(id: string | number) {
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
      `L’étiquette ${id} n’a pas pu être supprimée.`
    )
  }

  return data[0]
},

  /**
   * Duplique toutes les affectations d'une journée
   * vers une autre date.
   */
  async duplicateDay(sourceDate: string, targetDate: string) {
    if (sourceDate === targetDate) {
      throw new Error(
        "La date source et la date de destination doivent être différentes."
      )
    }

    const sourceAssignments = await this.getDay(sourceDate)

    if (sourceAssignments.length === 0) {
      throw new Error(
        "Aucune affectation n'a été trouvée pour la date source."
      )
    }

    const rowsToInsert = sourceAssignments.map((assignment) => ({
      date: targetDate,
      agent_id: assignment.agent_id,
      site_id: assignment.site_id,
      service: assignment.service ?? null,
      service_id: assignment.service_id ?? null,
      heure_debut: assignment.heure_debut ?? null,
      heure_fin: assignment.heure_fin ?? null,
      statut: assignment.statut || "Présent",
      commentaire: assignment.commentaire ?? null,
    }))

    const { data, error } = await supabase
      .from("planning_journalier")
      .insert(rowsToInsert)
      .select(planningSelect)

    if (error) throw error

    return data ?? []
  },

  /**
   * Vérifie si un agent possède déjà une affectation
   * à une date et à une heure données.
   */
  async findAgentConflict(params: {
    agentId: string | number
    date: string
    heureDebut?: string | null
    excludeAssignmentId?: string | number
  }) {
    let query = supabase
      .from("planning_journalier")
      .select(planningSelect)
      .eq("agent_id", params.agentId)
      .eq("date", params.date)

    if (params.heureDebut) {
      query = query.eq("heure_debut", params.heureDebut)
    }

    if (params.excludeAssignmentId !== undefined) {
      query = query.neq("id", params.excludeAssignmentId)
    }

    const { data, error } = await query.limit(1)

    if (error) throw error

    return data?.[0] ?? null
  },
/**
 * Déplace une affectation et maintient les postes vacants.
 *
 * - Déplace l'affectation vers le créneau cible.
 * - Vérifie que le déplacement a réellement été enregistré.
 * - Supprime la vacance cible éventuelle.
 * - Crée une vacance sur le créneau d'origine si nécessaire.
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

  targetVacancyId?: string | number | null
}) {
  /*
   * 1. Enregistrement du déplacement.
   * Pas de .select() ni de .single() sur l'UPDATE.
   */
  const { error: moveError } = await supabase
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

  /*
   * 2. Relecture indépendante de l'affectation.
   * Cela permet de vérifier que l'UPDATE a réellement été appliqué.
   */
  const { data: movedAssignment, error: readError } = await supabase
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
    String(movedAssignment.site_id) === String(params.targetSiteId)

  const serviceWasUpdated =
    movedAssignment.service === params.targetService

  if (!siteWasUpdated || !serviceWasUpdated) {
    throw new Error(
      "Le déplacement n’a pas été appliqué par Supabase. La session utilisée par l’application ne possède probablement pas la permission UPDATE sur planning_journalier."
    )
  }

  /*
   * 3. Suppression de la vacance présente sur la destination.
   */
  if (
    params.targetVacancyId !== null &&
    params.targetVacancyId !== undefined
  ) {
    const { error: deleteVacancyError } = await supabase
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

  /*
   * 4. Recherche d'une vacance déjà existante
   * sur le créneau source.
   */
  const { data: existingVacancies, error: vacancyCheckError } =
    await supabase
      .from("planning_journalier")
      .select("id")
      .eq("date", params.date)
      .eq("site_id", params.sourceSiteId)
      .eq("service", params.sourceService)
      .eq("est_poste_vacant", true)
      .limit(1)

  if (vacancyCheckError) {
    console.warn(
      "La vacance source n’a pas pu être vérifiée :",
      vacancyCheckError.message
    )

    return {
      movedAssignment,
      createdVacancy: null,
    }
  }

  if (existingVacancies && existingVacancies.length > 0) {
    return {
      movedAssignment,
      createdVacancy: existingVacancies[0],
    }
  }

  /*
   * 5. Création de la vacance sur le créneau d'origine.
   */
  const { data: createdVacancies, error: vacancyError } =
    await supabase
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
    createdVacancy: createdVacancies?.[0] ?? null,
  }
},
 
/**
 * Renvoie la date la plus récente présente dans le planning.
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
    .select()

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error(
      `Le poste vacant ${params.vacancyId} n’a pas pu être remplacé.`
    )
  }

  return data[0]
},
}