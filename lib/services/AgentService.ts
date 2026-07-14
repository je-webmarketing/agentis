import { supabase } from "@/lib/supabase"

export const AgentService = {
  async list() {
    const { data, error } = await supabase
      .from("agents")
      .select(`
        *,
        poste:poste_id(id, nom),
        service_ref:service_id(id, nom),
        site:site_id(id, nom, structure_id)
      `)
      .order("nom")

    if (error) throw error
    return data ?? []
  },

  async getById(id: string | number) {
    const { data, error } = await supabase
      .from("agents")
      .select(`
        *,
        poste:poste_id(id, nom),
        service_ref:service_id(id, nom),
        site:site_id(id, nom, structure_id)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  async create(payload: any) {
    const { data, error } = await supabase
      .from("agents")
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
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

  async delete(id: string | number) {
    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", id)

    if (error) throw error
    return true
  },

  async getBySite(siteId: string | number) {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("site_id", siteId)
      .order("nom")

    if (error) throw error
    return data ?? []
  },

  async search(search: string) {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .ilike("nom", `%${search}%`)
      .order("nom")

    if (error) throw error
    return data ?? []
  },
}