import { supabase } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AgentisAuditCheck } from "../types"

type AgentRelation = {
  id: string | number
  nom: string | null
}

type MedicalVisitRow = {
  id: string | number
  agent_id: string | number | null
  date_visite: string | null
  prochaine_visite: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

function getAgent(
  relation: MedicalVisitRow["agent"]
): AgentRelation | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

function getDaysRemaining(
  date: string
): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const visitDate = new Date(
    `${date}T12:00:00`
  )

  return Math.ceil(
    (visitDate.getTime() -
      today.getTime()) /
      86_400_000
  )
}

export class MedicalVisitAudit {
  static async run(
    client: SupabaseClient = supabase
  ): Promise<AgentisAuditCheck[]> {
    const checks: AgentisAuditCheck[] = []

    const { data, error } = await client
      .from("agent_visites_medicales")
      .select(`
        id,
        agent_id,
        date_visite,
        prochaine_visite,
        agent:agent_id (
          id,
          nom
        )
      `)

    if (error) {
      return [
        {
          id: "medical-visit-audit-error",
          module: "visites-medicales",
          label: "Audit des visites médicales",
          status: "error",
          message: error.message,
          severity: "critical",
          metadata: {
            source:
              "agent_visites_medicales",
          },
        },
      ]
    }

    for (
      const visit of (data ??
        []) as MedicalVisitRow[]
    ) {
      /*
       * IMPORTANT :
       * date_visite = historique
       * prochaine_visite = échéance à surveiller
       */
      if (!visit.prochaine_visite) {
        continue
      }

      const forecastDate =
        visit.prochaine_visite

      const agent = getAgent(
        visit.agent
      )

      const agentName =
        agent?.nom
          ?.replace(/\s+/g, " ")
          .trim() ||
        "Agent non renseigné"

      const agentId =
        agent?.id ??
        visit.agent_id

      const daysRemaining =
        getDaysRemaining(
          forecastDate
        )

      if (daysRemaining < 0) {
        checks.push({
          id:
            `medical-visit-expired-${visit.id}`,
          module:
            "visites-medicales",
          label:
            "Visite médicale échue",
          status: "error",
          message:
            `${agentName} : prochaine visite médicale échue depuis le ${forecastDate}.`,
          severity: "critical",
          metadata: {
            medicalVisitId:
              visit.id,
            agentId,
            agentName,
            lastVisitDate:
              visit.date_visite,
            nextVisitDate:
              forecastDate,
            daysRemaining,
          },
        })

        continue
      }

      if (daysRemaining <= 30) {
        checks.push({
          id:
            `medical-visit-upcoming-${visit.id}`,
          module:
            "visites-medicales",
          label:
            "Visite médicale proche de l’échéance",
          status: "warning",
          message:
            `${agentName} : prochaine visite médicale prévue le ${forecastDate}.`,
          severity: "warning",
          metadata: {
            medicalVisitId:
              visit.id,
            agentId,
            agentName,
            lastVisitDate:
              visit.date_visite,
            nextVisitDate:
              forecastDate,
            daysRemaining,
          },
        })
      }
    }

    if (checks.length === 0) {
      checks.push({
        id: "medical-visits-valid",
        module:
          "visites-medicales",
        label:
          "Visites médicales",
        status: "success",
        message:
          "Aucune prochaine visite médicale échue ou arrivant à échéance sous 30 jours.",
        severity: "success",
        metadata: {
          checkedMedicalVisits:
            data?.length ?? 0,
        },
      })
    }

    return checks
  }
}