"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function NewAgentPage() {
  const [nom, setNom] = useState("")
  const [service, setService] = useState("")
  const [statut, setStatut] = useState("Actif")
  const [temps, setTemps] = useState("35h")

  const router = useRouter()

  async function ajouterAgent() {
    const { error } = await supabase.from("agents").insert([
      { nom, service, statut, temps },
    ])

    if (error) {
      alert("Erreur lors de l’ajout")
      console.log(error)
      return
    }

    router.push("/dashboard/agents")
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link href="/dashboard/agents" className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]">
        ← Retour Agents
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold">Ajouter un agent</h1>
        <p className="text-slate-400">Créer une nouvelle fiche agent</p>
      </div>

      <form className="max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-5">
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet" className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3" />
        <input value={service} onChange={(e) => setService(e.target.value)} placeholder="Service" className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3" />
        <input value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3" />
        <input value={temps} onChange={(e) => setTemps(e.target.value)} className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3" />

        <button type="button" onClick={ajouterAgent} className="px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold">
          Enregistrer l’agent
        </button>
      </form>
    </div>
  )
}