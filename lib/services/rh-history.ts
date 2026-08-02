import { supabase } from "@/lib/supabase"

type HistoryPayload = {
  agentId: number | string
  type: string
  titre?: string
  description: string
  utilisateur?: string
}

export async function addHistory({
  agentId,
  type,
  description,
  utilisateur = "Administrateur",
}: HistoryPayload) {
  const { error } = await supabase
    .from("agent_historique")
    .insert({
      agent_id: Number(agentId),
      type,
      description,
      utilisateur,
      date_evenement: new Date().toISOString(),
    })

  if (error) {
    console.error("Erreur historique RH :", error)
  }
}