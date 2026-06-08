"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [nom, setNom] = useState("")
  const [service, setService] = useState("")
  const [statut, setStatut] = useState("")
  const [temps, setTemps] = useState("")

  useEffect(() => {
    async function chargerAgent() {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        alert("Erreur chargement agent")
        return
      }

      setNom(data.nom)
      setService(data.service)
      setStatut(data.statut)
      setTemps(data.temps)
    }

    chargerAgent()
  }, [id])

  async function modifierAgent() {
    const { error } = await supabase
      .from("agents")
      .update({ nom, service, statut, temps })
      .eq("id", id)

    if (error) {
      alert("Erreur modification")
      return
    }

    router.push("/dashboard/agents")
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/agents"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Agents
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold">Modifier un agent</h1>
        <p className="text-slate-400">Mettre à jour les informations</p>
      </div>

      <div className="max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-5">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        />

        <input
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        />

        <input
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        />

        <input
          value={temps}
          onChange={(e) => setTemps(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        />

        <button
          onClick={modifierAgent}
          className="px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          Enregistrer les modifications
        </button>
      </div>
    </div>
  )
}