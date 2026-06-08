"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function DeleteAgentButton({ id }: { id: number }) {
  const router = useRouter()

  async function supprimerAgent() {
    const ok = confirm("Supprimer cet agent ?")

    if (!ok) return

    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", id)

    if (error) {
      alert("Erreur suppression")
      console.log(error)
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={supprimerAgent}
      className="ml-2 px-3 py-1 rounded-lg bg-red-500 text-white text-sm"
    >
      Supprimer
    </button>
  )
}