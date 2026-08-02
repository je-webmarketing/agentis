export type PeriscolaireActivityStatus =
  | "Brouillon"
  | "Planifiée"
  | "Confirmée"
  | "Terminée"
  | "Annulée"

export type PeriscolaireLocalChaperone = {
  id: string
  activityId: string
  agentId: string
  agentName: string
  role: string
  commentaire: string | null
  createdAt: string
}

export type PeriscolaireLocalActivity = {
  id: string
  nom: string
  date: string
  heureDepart: string | null
  heureRetour: string | null
  siteId: string | null
  siteName: string | null
  responsableAgentId: string | null
  responsableAgentName: string | null
  lieu: string | null
  transport: string | null
  nombreEnfants: number
  ratioEnfantsParAccompagnant: number
  accompagnantsRequis: number
  statut: PeriscolaireActivityStatus
  commentaire: string | null
  accompagnants: PeriscolaireLocalChaperone[]
  createdAt: string
  updatedAt: string
}

export type CreatePeriscolaireLocalActivityPayload = {
  nom: string
  date: string
  heureDepart?: string | null
  heureRetour?: string | null
  siteId?: string | null
  siteName?: string | null
  responsableAgentId?: string | null
  responsableAgentName?: string | null
  lieu?: string | null
  transport?: string | null
  nombreEnfants: number
  ratioEnfantsParAccompagnant?: number
  statut?: PeriscolaireActivityStatus
  commentaire?: string | null
}

export type UpdatePeriscolaireLocalActivityPayload =
  Partial<CreatePeriscolaireLocalActivityPayload>

export type AssignPeriscolaireChaperonePayload = {
  activityId: string
  agentId: string | number
  agentName: string
  role?: string
  commentaire?: string | null
}

export type PeriscolaireLocalSummary = {
  total: number
  enfants: number
  accompagnantsRequis: number
  accompagnantsAffectes: number
  accompagnantsManquants: number
  conformes: number
  incompletes: number
  activitesDuJour: number
  sortiesExterieures: number
  tauxCouverture: number
}

export type PeriscolaireStorageExport = {
  version: 1
  exportedAt: string
  activities: PeriscolaireLocalActivity[]
}

const STORAGE_KEY =
  "agentis_periscolaire_activities_v1"

const STORAGE_EVENT =
  "agentis:periscolaire-storage-changed"

const DEFAULT_RATIO = 12

function isBrowser() {
  return typeof window !== "undefined"
}

function nowIso() {
  return new Date().toISOString()
}

function generateId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

function normalizeNullableText(
  value?: string | null
) {
  const normalized = value?.trim() || ""
  return normalized || null
}

function cloneActivities(
  activities: PeriscolaireLocalActivity[]
) {
  return JSON.parse(
    JSON.stringify(activities)
  ) as PeriscolaireLocalActivity[]
}

function calculateRequiredChaperones(
  numberOfChildren: number,
  ratio = DEFAULT_RATIO
) {
  const children = Math.max(
    0,
    Number(numberOfChildren) || 0
  )

  const safeRatio = Math.max(
    1,
    Number(ratio) || DEFAULT_RATIO
  )

  if (children === 0) {
    return 0
  }

  return Math.ceil(children / safeRatio)
}

function validateIsoDate(
  value: string,
  label = "La date"
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(
      new Date(`${value}T12:00:00`).getTime()
    )
  ) {
    throw new Error(`${label} est invalide.`)
  }
}

function validateTimes(
  start?: string | null,
  end?: string | null
) {
  if (start && end && start >= end) {
    throw new Error(
      "L’heure de retour doit être postérieure à l’heure de départ."
    )
  }
}

function validateActivityPayload(
  payload: CreatePeriscolaireLocalActivityPayload
) {
  if (!payload.nom.trim()) {
    throw new Error(
      "Le nom de l’activité est obligatoire."
    )
  }

  validateIsoDate(
    payload.date,
    "La date de l’activité"
  )

  if (
    !Number.isFinite(payload.nombreEnfants) ||
    payload.nombreEnfants < 0
  ) {
    throw new Error(
      "Le nombre d’enfants doit être positif ou nul."
    )
  }

  const ratio =
    payload.ratioEnfantsParAccompagnant ??
    DEFAULT_RATIO

  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new Error(
      "Le ratio d’encadrement doit être supérieur à zéro."
    )
  }

  validateTimes(
    payload.heureDepart,
    payload.heureRetour
  )
}

function normalizeActivity(
  activity: PeriscolaireLocalActivity
): PeriscolaireLocalActivity {
  const ratio = Math.max(
    1,
    Number(
      activity.ratioEnfantsParAccompagnant
    ) || DEFAULT_RATIO
  )

  const children = Math.max(
    0,
    Number(activity.nombreEnfants) || 0
  )

  return {
    ...activity,
    nom: activity.nom.trim(),
    nombreEnfants: children,
    ratioEnfantsParAccompagnant: ratio,
    accompagnantsRequis:
      calculateRequiredChaperones(
        children,
        ratio
      ),
    accompagnants: Array.isArray(
      activity.accompagnants
    )
      ? activity.accompagnants
      : [],
  }
}

function readActivities() {
  if (!isBrowser()) {
    return [] as PeriscolaireLocalActivity[]
  }

  const raw = window.localStorage.getItem(
    STORAGE_KEY
  )

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map(
      normalizeActivity
    ) as PeriscolaireLocalActivity[]
  } catch (error) {
    console.error(
      "Lecture du stockage périscolaire :",
      error
    )

    return []
  }
}

function writeActivities(
  activities: PeriscolaireLocalActivity[]
) {
  if (!isBrowser()) {
    return
  }

  const normalized =
    activities.map(normalizeActivity)

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalized)
  )

  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, {
      detail: cloneActivities(normalized),
    })
  )
}

export const PeriscolaireStorage = {
  get storageKey() {
    return STORAGE_KEY
  },

  calculateRequiredChaperones,

  list() {
    return cloneActivities(
      readActivities().sort((a, b) => {
        const dateComparison =
          a.date.localeCompare(b.date)

        if (dateComparison !== 0) {
          return dateComparison
        }

        return String(a.heureDepart || "")
          .localeCompare(
            String(b.heureDepart || "")
          )
      })
    )
  },

  getById(id: string) {
    const activity = readActivities().find(
      (item) => item.id === id
    )

    return activity
      ? cloneActivities([activity])[0]
      : null
  },

  create(
    payload: CreatePeriscolaireLocalActivityPayload
  ) {
    validateActivityPayload(payload)

    const timestamp = nowIso()
    const ratio =
      payload.ratioEnfantsParAccompagnant ??
      DEFAULT_RATIO

    const activity: PeriscolaireLocalActivity =
      {
        id: generateId("activity"),
        nom: payload.nom.trim(),
        date: payload.date,
        heureDepart:
          payload.heureDepart || null,
        heureRetour:
          payload.heureRetour || null,
        siteId: payload.siteId || null,
        siteName: normalizeNullableText(
          payload.siteName
        ),
        responsableAgentId:
          payload.responsableAgentId || null,
        responsableAgentName:
          normalizeNullableText(
            payload.responsableAgentName
          ),
        lieu: normalizeNullableText(
          payload.lieu
        ),
        transport: normalizeNullableText(
          payload.transport
        ),
        nombreEnfants:
          payload.nombreEnfants,
        ratioEnfantsParAccompagnant:
          ratio,
        accompagnantsRequis:
          calculateRequiredChaperones(
            payload.nombreEnfants,
            ratio
          ),
        statut:
          payload.statut || "Brouillon",
        commentaire:
          normalizeNullableText(
            payload.commentaire
          ),
        accompagnants: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }

    const activities = readActivities()
    activities.push(activity)
    writeActivities(activities)

    return cloneActivities([activity])[0]
  },

  update(
    id: string,
    payload: UpdatePeriscolaireLocalActivityPayload
  ) {
    const activities = readActivities()
    const index = activities.findIndex(
      (activity) => activity.id === id
    )

    if (index === -1) {
      throw new Error(
        "L’activité périscolaire est introuvable."
      )
    }

    const current = activities[index]

    const mergedPayload: CreatePeriscolaireLocalActivityPayload =
      {
        nom: payload.nom ?? current.nom,
        date: payload.date ?? current.date,
        heureDepart:
          payload.heureDepart ??
          current.heureDepart,
        heureRetour:
          payload.heureRetour ??
          current.heureRetour,
        siteId:
          payload.siteId ?? current.siteId,
        siteName:
          payload.siteName ??
          current.siteName,
        responsableAgentId:
          payload.responsableAgentId ??
          current.responsableAgentId,
        responsableAgentName:
          payload.responsableAgentName ??
          current.responsableAgentName,
        lieu: payload.lieu ?? current.lieu,
        transport:
          payload.transport ??
          current.transport,
        nombreEnfants:
          payload.nombreEnfants ??
          current.nombreEnfants,
        ratioEnfantsParAccompagnant:
          payload.ratioEnfantsParAccompagnant ??
          current.ratioEnfantsParAccompagnant,
        statut:
          payload.statut ?? current.statut,
        commentaire:
          payload.commentaire ??
          current.commentaire,
      }

    validateActivityPayload(mergedPayload)

    const updated: PeriscolaireLocalActivity =
      {
        ...current,
        ...mergedPayload,
        nom: mergedPayload.nom.trim(),
        lieu: normalizeNullableText(
          mergedPayload.lieu
        ),
        transport: normalizeNullableText(
          mergedPayload.transport
        ),
        siteName: normalizeNullableText(
          mergedPayload.siteName
        ),
        responsableAgentName:
          normalizeNullableText(
            mergedPayload.responsableAgentName
          ),
        commentaire: normalizeNullableText(
          mergedPayload.commentaire
        ),
        accompagnantsRequis:
          calculateRequiredChaperones(
            mergedPayload.nombreEnfants,
            mergedPayload.ratioEnfantsParAccompagnant
          ),
        updatedAt: nowIso(),
      }

    activities[index] = updated
    writeActivities(activities)

    return cloneActivities([updated])[0]
  },

  delete(id: string) {
    const activities = readActivities()
    const filtered = activities.filter(
      (activity) => activity.id !== id
    )

    if (
      filtered.length === activities.length
    ) {
      throw new Error(
        "L’activité périscolaire est introuvable."
      )
    }

    writeActivities(filtered)
  },

  assignChaperone(
    payload: AssignPeriscolaireChaperonePayload
  ) {
    const activities = readActivities()
    const index = activities.findIndex(
      (activity) =>
        activity.id === payload.activityId
    )

    if (index === -1) {
      throw new Error(
        "L’activité périscolaire est introuvable."
      )
    }

    const activity = activities[index]
    const normalizedAgentId = String(
      payload.agentId
    )

    const alreadyAssigned =
      activity.accompagnants.some(
        (chaperone) =>
          chaperone.agentId ===
          normalizedAgentId
      )

    if (alreadyAssigned) {
      throw new Error(
        "Cet agent est déjà affecté à cette activité."
      )
    }

    const chaperone: PeriscolaireLocalChaperone =
      {
        id: generateId("chaperone"),
        activityId: activity.id,
        agentId: normalizedAgentId,
        agentName:
          payload.agentName.trim() ||
          `Agent ${normalizedAgentId}`,
        role:
          payload.role?.trim() ||
          "Accompagnant",
        commentaire:
          normalizeNullableText(
            payload.commentaire
          ),
        createdAt: nowIso(),
      }

    const updated = {
      ...activity,
      accompagnants: [
        ...activity.accompagnants,
        chaperone,
      ],
      updatedAt: nowIso(),
    }

    activities[index] = updated
    writeActivities(activities)

    return {
      activity:
        cloneActivities([updated])[0],
      chaperone: {
        ...chaperone,
      },
    }
  },

  removeChaperone(
    activityId: string,
    agentId: string | number
  ) {
    const activities = readActivities()
    const index = activities.findIndex(
      (activity) =>
        activity.id === activityId
    )

    if (index === -1) {
      throw new Error(
        "L’activité périscolaire est introuvable."
      )
    }

    const activity = activities[index]
    const normalizedAgentId = String(agentId)

    const filtered =
      activity.accompagnants.filter(
        (chaperone) =>
          chaperone.agentId !==
          normalizedAgentId
      )

    if (
      filtered.length ===
      activity.accompagnants.length
    ) {
      throw new Error(
        "Cet accompagnant n’est pas affecté à l’activité."
      )
    }

    const updated = {
      ...activity,
      accompagnants: filtered,
      updatedAt: nowIso(),
    }

    activities[index] = updated
    writeActivities(activities)

    return cloneActivities([updated])[0]
  },

  getSummary(
    referenceDate = new Date()
      .toISOString()
      .slice(0, 10)
  ): PeriscolaireLocalSummary {
    const activities = readActivities()

    const summary =
      activities.reduce<PeriscolaireLocalSummary>(
        (accumulator, activity) => {
          const assigned =
            activity.accompagnants.length

          const missing = Math.max(
            0,
            activity.accompagnantsRequis -
              assigned
          )

          accumulator.total += 1
          accumulator.enfants +=
            activity.nombreEnfants
          accumulator.accompagnantsRequis +=
            activity.accompagnantsRequis
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
            activity.date === referenceDate
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
          enfants: 0,
          accompagnantsRequis: 0,
          accompagnantsAffectes: 0,
          accompagnantsManquants: 0,
          conformes: 0,
          incompletes: 0,
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

  exportData(): PeriscolaireStorageExport {
    return {
      version: 1,
      exportedAt: nowIso(),
      activities: cloneActivities(
        readActivities()
      ),
    }
  },

  importData(
    source:
      | string
      | PeriscolaireStorageExport,
    options?: {
      replace?: boolean
    }
  ) {
    const parsed =
      typeof source === "string"
        ? JSON.parse(source)
        : source

    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.activities)
    ) {
      throw new Error(
        "Le fichier d’import périscolaire est invalide."
      )
    }

    const imported: PeriscolaireLocalActivity[] =
      (parsed.activities as PeriscolaireLocalActivity[]).map(
        normalizeActivity
      )

    if (options?.replace) {
      writeActivities(imported)
      return cloneActivities(imported)
    }

    const current = readActivities()
    const currentIds = new Set(
      current.map((activity) => activity.id)
    )

    const merged = [
      ...current,
      ...imported.filter(
        (activity) =>
          !currentIds.has(activity.id)
      ),
    ]

    writeActivities(merged)

    return cloneActivities(merged)
  },

  clear() {
    if (!isBrowser()) {
      return
    }

    window.localStorage.removeItem(
      STORAGE_KEY
    )

    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENT, {
        detail: [],
      })
    )
  },

  subscribe(
    listener: (
      activities: PeriscolaireLocalActivity[]
    ) => void
  ) {
    if (!isBrowser()) {
      return () => undefined
    }

    const handleCustomEvent = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<
          PeriscolaireLocalActivity[]
        >

      listener(
        customEvent.detail ||
          PeriscolaireStorage.list()
      )
    }

    const handleStorage = (
      event: StorageEvent
    ) => {
      if (event.key === STORAGE_KEY) {
        listener(
          PeriscolaireStorage.list()
        )
      }
    }

    window.addEventListener(
      STORAGE_EVENT,
      handleCustomEvent
    )

    window.addEventListener(
      "storage",
      handleStorage
    )

    return () => {
      window.removeEventListener(
        STORAGE_EVENT,
        handleCustomEvent
      )

      window.removeEventListener(
        "storage",
        handleStorage
      )
    }
  },
}

export default PeriscolaireStorage