"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Props = {
  agentId: string
}

export default function CoordonneesTab({ agentId }: Props) {
  const [coordonnees, setCoordonnees] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCoordonnees() {
      const { data } = await supabase
        .from("agent_coordonnees")
        .select("*")
        .eq("agent_id", agentId)
        .maybeSingle()

      setCoordonnees(data)
      setLoading(false)
    }

    loadCoordonnees()
  }, [agentId])

  if (loading) {
    return <p className="text-slate-400">Chargement des coordonnées...</p>
  }

  if (!coordonnees) {
    return (
      <div className="text-slate-400">
        Aucune coordonnée renseignée pour cet agent.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-slate-500 text-sm">Adresse</p>
        <p>{coordonnees.adresse || "Non renseignée"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Code postal / Ville</p>
        <p>
          {[coordonnees.code_postal, coordonnees.ville]
            .filter(Boolean)
            .join(" ") || "Non renseigné"}
        </p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Téléphone</p>
        <p>{coordonnees.telephone || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Mobile</p>
        <p>{coordonnees.mobile || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Email professionnel</p>
        <p>{coordonnees.email_pro || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Email personnel</p>
        <p>{coordonnees.email_perso || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Contact urgence</p>
        <p>{coordonnees.contact_urgence || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Téléphone urgence</p>
        <p>{coordonnees.telephone_urgence || "Non renseigné"}</p>
      </div>
    </div>
  )
}