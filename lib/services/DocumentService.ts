import { supabase } from "@/lib/supabase"

export const DocumentService = {
  async getAgentDocuments(agentId: string | number) {
    const { data, error } = await supabase
      .from("agent_documents")
      .select("*")
      .eq("agent_id", agentId)
      .order("date_document", { ascending: false })

    if (error) throw error

    return data || []
  },

  async count(agentId: string | number) {
    const { count, error } = await supabase
      .from("agent_documents")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("agent_id", agentId)

    if (error) throw error

    return count || 0
  },
}