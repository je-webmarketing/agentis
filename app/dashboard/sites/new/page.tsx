"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewSitePage() {
  const router = useRouter()

  const [structures, setStructures] = useState<any[]>([])

  const [nom, setNom] = useState("")
  const [type, setType] = useState("")
  const [adresse, setAdresse] = useState("")
  const [codePostal, setCodePostal] = useState("")
  const [ville, setVille] = useState("")
  const [telephone, setTelephone] = useState("")
  const [email, setEmail] = useState("")
  const [responsable, setResponsable] = useState("")
  const [commentaire, setCommentaire] = useState("")
  const [structureId, setStructureId] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    chargerStructures()
  }, [])

  async function chargerStructures() {
    const { data } = await supabase
      .from("structures")
      .select("id, nom")
      .order("nom")

    setStructures(data || [])
  }

  async function enregistrerSite() {
    if (!nom.trim()) {
      alert("Veuillez saisir un nom")
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("sites")
      .insert({
        nom,
        type,
        adresse,
        code_postal: codePostal,
        ville,
        telephone,
        email,
        responsable,
        commentaire,
        actif: true,
        structure_id: structureId || null,
      })

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push("/dashboard/sites")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/sites"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Sites
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-8">
          <p className="text-yellow-400 font-semibold mb-2">
            AGENTIS
          </p>

          <h1 className="text-3xl font-bold mb-6">
            Ajouter un site
          </h1>

          <div className="space-y-5">

            <div>
              <label className="block mb-2 text-slate-400">
                Structure
              </label>

              <select
                value={structureId}
                onChange={(e) => setStructureId(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              >
                <option value="">
                  Sélectionner une structure
                </option>

                {structures.map((structure) => (
                  <option
                    key={structure.id}
                    value={structure.id}
                  >
                    {structure.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-slate-400">
                Nom du site
              </label>

              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div>
              <label className="block mb-2 text-slate-400">
                Type
              </label>

              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                placeholder="École, Crèche, Centre Technique..."
              />
            </div>

            <div>
              <label className="block mb-2 text-slate-400">
                Adresse
              </label>

              <input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="Code postal"
                className="rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />

              <input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Ville"
                className="rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Téléphone"
                className="rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div>
              <input
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Responsable du site"
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={5}
                placeholder="Commentaire"
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <button
              onClick={enregistrerSite}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
            >
              {saving ? "Enregistrement..." : "Créer le site"}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}