"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function DeleteServiceButton({
  id,
  agentsCount,
  postesCount,
}: {
  id: number
  agentsCount: number
  postesCount: number
}) {
  const router = useRouter()

  async function supprimerService() {
    if (agentsCount > 0 || postesCount > 0) {
      alert(
        "Impossible de supprimer ce service : des agents ou des postes y sont encore rattachés. Passez-le en inactif à la place."
      )
      return
    }

    const confirmation = confirm(
      "Voulez-vous vraiment supprimer ce service ? Cette action est définitive."
    )

    if (!confirmation) return

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    router.push("/dashboard/services")
    router.refresh()
  }

  return (
    <button
      onClick={supprimerService}
      className="px-6 py-3 rounded-xl bg-red-500 text-white font-semibold"
    >
      Supprimer
    </button>
  )
}