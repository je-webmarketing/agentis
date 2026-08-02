"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function DeleteAgentButton({
  id,
}: {
  id: number
}) {
  const router = useRouter()

  async function archiverAgent() {
    const ok = confirm(
      "Archiver cet agent ? Il ne sera plus actif mais toutes ses données seront conservées."
    )

    if (!ok) return

    const { error } = await supabase
      .from("agents")
      .update({
        statut: "Inactif",
      })
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={archiverAgent}
      className="ml-2 px-3 py-1 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-800"
    >
      Archiver
    </button>
  )
}