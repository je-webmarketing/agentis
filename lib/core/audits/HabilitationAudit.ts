import { supabase } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AgentisAuditCheck } from "../types"

type AgentRelation = {
  id: string | number
  nom: string | null
}

type HabilitationRow = {
  id: string | number
  agent_id: string | number | null
  habilitation: string | null
  date_expiration: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

function getAgent(
  relation: HabilitationRow["agent"]
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

  const expirationDate = new Date(
    `${date}T12:00:00`
  )

  return Math.ceil(
    (expirationDate.getTime() -
      today.getTime()) /
      86_400_000
  )
}

export class HabilitationAudit {
  static async run(
    client: SupabaseClient = supabase
  ): Promise<AgentisAuditCheck[]> {
    const checks: AgentisAuditCheck[] = []

    const { data, error } = await client
      .from("agent_habilitations")
      .select(`
        id,
        agent_id,
        habilitation,
        date_expiration,
        agent:agent_id (
          id,
          nom
        )
      `)

    if (error) {
      return [
        {
          id: "habilitation-audit-error",
          module: "habilitations",
          label: "Audit des habilitations",
          status: "error",
          message: error.message,
          severity: "critical",
          metadata: {
            source: "agent_habilitations",
          },
        },
      ]
    }

    for (
      const habilitation of (data ??
        []) as HabilitationRow[]
    ) {
      if (!habilitation.date_expiration) {
        continue
      }

      const agent = getAgent(
        habilitation.agent
      )

      const agentName =
        agent?.nom
          ?.replace(/\s+/g, " ")
          .trim() ||
        "Agent non renseigné"

      /*
       * IMPORTANT :
       * on utilise en priorité l'id de la même
       * relation qui fournit le nom affiché.
       *
       * Ainsi le nom et le lien pointent
       * obligatoirement vers le même agent.
       */
      const agentId =
        agent?.id ??
        habilitation.agent_id

      const habilitationName =
        habilitation.habilitation
          ?.trim() ||
        "Habilitation non renseignée"

      const daysRemaining =
        getDaysRemaining(
          habilitation.date_expiration
        )

      if (daysRemaining < 0) {
        checks.push({
          id:
            `habilitation-expired-${habilitation.id}`,
          module: "habilitations",
          label:
            `Habilitation expirée : ${habilitationName}`,
          status: "error",
          message:
            `${agentName} : habilitation "${habilitationName}" expirée le ${habilitation.date_expiration}.`,
          severity: "critical",
          metadata: {
            habilitationId:
              habilitation.id,
            agentId,
            agentName,
            habilitationName,
            expirationDate:
              habilitation.date_expiration,
            daysRemaining,
          },
        })

        continue
      }

      if (daysRemaining <= 30) {
        checks.push({
          id:
            `habilitation-expiring-${habilitation.id}`,
          module: "habilitations",
          label:
            `Habilitation proche de l’échéance : ${habilitationName}`,
          status: "warning",
          message:
            `${agentName} : habilitation "${habilitationName}" arrivant à échéance le ${habilitation.date_expiration}.`,
          severity: "warning",
          metadata: {
            habilitationId:
              habilitation.id,
            agentId,
            agentName,
            habilitationName,
            expirationDate:
              habilitation.date_expiration,
            daysRemaining,
          },
        })
      }
    }

    if (checks.length === 0) {
      checks.push({
        id: "habilitations-valid",
        module: "habilitations",
        label: "Habilitations",
        status: "success",
        message:
          "Aucune habilitation expirée ou arrivant à échéance sous 30 jours.",
        severity: "success",
        metadata: {
          checkedHabilitations:
            data?.length ?? 0,
        },
      })
    }

    return checks
  }
}