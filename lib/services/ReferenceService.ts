import { supabase } from "@/lib/supabase"

export const ReferenceService = {
  async getStructures() {
    const { data, error } = await supabase
      .from("structures")
      .select("*")
      .order("nom")

    if (error) throw error
    return data || []
  },

  async getSites() {
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .order("nom")

    if (error) throw error
    return data || []
  },

  async getServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("nom")

    if (error) throw error
    return data || []
  },

  async getPostes() {
    const { data, error } = await supabase
      .from("postes")
      .select("*")
      .order("nom")

    if (error) throw error
    return data || []
  },
}