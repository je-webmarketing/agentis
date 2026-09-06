import { supabase } from "@/lib/supabase"

export type ServiceRecord = {
  id: string | number
  nom: string
  actif: boolean
}

export const ServiceService = {
  async list(): Promise<ServiceRecord[]> {
    const { data, error } = await supabase
      .from("services")
      .select("id, nom, actif")
      .eq("actif", true)
      .order("nom", { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as ServiceRecord[]
  },
}