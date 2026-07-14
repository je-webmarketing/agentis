import { supabase } from "@/lib/supabase"

export type DocumentPayload = {
  agent_id: string | number
  categorie: string
  nom: string
  fichier_url: string
  date_document: string
  date_expiration?: string | null
  commentaire?: string | null
}

export const DocumentService = {
  async getAgentDocuments(agentId: string | number) {
    const { data, error } = await supabase
      .from("agent_documents")
      .select("*")
      .eq("agent_id", agentId)
      .order("date_document", { ascending: false })

    if (error) throw error

    return data ?? []
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

    return count ?? 0
  },

  async list() {
    const { data, error } = await supabase
      .from("agent_documents")
      .select(`
        *,
        agent:agent_id (
          id,
          nom
        )
      `)
      .order("date_document", { ascending: false })

    if (error) throw error

    return data ?? []
  },

  async create(payload: DocumentPayload) {
    const { data, error } = await supabase
      .from("agent_documents")
      .insert({
        agent_id: payload.agent_id,
        categorie: payload.categorie,
        nom: payload.nom,
        fichier_url: payload.fichier_url,
        date_document: payload.date_document,
        date_expiration: payload.date_expiration || null,
        commentaire: payload.commentaire || null,
      })
      .select()
      .single()

    if (error) throw error

    return data
  },

  async update(
    id: number | string,
    payload: Partial<DocumentPayload>
  ) {
    const { data, error } = await supabase
      .from("agent_documents")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data
  },

  async delete(id: number | string) {
    const { error } = await supabase
      .from("agent_documents")
      .delete()
      .eq("id", id)

    if (error) throw error

    return true
  },

  async upload(file: File, agentId: string | number) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf"

    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")

    const filePath =
      `${agentId}/${Date.now()}-${safeName}.${extension}`

    const { error } = await supabase.storage
      .from("documents-rh")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) throw error

    return filePath
  },

  async createSignedUrl(filePath: string) {
    const { data, error } = await supabase.storage
      .from("documents-rh")
      .createSignedUrl(filePath, 60 * 10)

    if (error) throw error

    return data.signedUrl
  },

  async deleteFile(filePath: string) {
    if (!filePath) return true

    const { error } = await supabase.storage
      .from("documents-rh")
      .remove([filePath])

    if (error) throw error

    return true
  },
}