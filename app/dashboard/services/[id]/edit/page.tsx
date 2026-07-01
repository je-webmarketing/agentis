"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditServicePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()

  const [nom, setNom] = useState("")
  const [actif, setActif] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    chargerService()
  }, [])

  async function chargerService() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !data) {
      alert("Service introuvable")
      router.push("/dashboard/services")
      return
    }

    setNom(data.nom)
    setActif(data.actif)
    setLoading(false)
  }

  async function enregistrer() {
    if (!nom.trim()) {
      alert("Veuillez saisir un nom")
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("services")
      .update({
        nom,
        actif,
      })
      .eq("id", params.id)

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push(`/dashboard/services/${params.id}`)
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
        href={`/dashboard/services/${params.id}`}
        className="inline-block mb-6 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour au service
      </Link>

      <div className="max-w-3xl mx-auto">

        <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-8">

          <p className="text-yellow-400 font-semibold mb-2">
            AGENTIS
          </p>

          <h1 className="text-3xl font-bold mb-8">
            Modifier le service
          </h1>

          <div className="space-y-6">

            <div>
              <label className="block mb-2 text-slate-400">
                Nom du service
              </label>

              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div>

              <label className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                />

                <span>Service actif</span>

              </label>

            </div>

            <div className="flex gap-4">

              <button
                onClick={enregistrer}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>

              <Link
                href={`/dashboard/services/${params.id}`}
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