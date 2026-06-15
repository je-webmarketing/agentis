import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  const body = await request.json()
  const { affectations, date } = body

  const lignes: any[] = []
  let agentsCrees = 0
  let sitesCrees = 0
  let lignesIgnorees = 0

  await supabase
    .from("planning_journalier")
    .delete()
    .eq("date", date)

  for (const item of affectations) {
    const nom = item.nom
      ?.replace(/\/?\d+h\d*/gi, "")
      ?.replace(/-\s*$/g, "")
      ?.trim()

    const centre = item.centre?.trim()

    if (!nom) {
      lignesIgnorees++
      continue
    }

    let { data: agent } = await supabase
      .from("agents")
      .select("id")
      .ilike("nom", nom)
      .maybeSingle()

    if (!agent) {
      const { data: newAgent } = await supabase
        .from("agents")
        .insert({
          nom,
          statut: "Actif",
          temps: "35h",
          service: "",
        })
        .select("id")
        .single()

      agent = newAgent
      agentsCrees++
    }

    let siteId = null

    if (centre) {
      let { data: site } = await supabase
        .from("sites")
        .select("id")
        .ilike("nom", centre)
        .maybeSingle()

      if (!site) {
        const { data: newSite } = await supabase
          .from("sites")
          .insert({
            nom: centre,
            actif: true,
          })
          .select("id")
          .single()

        site = newSite
        sitesCrees++
      }

      siteId = site?.id || null
    }

    if (!agent?.id) {
      lignesIgnorees++
      continue
    }

   lignes.push({
  date,
  agent_id: agent.id,
  site_id: siteId,
  service: null,
  heure_debut: item.heure_debut,
  heure_fin: item.heure_fin,
  statut: item.statut,
  commentaire: item.brut,
})
  }

  const { error } = await supabase
    .from("planning_journalier")
    .insert(lignes)

  if (error) {
    return NextResponse.json({
      success: false,
      message: error.message,
    })
  }

  return NextResponse.json({
    success: true,
    imported: lignes.length,
    agentsCrees,
    sitesCrees,
    lignesIgnorees,
  })
}