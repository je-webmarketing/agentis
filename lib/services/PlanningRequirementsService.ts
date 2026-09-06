import { supabase } from "@/lib/supabase"
import type { PlanningSlotKey } from "@/lib/planning/slots"


export const planningRequirementRoles = [
  {
    key: "non_precise",
    label: "Non précisé",
  },
  {
    key: "surveillant",
    label: "Surveillant",
  },
  {
    key: "enseignant",
    label: "Enseignant / Instituteur",
  },
  {
    key: "atsem",
    label: "ATSEM",
  },
  {
    key: "cuisinier",
    label: "Cuisinier",
  },
  {
    key: "agent_restauration",
    label: "Agent de restauration",
  },
  {
    key: "animateur",
    label: "Animateur",
  },
  {
    key: "agent_technique",
    label: "Agent technique",
  },
] as const

export type PlanningRequirementRoleKey =
  (typeof planningRequirementRoles)[number]["key"]

export type PlanningRequirementSlotKey =
  | PlanningSlotKey
  | "periscolaire"

export type PlanningRequirementRow = {
  id: string | number
  site_id: string | number
 slot_key: PlanningRequirementSlotKey
  role_key: PlanningRequirementRoleKey
  required_agents: number
  created_at?: string | null
  updated_at?: string | null
}

export type PlanningRequirementsBySite = Record<
  string,
  Partial<
    Record<
      PlanningRequirementSlotKey,
      Partial<
        Record<
          PlanningRequirementRoleKey,
          number
        >
      >
    >
  >
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
        role_key,
        required_agents,
        created_at,
        updated_at
      `)
      .order("site_id", { ascending: true })
      .order("slot_key", { ascending: true })
      .order("role_key", { ascending: true })

    if (error) {
      throw error
    }

    return ((data || []) as PlanningRequirementRow[]).map(
      (row) => ({
        ...row,
        required_agents:
          normalizeRequiredAgents(
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
        role_key,
        required_agents,
        created_at,
        updated_at
      `)
      .eq("site_id", siteId)
      .order("slot_key", { ascending: true })
      .order("role_key", { ascending: true })

    if (error) {
      throw error
    }

    return ((data || []) as PlanningRequirementRow[]).map(
      (row) => ({
        ...row,
        required_agents:
          normalizeRequiredAgents(
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

        if (!result[siteId][row.slot_key]) {
          result[siteId][row.slot_key] = {}
        }

        result[siteId][row.slot_key]![
          row.role_key
        ] = normalizeRequiredAgents(
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
    roleKey,
    requiredAgents,
  }: {
    siteId: string | number
    slotKey: PlanningSlotKey
    roleKey: PlanningRequirementRoleKey
    requiredAgents: number
  }) {
    const { data, error } = await supabase
      .from("planning_requirements")
      .upsert(
        {
          site_id: siteId,
          slot_key: slotKey,
          role_key: roleKey,
          required_agents:
            normalizeRequiredAgents(
              requiredAgents
            ),
        },
        {
          onConflict:
            "site_id,slot_key,role_key",
        }
      )
      .select(`
        id,
        site_id,
        slot_key,
        role_key,
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

  async deleteRequirement({
  siteId,
  slotKey,
  roleKey,
}: {
  siteId: string | number
  slotKey: PlanningSlotKey
  roleKey: PlanningRequirementRoleKey
}) {
  const { error } = await supabase
    .from("planning_requirements")
    .delete()
    .eq("site_id", siteId)
    .eq("slot_key", slotKey)
    .eq("role_key", roleKey)

  if (error) {
    throw error
  }
},
}

export default PlanningRequirementsService