"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditPostePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [services, setServices] = useState<any[]>([])
  const [nom, setNom] = useState("")
  const [qualification, setQualification] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [actif, setActif] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, nom")
        .order("nom")

      setServices(servicesData || [])

      const { data: poste, error } = await supabase
        .from("postes")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !poste) {
        alert("Poste introuvable")
        router.push("/dashboard/postes")
        return
      }

      setNom(poste.nom || "")
      setQualification(poste.qualification || "")
      setServiceId(poste.service_id ? String(poste.service_id) : "")
      setActif(Boolean(poste.actif))
      setLoading(false)
    }

    loadData()
  }, [id, router])

  async function enregistrer() {
    if (!nom.trim()) {
      alert("Veuillez saisir un nom")
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("postes")
      .update({
        nom,
        qualification,
        service_id: serviceId ? Number(serviceId) : null,
        actif,
      })
      .eq("id", id)

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push(`/dashboard/postes/${id}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] text-slate-100 flex items-center justify-center">
        Chargement...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href={`/dashboard/postes/${id}`}
        className="inline-block mb-6 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour au poste
      </Link>

      <div className="max-w-3xl mx-auto">
        <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-8">
          <p className="text-yellow-400 font-semibold mb-2">AGENTIS</p>

          <h1 className="text-3xl font-bold mb-8">
            Modifier le poste
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-slate-400">
                Nom du poste
              </label>

              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div>
              <label className="block mb-2 text-slate-400">
                Service
              </label>

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
            </div>

            <div>
              <label className="block mb-2 text-slate-400">
                Qualification
              </label>

              <input
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                placeholder="Ex : Catégorie A"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
              />
              <span>Poste actif</span>
            </label>

            <div className="flex gap-4">
              <button
                onClick={enregistrer}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>

              <Link
                href={`/dashboard/postes/${id}`}
                className="px-6 py-3 rounded-xl border border-slate-700"
              >
                Annuler
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}