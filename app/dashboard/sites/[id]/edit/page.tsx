"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditSitePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

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
  const [actif, setActif] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: structuresData } = await supabase
        .from("structures")
        .select("id, nom")
        .order("nom")

      setStructures(structuresData || [])

      const { data: site, error } = await supabase
        .from("sites")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !site) {
        alert("Site introuvable")
        return
      }

      setNom(site.nom || "")
      setType(site.type || "")
      setAdresse(site.adresse || "")
      setCodePostal(site.code_postal || "")
      setVille(site.ville || "")
      setTelephone(site.telephone || "")
      setEmail(site.email || "")
      setResponsable(site.responsable || "")
      setCommentaire(site.commentaire || "")
      setStructureId(site.structure_id ? String(site.structure_id) : "")
      setActif(Boolean(site.actif))
    }

    loadData()
  }, [id])

  async function modifierSite() {
    if (!nom.trim()) {
      alert("Veuillez saisir un nom")
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("sites")
      .update({
        nom,
        type,
        adresse,
        code_postal: codePostal,
        ville,
        telephone,
        email,
        responsable,
        commentaire,
        actif,
        structure_id: structureId ? Number(structureId) : null,
      })
      .eq("id", id)

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push(`/dashboard/sites/${id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href={`/dashboard/sites/${id}`}
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour fiche site
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-8">
          <p className="text-yellow-400 font-semibold mb-2">AGENTIS</p>

          <h1 className="text-3xl font-bold mb-6">Modifier le site</h1>

          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-slate-400">Structure</label>
              <select
                value={structureId}
                onChange={(e) => setStructureId(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              >
                <option value="">Sélectionner une structure</option>
                {structures.map((structure) => (
                  <option key={structure.id} value={structure.id}>
                    {structure.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-slate-400">Nom du site</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              />
            </div>

            <div>
              <label className="block mb-2 text-slate-400">Type</label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                placeholder="École, EHPAD, Centre technique..."
              />
            </div>

            <div>
              <label className="block mb-2 text-slate-400">Adresse</label>
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

            <input
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Responsable du site"
              className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
            />

            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={5}
              placeholder="Commentaire"
              className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
            />

            <select
              value={actif ? "true" : "false"}
              onChange={(e) => setActif(e.target.value === "true")}
              className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>

            <button
              onClick={modifierSite}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}