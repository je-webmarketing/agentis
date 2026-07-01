import { supabase } from "@/lib/supabase"

export const DashboardService = {
  async getStats() {
    const today = new Date().toISOString().slice(0, 10)
    const limit30 = new Date()
    limit30.setDate(limit30.getDate() + 30)
    const limit30Iso = limit30.toISOString().slice(0, 10)

    const [
      agentsRes,
      actifsRes,
      structuresRes,
      sitesRes,
      servicesRes,
      postesRes,
      absencesTodayRes,
      contratsRes,
      visitesRes,
      formationsRes,
      habilitationsRes,
    ] = await Promise.all([
      supabase.from("agents").select("*", { count: "exact", head: true }),
      supabase
        .from("agents")
        .select("*", { count: "exact", head: true })
        .eq("statut", "Actif"),
      supabase.from("structures").select("*", { count: "exact", head: true }),
      supabase.from("sites").select("*", { count: "exact", head: true }),
      supabase.from("services").select("*", { count: "exact", head: true }),
      supabase.from("postes").select("*", { count: "exact", head: true }),
      supabase
        .from("absences")
        .select("*", { count: "exact", head: true })
        .lte("date_debut", today)
        .gte("date_fin", today),
      supabase
        .from("agent_contrats")
        .select("*", { count: "exact", head: true })
        .not("date_fin", "is", null)
        .gte("date_fin", today)
        .lte("date_fin", limit30Iso),
      supabase
        .from("agent_visites_medicales")
        .select("*", { count: "exact", head: true })
        .not("prochaine_visite", "is", null)
        .gte("prochaine_visite", today)
        .lte("prochaine_visite", limit30Iso),
      supabase
        .from("agent_formations")
        .select("*", { count: "exact", head: true })
        .not("date_expiration", "is", null)
        .gte("date_expiration", today)
        .lte("date_expiration", limit30Iso),
      supabase
        .from("agent_habilitations")
        .select("*", { count: "exact", head: true })
        .not("date_expiration", "is", null)
        .gte("date_expiration", today)
        .lte("date_expiration", limit30Iso),
    ])

    return {
      agents: agentsRes.count || 0,
      agentsActifs: actifsRes.count || 0,
      structures: structuresRes.count || 0,
      sites: sitesRes.count || 0,
      services: servicesRes.count || 0,
      postes: postesRes.count || 0,
      absencesAujourdHui: absencesTodayRes.count || 0,
      contrats30Jours: contratsRes.count || 0,
      visites30Jours: visitesRes.count || 0,
      formations30Jours: formationsRes.count || 0,
      habilitations30Jours: habilitationsRes.count || 0,
    }
  },
}