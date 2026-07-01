"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type DeletePosteButtonProps = {
  id: number
  agentsCount: number
}

export default function DeletePosteButton({
  id,
  agentsCount,
}: DeletePosteButtonProps) {
  const router = useRouter()

  async function supprimer() {
    if (agentsCount > 0) {
      alert(
        "Impossible de supprimer ce poste : des agents y sont encore rattachés.\n\nPassez-le en inactif ou affectez les agents à un autre poste."
      )
      return
    }

    const ok = confirm(
      "Voulez-vous vraiment supprimer ce poste ?"
    )

    if (!ok) return

    const { error } = await supabase
      .from("postes")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    router.push("/dashboard/postes")
    router.refresh()
  }

  return (
    <button
      onClick={supprimer}
      className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition text-white font-semibold"
    >
      Supprimer
    </button>
  )
}