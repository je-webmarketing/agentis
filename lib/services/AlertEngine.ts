import { supabase } from "@/lib/supabase"

export type AlertLevel =
  | "critical"
  | "important"
  | "preventive"

export type AlertCategory =
  | "PLANNING"
  | "ABSENCE"
  | "CONTRAT"
  | "VISITE_MEDICALE"
  | "FORMATION"
  | "HABILITATION"
  | "DOCUMENT"
  | "CONFLIT"

export type AlertItem = {
  id: string
  level: AlertLevel
  category: AlertCategory
  title: string
  message: string
  date: string
  agentId: number | null
  agentName: string
  siteId: number | null
  siteName: string
  sourceTable: string
  sourceId: string | number | null
  daysRemaining: number | null
  actionHref: string | null
}

export type AlertSummary = {
  date: string
  total: number
  critical: number
  important: number
  preventive: number
  agentsConcerned: number
  sitesConcerned: number
  alerts: AlertItem[]
}

type NamedRelation = {
  nom: string | null
}

type PlanningRow = {
  id: string | number
  date: string
  agent_id: number | null
  site_id: number | null
  service: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
  est_poste_vacant: boolean | null
  agent?: NamedRelation | NamedRelation[] | null
  site?: NamedRelation | NamedRelation[] | null
}

type AbsenceRow = {
  id: string | number
  agent_id: number | null
  type: string | null
  date_debut: string | null
  date_fin: string | null
  statut_validation: string | null
  agent?: NamedRelation | NamedRelation[] | null
}

type FormationRow = {
  id: string | number
  agent_id: number
  formation: string | null
  date_expiration: string | null
  agent?: NamedRelation | NamedRelation[] | null
}

type HabilitationRow = {
  id: string | number
  agent_id: number
  habilitation: string | null
  date_expiration: string | null
  agent?: NamedRelation | NamedRelation[] | null
}

type MedicalVisitRow = {
  id: string | number
  agent_id: number
  prochaine_visite: string | null
  aptitude: string | null
  agent?: NamedRelation | NamedRelation[] | null
}

type DocumentRow = {
  id: string | number
  agent_id: number
  nom: string | null
  categorie: string | null
  date_expiration: string | null
  agent?: NamedRelation | NamedRelation[] | null
}

type ContractRow = Record<string, unknown> & {
  id?: string | number
  agent_id?: number | null
  agent?: NamedRelation | NamedRelation[] | null
}

const IMPORTANT_WINDOW_DAYS = 30
const PREVENTIVE_WINDOW_DAYS = 90

export const AlertEngine = {
  async getAlerts(
    referenceDate: string
  ): Promise<AlertItem[]> {
    validateDate(referenceDate)

    const [
      planningResult,
      absencesResult,
      formationsResult,
      habilitationsResult,
      medicalVisitsResult,
      documentsResult,
      contractsResult,
    ] = await Promise.all([
      supabase
        .from("planning_journalier")
        .select(`
          id,
          date,
          agent_id,
          site_id,
          service,
          heure_debut,
          heure_fin,
          statut,
          est_poste_vacant,
          agent:agent_id (
            nom
          ),
          site:site_id (
            nom
          )
        `)
        .eq("date", referenceDate),

      supabase
        .from("absences")
        .select(`
          id,
          agent_id,
          type,
          date_debut,
          date_fin,
          statut_validation,
          agent:agent_id (
            nom
          )
        `)
        .lte("date_debut", referenceDate)
        .gte("date_fin", referenceDate),

      supabase
        .from("agent_formations")
        .select(`
          id,
          agent_id,
          formation,
          date_expiration,
          agent:agent_id (
            nom
          )
        `)
        .not("date_expiration", "is", null),

      supabase
        .from("agent_habilitations")
        .select(`
          id,
          agent_id,
          habilitation,
          date_expiration,
          agent:agent_id (
            nom
          )
        `)
        .not("date_expiration", "is", null),

      supabase
        .from("agent_visites_medicales")
        .select(`
          id,
          agent_id,
          prochaine_visite,
          aptitude,
          agent:agent_id (
            nom
          )
        `)
        .not("prochaine_visite", "is", null),

      supabase
        .from("agent_documents")
        .select(`
          id,
          agent_id,
          nom,
          categorie,
          date_expiration,
          agent:agent_id (
            nom
          )
        `)
        .not("date_expiration", "is", null),

      supabase
        .from("agent_contrats")
        .select(`
          *,
          agent:agent_id (
            nom
          )
        `),
    ])

    const firstError =
      planningResult.error ||
      absencesResult.error ||
      formationsResult.error ||
      habilitationsResult.error ||
      medicalVisitsResult.error ||
      documentsResult.error ||
      contractsResult.error

    if (firstError) {
      throw new Error(
        `Impossible de calculer les alertes : ${firstError.message}`
      )
    }

    const planning =
      (planningResult.data || []) as PlanningRow[]

    const alerts = [
      ...buildPlanningAlerts(
        planning,
        referenceDate
      ),
      ...buildAbsenceAlerts(
        (absencesResult.data || []) as AbsenceRow[],
        planning,
        referenceDate
      ),
      ...buildDateAlerts({
        rows:
          (formationsResult.data || []) as FormationRow[],
        referenceDate,
        category: "FORMATION",
        sourceTable: "agent_formations",
        title: "Formation à renouveler",
        label: (row) =>
          row.formation ||
          "Formation non renseignée",
        dueDate: (row) =>
          row.date_expiration,
      }),
      ...buildDateAlerts({
        rows:
          (habilitationsResult.data || []) as HabilitationRow[],
        referenceDate,
        category: "HABILITATION",
        sourceTable: "agent_habilitations",
        title: "Habilitation à renouveler",
        label: (row) =>
          row.habilitation ||
          "Habilitation non renseignée",
        dueDate: (row) =>
          row.date_expiration,
      }),
      ...buildDateAlerts({
        rows:
          (medicalVisitsResult.data || []) as MedicalVisitRow[],
        referenceDate,
        category: "VISITE_MEDICALE",
        sourceTable: "agent_visites_medicales",
        title: "Visite médicale à programmer",
        label: (row) =>
          row.aptitude
            ? `Aptitude : ${row.aptitude}`
            : "Aptitude non renseignée",
        dueDate: (row) =>
          row.prochaine_visite,
      }),
      ...buildDateAlerts({
        rows:
          (documentsResult.data || []) as DocumentRow[],
        referenceDate,
        category: "DOCUMENT",
        sourceTable: "agent_documents",
        title: "Document à renouveler",
        label: (row) =>
          [row.categorie, row.nom]
            .filter(Boolean)
            .join(" · ") ||
          "Document non renseigné",
        dueDate: (row) =>
          row.date_expiration,
      }),
      ...buildContractAlerts(
        (contractsResult.data || []) as ContractRow[],
        referenceDate
      ),
    ]

    return alerts.sort(compareAlerts)
  },

  async getSummary(
    referenceDate: string
  ): Promise<AlertSummary> {
    const alerts =
      await this.getAlerts(referenceDate)

    return {
      date: referenceDate,
      total: alerts.length,
      critical: alerts.filter(
        (alert) =>
          alert.level === "critical"
      ).length,
      important: alerts.filter(
        (alert) =>
          alert.level === "important"
      ).length,
      preventive: alerts.filter(
        (alert) =>
          alert.level === "preventive"
      ).length,
      agentsConcerned: new Set(
        alerts
          .map((alert) => alert.agentId)
          .filter(
            (value): value is number =>
              value !== null
          )
      ).size,
      sitesConcerned: new Set(
        alerts
          .map((alert) => alert.siteId)
          .filter(
            (value): value is number =>
              value !== null
          )
      ).size,
      alerts,
    }
  },

  async getCriticalAlerts(
    referenceDate: string
  ) {
    const alerts =
      await this.getAlerts(referenceDate)

    return alerts.filter(
      (alert) =>
        alert.level === "critical"
    )
  },

  async getAlertsForAgent(
    agentId: string | number,
    referenceDate: string
  ) {
    const alerts =
      await this.getAlerts(referenceDate)

    return alerts.filter(
      (alert) =>
        String(alert.agentId) ===
        String(agentId)
    )
  },

  async getAlertsForSite(
    siteId: string | number,
    referenceDate: string
  ) {
    const alerts =
      await this.getAlerts(referenceDate)

    return alerts.filter(
      (alert) =>
        String(alert.siteId) ===
        String(siteId)
    )
  },
}

export default AlertEngine

function buildPlanningAlerts(
  rows: PlanningRow[],
  referenceDate: string
) {
  const alerts: AlertItem[] = []

  rows.forEach((row) => {
    const status = normalize(row.statut)

    if (
      row.est_poste_vacant === true ||
      row.agent_id === null
    ) {
      alerts.push({
        id: `vacancy-${row.id}`,
        level: "critical",
        category: "PLANNING",
        title: "Poste vacant",
        message: `${getRelationName(
          row.site,
          "Site non renseigné"
        )} · ${row.service || "Créneau non renseigné"}`,
        date: referenceDate,
        agentId: null,
        agentName: "Agent non affecté",
        siteId: row.site_id,
        siteName: getRelationName(
          row.site,
          "Site non renseigné"
        ),
        sourceTable:
          "planning_journalier",
        sourceId: row.id,
        daysRemaining: 0,
        actionHref:
          `/dashboard/planning?date=${referenceDate}`,
      })
    }

    if (
      status === "absent" ||
      status === "absence"
    ) {
      alerts.push({
        id: `planning-absence-${row.id}`,
        level: "critical",
        category: "ABSENCE",
        title: "Absence non remplacée",
        message: `${getRelationName(
          row.agent,
          "Agent non renseigné"
        )} · ${row.service || "Créneau non renseigné"}`,
        date: referenceDate,
        agentId: row.agent_id,
        agentName: getRelationName(
          row.agent,
          "Agent non renseigné"
        ),
        siteId: row.site_id,
        siteName: getRelationName(
          row.site,
          "Site non renseigné"
        ),
        sourceTable:
          "planning_journalier",
        sourceId: row.id,
        daysRemaining: 0,
        actionHref:
          `/dashboard/planning?date=${referenceDate}`,
      })
    }
  })

  const assignmentsByAgent = new Map<
    number,
    PlanningRow[]
  >()

  rows.forEach((row) => {
    if (
      row.agent_id === null ||
      normalize(row.statut) === "absent" ||
      normalize(row.statut) === "absence"
    ) {
      return
    }

    const current =
      assignmentsByAgent.get(row.agent_id) ||
      []

    current.push(row)
    assignmentsByAgent.set(
      row.agent_id,
      current
    )
  })

  assignmentsByAgent.forEach(
    (agentAssignments, agentId) => {
      for (
        let i = 0;
        i < agentAssignments.length;
        i += 1
      ) {
        for (
          let j = i + 1;
          j < agentAssignments.length;
          j += 1
        ) {
          const first = agentAssignments[i]
          const second = agentAssignments[j]

          if (
            overlaps(
              first.heure_debut,
              first.heure_fin,
              second.heure_debut,
              second.heure_fin
            ) &&
            String(first.site_id) !==
              String(second.site_id)
          ) {
            alerts.push({
              id: `conflict-${first.id}-${second.id}`,
              level: "critical",
              category: "CONFLIT",
              title:
                "Double affectation détectée",
              message: `${getRelationName(
                first.agent,
                "Agent non renseigné"
              )} est affecté sur deux sites au même horaire.`,
              date: referenceDate,
              agentId,
              agentName: getRelationName(
                first.agent,
                "Agent non renseigné"
              ),
              siteId: first.site_id,
              siteName: getRelationName(
                first.site,
                "Site non renseigné"
              ),
              sourceTable:
                "planning_journalier",
              sourceId: first.id,
              daysRemaining: 0,
              actionHref:
                `/dashboard/planning?date=${referenceDate}&agent=${encodeURIComponent(
                  getRelationName(
                    first.agent,
                    ""
                  )
                )}`,
            })
          }
        }
      }
    }
  )

  return alerts
}

function buildAbsenceAlerts(
  absences: AbsenceRow[],
  planning: PlanningRow[],
  referenceDate: string
) {
  return absences.flatMap((absence) => {
    if (
      absence.statut_validation ===
      "Refusée"
    ) {
      return []
    }

    const hasReplacement =
      planning.some(
        (row) =>
          String(row.agent_id) ===
            String(absence.agent_id) &&
          normalize(row.statut) ===
            "remplacé"
      )

    if (hasReplacement) {
      return []
    }

    return [
      {
        id: `absence-${absence.id}`,
        level: "important" as const,
        category: "ABSENCE" as const,
        title: "Absence à traiter",
        message: `${getRelationName(
          absence.agent,
          "Agent non renseigné"
        )} · ${absence.type || "Absence"}`,
        date: referenceDate,
        agentId: absence.agent_id,
        agentName: getRelationName(
          absence.agent,
          "Agent non renseigné"
        ),
        siteId: null,
        siteName: "Non renseigné",
        sourceTable: "absences",
        sourceId: absence.id,
        daysRemaining: 0,
        actionHref:
          "/dashboard/absences",
      },
    ]
  })
}

function buildDateAlerts<T extends {
  id: string | number
  agent_id: number
  agent?: NamedRelation | NamedRelation[] | null
}>(params: {
  rows: T[]
  referenceDate: string
  category: AlertCategory
  sourceTable: string
  title: string
  label: (row: T) => string
  dueDate: (row: T) => string | null
}) {
  return params.rows.flatMap((row) => {
    const date = params.dueDate(row)

    if (!date) return []

    const daysRemaining =
      getDaysRemaining(
        params.referenceDate,
        date
      )

    const level =
      getDateAlertLevel(daysRemaining)

    if (!level) return []

    return [
      {
        id: `${params.sourceTable}-${row.id}`,
        level,
        category: params.category,
        title: params.title,
        message: buildDateMessage(
          params.label(row),
          daysRemaining
        ),
        date,
        agentId: row.agent_id,
        agentName: getRelationName(
          row.agent,
          `Agent ${row.agent_id}`
        ),
        siteId: null,
        siteName: "Non renseigné",
        sourceTable:
          params.sourceTable,
        sourceId: row.id,
        daysRemaining,
        actionHref:
          `/dashboard/agents/${row.agent_id}`,
      },
    ]
  })
}

function buildContractAlerts(
  rows: ContractRow[],
  referenceDate: string
) {
  const alerts: AlertItem[] = []

  rows.forEach((row) => {
    const agentId =
      typeof row.agent_id === "number"
        ? row.agent_id
        : null

    const agentName =
      getRelationName(
        row.agent,
        agentId
          ? `Agent ${agentId}`
          : "Agent non renseigné"
      )

    const contractLabel =
      getFirstString(row, [
        "type_contrat",
        "type",
        "nature_contrat",
      ]) || "Contrat"

    const endDate =
      getFirstDate(row, [
        "date_fin_contrat",
        "date_fin",
        "fin_contrat",
        "date_echeance",
      ])

    if (endDate) {
      const daysRemaining =
        getDaysRemaining(
          referenceDate,
          endDate
        )

      const level =
        getDateAlertLevel(daysRemaining)

      if (level) {
        alerts.push({
          id: `contract-${String(
            row.id || endDate
          )}`,
          level:
            daysRemaining < 0
              ? "critical"
              : level,
          category: "CONTRAT",
          title:
            daysRemaining < 0
              ? "Contrat expiré"
              : "Fin de contrat à surveiller",
          message: buildDateMessage(
            contractLabel,
            daysRemaining
          ),
          date: endDate,
          agentId,
          agentName,
          siteId: null,
          siteName: "Non renseigné",
          sourceTable:
            "agent_contrats",
          sourceId:
            typeof row.id === "string" ||
            typeof row.id === "number"
              ? row.id
              : null,
          daysRemaining,
          actionHref: agentId
            ? `/dashboard/agents/${agentId}`
            : null,
        })
      }
    }

    const trialDate =
      getFirstDate(row, [
        "fin_periode_essai",
        "date_fin_periode_essai",
        "periode_essai_fin",
      ])

    if (trialDate) {
      const daysRemaining =
        getDaysRemaining(
          referenceDate,
          trialDate
        )

      if (
        daysRemaining >= 0 &&
        daysRemaining <=
          IMPORTANT_WINDOW_DAYS
      ) {
        alerts.push({
          id: `trial-${String(
            row.id || trialDate
          )}`,
          level: "preventive",
          category: "CONTRAT",
          title:
            "Fin de période d’essai",
          message: buildDateMessage(
            contractLabel,
            daysRemaining
          ),
          date: trialDate,
          agentId,
          agentName,
          siteId: null,
          siteName: "Non renseigné",
          sourceTable:
            "agent_contrats",
          sourceId:
            typeof row.id === "string" ||
            typeof row.id === "number"
              ? row.id
              : null,
          daysRemaining,
          actionHref: agentId
            ? `/dashboard/agents/${agentId}`
            : null,
        })
      }
    }
  })

  return alerts
}

function getDateAlertLevel(
  daysRemaining: number
): AlertLevel | null {
  if (daysRemaining < 0) {
    return "important"
  }

  if (
    daysRemaining <=
    IMPORTANT_WINDOW_DAYS
  ) {
    return "important"
  }

  if (
    daysRemaining <=
    PREVENTIVE_WINDOW_DAYS
  ) {
    return "preventive"
  }

  return null
}

function buildDateMessage(
  label: string,
  daysRemaining: number
) {
  if (daysRemaining < 0) {
    const lateDays =
      Math.abs(daysRemaining)

    return `${label} est expiré depuis ${lateDays} jour${
      lateDays > 1 ? "s" : ""
    }.`
  }

  if (daysRemaining === 0) {
    return `${label} arrive à échéance aujourd’hui.`
  }

  return `${label} arrive à échéance dans ${daysRemaining} jour${
    daysRemaining > 1 ? "s" : ""
  }.`
}

function getDaysRemaining(
  referenceDate: string,
  dueDate: string
) {
  const reference = new Date(
    `${referenceDate}T12:00:00`
  )

  const due = new Date(
    `${dueDate}T12:00:00`
  )

  return Math.ceil(
    (due.getTime() -
      reference.getTime()) /
      86_400_000
  )
}

function overlaps(
  startA: string | null,
  endA: string | null,
  startB: string | null,
  endB: string | null
) {
  if (
    !startA ||
    !endA ||
    !startB ||
    !endB
  ) {
    return false
  }

  return (
    toMinutes(startA) <
      toMinutes(endB) &&
    toMinutes(startB) <
      toMinutes(endA)
  )
}

function toMinutes(value: string) {
  const [hours, minutes] = value
    .slice(0, 5)
    .split(":")
    .map(Number)

  return hours * 60 + minutes
}

function compareAlerts(
  first: AlertItem,
  second: AlertItem
) {
  const priority: Record<
    AlertLevel,
    number
  > = {
    critical: 0,
    important: 1,
    preventive: 2,
  }

  const levelComparison =
    priority[first.level] -
    priority[second.level]

  if (levelComparison !== 0) {
    return levelComparison
  }

  return (
    (first.daysRemaining ??
      Number.MAX_SAFE_INTEGER) -
    (second.daysRemaining ??
      Number.MAX_SAFE_INTEGER)
  )
}

function getRelationName(
  relation:
    | NamedRelation
    | NamedRelation[]
    | null
    | undefined,
  fallback: string
) {
  if (Array.isArray(relation)) {
    return relation[0]?.nom || fallback
  }

  return relation?.nom || fallback
}

function normalize(
  value?: string | null
) {
  return String(value || "")
    .trim()
    .toLowerCase()
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

function getFirstString(
  record: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return null
}

function validateDate(date: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(
      new Date(
        `${date}T12:00:00`
      ).getTime()
    )
  ) {
    throw new Error(
      "La date de référence est invalide."
    )
  }
}