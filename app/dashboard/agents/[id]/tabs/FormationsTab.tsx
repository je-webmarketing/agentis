"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Props = {
  agentId: string
}

export default function FormationsTab({ agentId }: Props) {
  const [formations, setFormations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFormations() {
      const { data } = await supabase
        .from("agent_formations")
        .select("*")
        .eq("agent_id", agentId)
        .order("date_formation", { ascending: false })

      setFormations(data || [])
      setLoading(false)
    }

    loadFormations()
  }, [agentId])

  if (loading) {
    return <p className="text-slate-400">Chargement des formations...</p>
  }

  if (formations.length === 0) {
    return (
      <div className="text-slate-400">
        Aucune formation enregistrée.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {formations.map((formation) => (
        <div
          key={formation.id}
          className="rounded-xl border border-slate-700 p-4 bg-[#111827]"
        >
          <h3 className="font-semibold text-yellow-400">
            {formation.formation}
          </h3>

          <p className="text-sm text-slate-400">
            Organisme : {formation.organisme || "Non renseigné"}
          </p>

          <p className="text-sm text-slate-400">
            Date : {formation.date_formation || "-"}
          </p>

          <p className="text-sm text-slate-400">
            Expiration : {formation.date_expiration || "Aucune"}
          </p>

          {formation.commentaire && (
            <p className="mt-2 text-sm">
              {formation.commentaire}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}