import { supabase } from "@/lib/supabase"
import { getExpiryAlert, RHAlert } from "@/lib/rh-alerts"

export const AlertService = {
  async getAgentAlerts(agentId: string | number): Promise<RHAlert[]> {
    const alerts: RHAlert[] = []

    const { data: contrat } = await supabase
      .from("agent_contrats")
      .select("*")
      .eq("agent_id", agentId)
      .order("date_debut", { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: visite } = await supabase
      .from("agent_visites_medicales")
      .select("*")
      .eq("agent_id", agentId)
      .order("date_visite", { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: formations } = await supabase
      .from("agent_formations")
      .select("*")
      .eq("agent_id", agentId)

    const { data: habilitations } = await supabase
      .from("agent_habilitations")
      .select("*")
      .eq("agent_id", agentId)

    const contratAlert = getExpiryAlert({
      title: "Contrat",
      date: contrat?.date_fin,
      warningDays: 30,
      target: "Contrat",
    })

    if (contratAlert) alerts.push(contratAlert)

    const visiteAlert = getExpiryAlert({
      title: "Visite médicale",
      date: visite?.prochaine_visite,
      warningDays: 30,
      target: "Santé",
    })

    if (visiteAlert) alerts.push(visiteAlert)

    ;(formations || []).forEach((formation) => {
      const alert = getExpiryAlert({
        title: formation.formation || "Formation",
        date: formation.date_expiration,
        warningDays: 30,
        target: "Formation",
      })

      if (alert) alerts.push(alert)
    })

    ;(habilitations || []).forEach((habilitation) => {
      const alert = getExpiryAlert({
        title: habilitation.habilitation || "Habilitation",
        date: habilitation.date_expiration,
        warningDays: 30,
        target: "Habilitation",
      })

      if (alert) alerts.push(alert)
    })

    return alerts
  },
}