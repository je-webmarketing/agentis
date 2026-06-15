"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function NewAgentPage() {
  const router = useRouter()

  const [nom, setNom] = useState("")
  const [statut, setStatut] = useState("Actif")
  const [temps, setTemps] = useState("35h")

  const [posteId, setPosteId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [siteId, setSiteId] = useState("")

  const [postes, setPostes] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: postesData } = await supabase
        .from("postes")
        .select("*")
        .order("nom")

      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .order("nom")

      const { data: sitesData } = await supabase
        .from("sites")
        .select("*")
        .order("nom")

      setPostes(postesData || [])
      setServices(servicesData || [])
      setSites(sitesData || [])
    }

    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase
      .from("agents")
      .insert([
        {
          nom,
          statut,
          temps,
          poste_id: posteId ? Number(posteId) : null,
          service_id: serviceId ? Number(serviceId) : null,
          site_id: siteId ? Number(siteId) : null,
        },
      ])

    if (error) {
      console.error(error)
      alert("Erreur lors de l'ajout")
      return
    }

    router.push("/dashboard/agents")
    router.refresh()
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
        <h1 className="text-3xl font-bold">Ajouter un agent</h1>
        <p className="text-slate-400">
          Création d'un nouvel agent
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-5"
      >
        <input
          type="text"
          placeholder="Nom de l'agent"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
          required
        />

        <select
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option value="">Sélectionner un site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.nom}
            </option>
          ))}
        </select>

        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option value="">Sélectionner un service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nom}
            </option>
          ))}
        </select>

        <select
          value={posteId}
          onChange={(e) => setPosteId(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option value="">Sélectionner un poste</option>
          {postes.map((poste) => (
            <option key={poste.id} value={poste.id}>
              {poste.nom}
            </option>
          ))}
        </select>

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option>Actif</option>
          <option>Absent</option>
          <option>Suspendu</option>
        </select>

        <select
          value={temps}
          onChange={(e) => setTemps(e.target.value)}
          className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
        >
          <option>35h</option>
          <option>28h</option>
          <option>24h</option>
          <option>20h</option>
        </select>

        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          Ajouter l'agent
        </button>
      </form>
    </div>
  )
}