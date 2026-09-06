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

   let siteId: number | null = null

if (centre) {
  let { data: site } = await supabase
    .from("sites")
    .select("id")
    .ilike("nom", centre)
    .maybeSingle()

  if (!site) {
    const { data: newSite, error: siteCreateError } =
      await supabase
        .from("sites")
        .insert({
          nom: centre,
          actif: true,
        })
        .select("id")
        .single()

    if (siteCreateError) {
      console.error(
        "Erreur création site :",
        siteCreateError
      )
    }

    site = newSite
    sitesCrees++
  }

  siteId = site?.id ?? null
}

/*
 * Recherche de l'agent.
 * On récupère également son site actuel.
 */
let { data: agent } = await supabase
  .from("agents")
  .select("id, site_id")
  .ilike("nom", nom)
  .maybeSingle()

if (!agent) {
  /*
   * Nouvel agent :
   * on mémorise immédiatement son site.
   */
  const {
    data: newAgent,
    error: agentCreateError,
  } = await supabase
    .from("agents")
    .insert({
      nom,
      statut: "Actif",
      temps: "35h",
      service: "",
      site_id: siteId,
    })
    .select("id, site_id")
    .single()

  if (agentCreateError) {
    console.error(
      "Erreur création agent :",
      agentCreateError
    )
  }

  agent = newAgent
  agentsCrees++
} else if (
  siteId !== null &&
  agent.site_id === null
) {
  /*
   * Ancien agent sans site :
   * on complète son rattachement.
   *
   * On n'écrase jamais un site déjà renseigné.
   */
  const {
    data: updatedAgent,
    error: agentUpdateError,
  } = await supabase
    .from("agents")
    .update({
      site_id: siteId,
    })
    .eq("id", agent.id)
    .select("id, site_id")
    .single()

  if (agentUpdateError) {
    console.error(
      "Erreur rattachement agent/site :",
      agentUpdateError
    )
  } else {
    agent = updatedAgent
  }
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