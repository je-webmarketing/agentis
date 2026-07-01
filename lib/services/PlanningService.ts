import { supabase } from "@/lib/supabase"

export const PlanningService = {
  async getAgentPlanning(agentId: string | number) {
    const { data, error } = await supabase
      .from("planning_journalier")
      .select(`
        *,
        site:site_id (
          nom
        )
      `)
      .eq("agent_id", agentId)
      .order("date", {
        ascending: false,
      })

    if (error) throw error

    return data || []
  },

  async getNextAssignments(agentId: string | number) {
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from("planning_journalier")
      .select(`
        *,
        site:site_id (
          nom
        )
      `)
      .eq("agent_id", agentId)
      .gte("date", today)
      .order("date")

    if (error) throw error

    return data || []
  },
}