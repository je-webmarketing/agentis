import PeriscolaireStorage, {
  type AssignPeriscolaireChaperonePayload,
  type CreatePeriscolaireLocalActivityPayload,
  type PeriscolaireActivityStatus,
  type PeriscolaireLocalActivity,
  type PeriscolaireLocalSummary,
  type UpdatePeriscolaireLocalActivityPayload,
} from "@/lib/storage/PeriscolaireStorage"

export type {
  AssignPeriscolaireChaperonePayload,
  CreatePeriscolaireLocalActivityPayload,
  PeriscolaireActivityStatus,
  PeriscolaireLocalActivity,
  PeriscolaireLocalSummary,
  UpdatePeriscolaireLocalActivityPayload,
}

export type PeriscolaireActivity = {
  id: string
  nom: string
  date: string
  heure_depart: string | null
  heure_retour: string | null
  site_id: string | null
  responsable_agent_id: string | null
  lieu: string | null
  transport: string | null
  nombre_enfants: number
  ratio_enfants_par_accompagnant: number
  accompagnants_requis: number
  statut: PeriscolaireActivityStatus
  commentaire: string | null
  created_at: string
  updated_at: string
  site: {
    id: string
    nom: string | null
  } | null
  responsable: {
    id: string
    nom: string | null
  } | null
  accompagnants: Array<{
    id: string
    agent_id: string
    role: string
    commentaire: string | null
    created_at: string
    agent: {
      id: string
      nom: string | null
    } | null
  }>
}

export type CreatePeriscolaireActivityPayload = {
  nom: string
  date: string
  heure_depart?: string | null
  heure_retour?: string | null
  site_id?: string | number | null
  site_name?: string | null
  nombre_enfants: number
  ratio_enfants_par_accompagnant?: number
  accompagnants_requis?: number
  responsable_agent_id?: string | number | null
  responsable_agent_name?: string | null
  transport?: string | null
  lieu?: string | null
  statut?: PeriscolaireActivityStatus
  commentaire?: string | null
}

export type UpdatePeriscolaireActivityPayload =
  Partial<CreatePeriscolaireActivityPayload>

export type PeriscolaireActivitySummary = {
  total: number
  conformes: number
  incompletes: number
  enfants: number
  accompagnantsRequis: number
  accompagnantsAffectes: number
  accompagnantsManquants: number
  activitesDuJour: number
  sortiesExterieures: number
  tauxCouverture: number
}

function toActivity(
  activity: PeriscolaireLocalActivity
): PeriscolaireActivity {
  return {
    id: activity.id,
    nom: activity.nom,
    date: activity.date,
    heure_depart: activity.heureDepart,
    heure_retour: activity.heureRetour,
    site_id: activity.siteId,
    responsable_agent_id:
      activity.responsableAgentId,
    lieu: activity.lieu,
    transport: activity.transport,
    nombre_enfants: activity.nombreEnfants,
    ratio_enfants_par_accompagnant:
      activity.ratioEnfantsParAccompagnant,
    accompagnants_requis:
      activity.accompagnantsRequis,
    statut: activity.statut,
    commentaire: activity.commentaire,
    created_at: activity.createdAt,
    updated_at: activity.updatedAt,
    site: activity.siteId
      ? {
          id: activity.siteId,
          nom: activity.siteName,
        }
      : null,
    responsable: activity.responsableAgentId
      ? {
          id: activity.responsableAgentId,
          nom: activity.responsableAgentName,
        }
      : null,
    accompagnants: activity.accompagnants.map(
      (entry) => ({
        id: entry.id,
        agent_id: entry.agentId,
        role: entry.role,
        commentaire: entry.commentaire,
        created_at: entry.createdAt,
        agent: {
          id: entry.agentId,
          nom: entry.agentName,
        },
      })
    ),
  }
}

function toLocalCreatePayload(
  payload: CreatePeriscolaireActivityPayload
): CreatePeriscolaireLocalActivityPayload {
  return {
    nom: payload.nom,
    date: payload.date,
    heureDepart:
      payload.heure_depart || null,
    heureRetour:
      payload.heure_retour || null,
    siteId:
      payload.site_id !== null &&
      payload.site_id !== undefined
        ? String(payload.site_id)
        : null,
    siteName: payload.site_name || null,
    responsableAgentId:
      payload.responsable_agent_id !== null &&
      payload.responsable_agent_id !== undefined
        ? String(payload.responsable_agent_id)
        : null,
    responsableAgentName:
      payload.responsable_agent_name || null,
    lieu: payload.lieu || null,
    transport: payload.transport || null,
    nombreEnfants: payload.nombre_enfants,
    ratioEnfantsParAccompagnant:
      payload.ratio_enfants_par_accompagnant,
    statut: payload.statut,
    commentaire: payload.commentaire || null,
  }
}

function toLocalUpdatePayload(
  payload: UpdatePeriscolaireActivityPayload
): UpdatePeriscolaireLocalActivityPayload {
  const result: UpdatePeriscolaireLocalActivityPayload =
    {}

  if (payload.nom !== undefined) {
    result.nom = payload.nom
  }

  if (payload.date !== undefined) {
    result.date = payload.date
  }

  if (payload.heure_depart !== undefined) {
    result.heureDepart =
      payload.heure_depart || null
  }

  if (payload.heure_retour !== undefined) {
    result.heureRetour =
      payload.heure_retour || null
  }

  if (payload.site_id !== undefined) {
    result.siteId =
      payload.site_id !== null
        ? String(payload.site_id)
        : null
  }

  if (payload.site_name !== undefined) {
    result.siteName =
      payload.site_name || null
  }

  if (
    payload.responsable_agent_id !==
    undefined
  ) {
    result.responsableAgentId =
      payload.responsable_agent_id !== null
        ? String(
            payload.responsable_agent_id
          )
        : null
  }

  if (
    payload.responsable_agent_name !==
    undefined
  ) {
    result.responsableAgentName =
      payload.responsable_agent_name || null
  }

  if (payload.lieu !== undefined) {
    result.lieu = payload.lieu || null
  }

  if (payload.transport !== undefined) {
    result.transport =
      payload.transport || null
  }

  if (
    payload.nombre_enfants !== undefined
  ) {
    result.nombreEnfants =
      payload.nombre_enfants
  }

  if (
    payload.ratio_enfants_par_accompagnant !==
    undefined
  ) {
    result.ratioEnfantsParAccompagnant =
      payload.ratio_enfants_par_accompagnant
  }

  if (payload.statut !== undefined) {
    result.statut = payload.statut
  }

  if (payload.commentaire !== undefined) {
    result.commentaire =
      payload.commentaire || null
  }

  return result
}

export const PeriscolaireService = {
  calculateRequiredChaperones(
    numberOfChildren: number,
    ratio = 12
  ) {
    return PeriscolaireStorage.calculateRequiredChaperones(
      numberOfChildren,
      ratio
    )
  },

  getAssignedChaperones(
    activity: PeriscolaireActivity
  ) {
    return activity.accompagnants.length
  },

  getMissingChaperones(
    activity: PeriscolaireActivity
  ) {
    return Math.max(
      0,
      activity.accompagnants_requis -
        this.getAssignedChaperones(activity)
    )
  },

  isCompliant(
    activity: PeriscolaireActivity
  ) {
    return (
      this.getAssignedChaperones(activity) >=
      activity.accompagnants_requis
    )
  },

  async list() {
    return PeriscolaireStorage.list().map(
      toActivity
    )
  },

  async getById(id: string | number) {
    const activity =
      PeriscolaireStorage.getById(
        String(id)
      )

    if (!activity) {
      throw new Error(
        "L’activité périscolaire est introuvable."
      )
    }

    return toActivity(activity)
  },

  async create(
    payload: CreatePeriscolaireActivityPayload
  ) {
    const activity =
      PeriscolaireStorage.create(
        toLocalCreatePayload(payload)
      )

    return toActivity(activity)
  },

  async update(
    id: string | number,
    payload: UpdatePeriscolaireActivityPayload
  ) {
    const activity =
      PeriscolaireStorage.update(
        String(id),
        toLocalUpdatePayload(payload)
      )

    return toActivity(activity)
  },

  async delete(id: string | number) {
    PeriscolaireStorage.delete(String(id))
  },

  async assignChaperone(
    activityId: string | number,
    agentId: string | number,
    agentName?: string
  ) {
    const result =
      PeriscolaireStorage.assignChaperone({
        activityId: String(activityId),
        agentId,
        agentName:
          agentName?.trim() ||
          `Agent ${agentId}`,
      })

    return {
      ...result.chaperone,
      activity: toActivity(
        result.activity
      ),
    }
  },

  async removeChaperone(
    activityId: string | number,
    agentId: string | number
  ) {
    const activity =
      PeriscolaireStorage.removeChaperone(
        String(activityId),
        agentId
      )

    return toActivity(activity)
  },

  getSummary(
    activities: PeriscolaireActivity[]
  ): PeriscolaireActivitySummary {
    const summary = activities.reduce(
      (accumulator, activity) => {
        const assigned =
          this.getAssignedChaperones(activity)

        const missing = Math.max(
          0,
          activity.accompagnants_requis -
            assigned
        )

        accumulator.total += 1
        accumulator.enfants +=
          activity.nombre_enfants
        accumulator.accompagnantsRequis +=
          activity.accompagnants_requis
        accumulator.accompagnantsAffectes +=
          assigned
        accumulator.accompagnantsManquants +=
          missing

        if (missing === 0) {
          accumulator.conformes += 1
        } else {
          accumulator.incompletes += 1
        }

        if (
          activity.date ===
          new Date()
            .toISOString()
            .slice(0, 10)
        ) {
          accumulator.activitesDuJour += 1
        }

        if (
          Boolean(activity.lieu) ||
          Boolean(activity.transport)
        ) {
          accumulator.sortiesExterieures += 1
        }

        return accumulator
      },
      {
        total: 0,
        conformes: 0,
        incompletes: 0,
        enfants: 0,
        accompagnantsRequis: 0,
        accompagnantsAffectes: 0,
        accompagnantsManquants: 0,
        activitesDuJour: 0,
        sortiesExterieures: 0,
        tauxCouverture: 0,
      }
    )

    summary.tauxCouverture =
      summary.accompagnantsRequis > 0
        ? Math.min(
            100,
            Math.round(
              (summary.accompagnantsAffectes /
                summary.accompagnantsRequis) *
                100
            )
          )
        : 100

    return summary
  },

  exportData() {
    return PeriscolaireStorage.exportData()
  },

  importData(
    source: string,
    replace = false
  ) {
    return PeriscolaireStorage.importData(
      source,
      {
        replace,
      }
    )
  },

  subscribe(
    listener: (
      activities: PeriscolaireActivity[]
    ) => void
  ) {
    return PeriscolaireStorage.subscribe(
      (activities) =>
        listener(
          activities.map(toActivity)
        )
    )
  },
}

export default PeriscolaireService