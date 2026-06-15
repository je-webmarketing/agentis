"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AbsenceActions({
  id,
  statut,
}: {
  id: number
  statut: string
}) {
  const router = useRouter()

  async function updateStatus(status: string) {
    const { error } = await supabase
      .from("absences")
      .update({ statut_validation: status })
      .eq("id", id)

    if (error) {
      alert("Erreur")
      console.log(error)
      return
    }

    router.refresh()
  }

  if (statut !== "En attente") {
    return (
      <span className="text-slate-500 text-sm">
        Traité
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => updateStatus("Validée")}
        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm"
      >
        Valider
      </button>

      <button
        onClick={() => updateStatus("Refusée")}
        className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm"
      >
        Refuser
      </button>
    </div>
  )
}