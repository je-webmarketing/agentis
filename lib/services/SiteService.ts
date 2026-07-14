import { supabase } from "@/lib/supabase"

export const SiteService = {
  async list() {
    const { data, error } = await supabase
      .from("sites")
      .select(`
        id,
        nom,
        type,
        adresse,
        secteur,
        actif,
        structure_id
      `)
      .order("nom", { ascending: true })

    if (error) throw error

    return data ?? []
  },

  async getById(id: string | number) {
    const { data, error } = await supabase
      .from("sites")
      .select(`
        id,
        nom,
        type,
        adresse,
        secteur,
        actif,
        structure_id
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return data
  },
}