"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Props = {
  agentId: string
}

export default function ContratTab({ agentId }: Props) {
  const [contrat, setContrat] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContrat() {
      const { data } = await supabase
        .from("agent_contrats")
        .select("*")
        .eq("agent_id", agentId)
        .order("date_debut", { ascending: false })
        .limit(1)
        .maybeSingle()

      setContrat(data)
      setLoading(false)
    }

    loadContrat()
  }, [agentId])

  if (loading) {
    return <p className="text-slate-400">Chargement du contrat...</p>
  }

  if (!contrat) {
    return (
      <div className="text-slate-400">
        Aucun contrat renseigné pour cet agent.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-slate-500 text-sm">Type de contrat</p>
        <p>{contrat.type_contrat || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Statut</p>
        <p>{contrat.statut || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Grade</p>
        <p>{contrat.grade || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Cadre d'emploi</p>
        <p>{contrat.cadre_emploi || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Date de début</p>
        <p>{contrat.date_debut || "Non renseignée"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Date de fin</p>
        <p>{contrat.date_fin || "Non renseignée"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Temps de travail</p>
        <p>{contrat.temps_travail || "Non renseigné"}</p>
      </div>

      <div>
        <p className="text-slate-500 text-sm">Indice / Échelon</p>
        <p>
          {[contrat.indice, contrat.echelon].filter(Boolean).join(" / ") ||
            "Non renseigné"}
        </p>
      </div>
    </div>
  )
}