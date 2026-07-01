import { supabase } from "@/lib/supabase"

export const AgentService = {
  async getById(id: string | number) {
    const { data, error } = await supabase
      .from("agents")
      .select(`
        *,
        poste:poste_id (id, nom),
        service_ref:service_id (id, nom),
        site:site_id (id, nom, structure_id)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  async list() {
    const { data, error } = await supabase
      .from("agents")
      .select(`
        *,
        poste:poste_id (id, nom),
        service_ref:service_id (id, nom),
        site:site_id (id, nom, structure_id)
      `)
      .order("nom", { ascending: true })

    if (error) throw error
    return data || []
  },

  async update(id: string | number, payload: any) {
    const { data, error } = await supabase
      .from("agents")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}