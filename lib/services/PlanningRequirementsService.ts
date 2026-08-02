import { supabase } from "@/lib/supabase"
import type { PlanningSlotKey } from "@/lib/planning/slots"

export type PlanningRequirementRow = {
  id: string | number
  site_id: string | number
  slot_key: PlanningSlotKey
  required_agents: number
  created_at?: string | null
  updated_at?: string | null
}

export type PlanningRequirementsBySite = Record<
  string,
  Partial<Record<PlanningSlotKey, number>>
>

function normalizeRequiredAgents(value: unknown) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.trunc(parsed))
}

export const PlanningRequirementsService = {
  async list(): Promise<PlanningRequirementRow[]> {
    const { data, error } = await supabase
      .from("planning_requirements")
      .select(`
        id,
        site_id,
        slot_key,
        required_agents,
        created_at,
        updated_at
      `)
      .order("site_id", { ascending: true })
      .order("slot_key", { ascending: true })

    if (error) {
      throw error
    }

    return ((data || []) as PlanningRequirementRow[]).map(
      (row) => ({
        ...row,
        required_agents: normalizeRequiredAgents(
          row.required_agents
        ),
      })
    )
  },

  async getBySite(
    siteId: string | number
  ): Promise<PlanningRequirementRow[]> {
    const { data, error } = await supabase
      .from("planning_requirements")
      .select(`
        id,
        site_id,
        slot_key,
        required_agents,
        created_at,
        updated_at
      `)
      .eq("site_id", siteId)
      .order("slot_key", { ascending: true })

    if (error) {
      throw error
    }

    return ((data || []) as PlanningRequirementRow[]).map(
      (row) => ({
        ...row,
        required_agents: normalizeRequiredAgents(
          row.required_agents
        ),
      })
    )
  },

  buildBySite(
    rows: PlanningRequirementRow[]
  ): PlanningRequirementsBySite {
    return rows.reduce<PlanningRequirementsBySite>(
      (result, row) => {
        const siteId = String(row.site_id)

        if (!result[siteId]) {
          result[siteId] = {}
        }

        result[siteId][row.slot_key] =
          normalizeRequiredAgents(
            row.required_agents
          )

        return result
      },
      {}
    )
  },

  async updateRequiredAgents({
    siteId,
    slotKey,
    requiredAgents,
  }: {
    siteId: string | number
    slotKey: PlanningSlotKey
    requiredAgents: number
  }) {
    const { data, error } = await supabase
      .from("planning_requirements")
      .upsert(
        {
          site_id: siteId,
          slot_key: slotKey,
          required_agents:
            normalizeRequiredAgents(requiredAgents),
        },
        {
          onConflict: "site_id,slot_key",
        }
      )
      .select(`
        id,
        site_id,
        slot_key,
        required_agents,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      throw error
    }

    return data as PlanningRequirementRow
  },
}

export default PlanningRequirementsService