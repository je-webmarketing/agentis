import { supabase } from "@/lib/supabase"

export type StructureRecord = {
  id: string | number
  nom: string
}

export const StructureService = {
  async list(): Promise<StructureRecord[]> {
    const { data, error } = await supabase
      .from("structures")
      .select("id, nom")
      .order("nom", {
        ascending: true,
      })

    if (error) throw error

    return (data ?? []) as StructureRecord[]
  },
}