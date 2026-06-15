"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewPlanningPage() {
  const router = useRouter()

  const [agents, setAgents] = useState<any[]>([])
  const [agentId, setAgentId] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [statut, setStatut] = useState("Présent")
  const [service, setService] = useState("")

  useEffect(() => {
    async function loadAgents() {
      const { data } = await supabase
        .from("agents")
        .select("id, nom, service")
        .order("nom")

      if (data) setAgents(data)
    }

    loadAgents()
  }, [])

  function handleAgentChange(value: string) {
    setAgentId(value)

    const agent = agents.find((a) => String(a.id) === value)
    if (agent) setService(agent.service)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (dateFin && dateFin < dateDebut) {
      alert("La date de fin doit être après la date de début")
      return
    }

    if (statut === "Présent") {
      const { error } = await supabase.from("planning").insert([
        {
          agent_id: Number(agentId),
          date: dateDebut,
          statut,
          service,
        },
      ])

      if (error) {
        alert("Erreur planning")
        console.log(error)
        return
      }
    } else {
      const { error } = await supabase.from("absences").insert([
        {
          agent_id: Number(agentId),
          type: statut,
          date_debut: dateDebut,
          date_fin: dateFin || dateDebut,
          commentaire: "",
          statut_validation: "En attente",
        },
      ])

      if (error) {
        alert("Erreur absence")
        console.log(error)
        return
      }
    }

    router.push("/dashboard/planning")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/planning"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Planning
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold">Ajouter une affectation</h1>
        <p className="text-slate-400">Présence ou absence avec période</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <select
          value={agentId}
          onChange={(e) => handleAgentChange(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#020817] border border-slate-700"
          required
        >
          <option value="">Sélectionner un agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.nom}
            </option>
          ))}
        </select>

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#020817] border border-slate-700"
        >
          <option>Présent</option>
          <option>Congé</option>
          <option>RTT</option>
          <option>Formation</option>
          <option>Absence</option>
          <option>Maladie</option>
        </select>

        <input
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#020817] border border-slate-700"
          required
        />

        <input
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#020817] border border-slate-700"
        />

        <input
          type="text"
          placeholder="Service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#020817] border border-slate-700"
          required
        />

        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          Enregistrer
        </button>
      </form>
    </div>
  )
}