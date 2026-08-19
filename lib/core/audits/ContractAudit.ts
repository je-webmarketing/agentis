import { supabase } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AgentisAuditCheck } from "../types"

type AgentRelation = {
  id: string | number
  nom: string | null
}

type ContractRow = {
  id: string | number
  agent_id: string | number | null
  type_contrat: string | null
  date_fin: string | null
  statut: string | null
  agent:
    | AgentRelation
    | AgentRelation[]
    | null
}

function getAgent(
  relation: ContractRow["agent"]
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

  const endDate = new Date(
    `${date}T12:00:00`
  )

  return Math.ceil(
    (endDate.getTime() -
      today.getTime()) /
      86_400_000
  )
}

function isContractClosed(
  status: string | null
): boolean {
  const normalized = String(
    status || ""
  )
    .trim()
    .toLowerCase()

  return [
    "terminé",
    "termine",
    "expiré",
    "expire",
    "clos",
    "clôturé",
    "cloture",
  ].includes(normalized)
}

export class ContractAudit {
  static async run(
    client: SupabaseClient = supabase
  ): Promise<AgentisAuditCheck[]> {
    const checks: AgentisAuditCheck[] = []

    const { data, error } = await client
      .from("agent_contrats")
      .select(`
        id,
        agent_id,
        type_contrat,
        date_fin,
        statut,
        agent:agent_id (
          id,
          nom
        )
      `)

    if (error) {
      return [
        {
          id: "contract-audit-error",
          module: "agents",
          label: "Audit des contrats",
          status: "error",
          message: error.message,
          severity: "critical",
          metadata: {
            source: "agent_contrats",
          },
        },
      ]
    }

    for (
      const contract of (data ??
        []) as ContractRow[]
    ) {
      if (!contract.date_fin) {
        continue
      }

      /*
       * Un contrat explicitement terminé
       * n'est plus une anomalie à traiter.
       */
      if (
        isContractClosed(
          contract.statut
        )
      ) {
        continue
      }

      const agent = getAgent(
        contract.agent
      )

      const agentName =
        agent?.nom
          ?.replace(/\s+/g, " ")
          .trim() ||
        "Agent non renseigné"

      const agentId =
        agent?.id ??
        contract.agent_id

      const contractLabel =
        contract.type_contrat
          ?.trim() ||
        "Contrat"

      const daysRemaining =
        getDaysRemaining(
          contract.date_fin
        )

      if (daysRemaining < 0) {
        checks.push({
          id:
            `contract-expired-${contract.id}`,
          module: "agents",
          label:
            `Contrat expiré : ${contractLabel}`,
          status: "error",
          message:
            `${agentName} : contrat "${contractLabel}" expiré le ${contract.date_fin}.`,
          severity: "critical",
          metadata: {
            contractId:
              contract.id,
            agentId,
            agentName,
            contractType:
              contractLabel,
            endDate:
              contract.date_fin,
            daysRemaining,
          },
        })

        continue
      }

      if (daysRemaining <= 30) {
        checks.push({
          id:
            `contract-expiring-${contract.id}`,
          module: "agents",
          label:
            `Contrat proche de l’échéance : ${contractLabel}`,
          status: "warning",
          message:
            `${agentName} : contrat "${contractLabel}" arrivant à échéance le ${contract.date_fin}.`,
          severity: "warning",
          metadata: {
            contractId:
              contract.id,
            agentId,
            agentName,
            contractType:
              contractLabel,
            endDate:
              contract.date_fin,
            daysRemaining,
          },
        })
      }
    }

    if (checks.length === 0) {
      checks.push({
        id: "contracts-valid",
        module: "agents",
        label: "Contrats",
        status: "success",
        message:
          "Aucun contrat actif expiré ou arrivant à échéance sous 30 jours.",
        severity: "success",
        metadata: {
          checkedContracts:
            data?.length ?? 0,
        },
      })
    }

    return checks
  }
}