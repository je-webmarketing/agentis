"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewStructurePage() {
  const router = useRouter()

  const [nom, setNom] = useState("")
  const [typeStructure, setTypeStructure] = useState("Collectivité")
  const [saving, setSaving] = useState(false)
  const [adresse, setAdresse] = useState("")
const [codePostal, setCodePostal] = useState("")
const [ville, setVille] = useState("")
const [telephone, setTelephone] = useState("")
const [email, setEmail] = useState("")
const [responsable, setResponsable] = useState("")
const [commentaire, setCommentaire] = useState("")

  async function ajouterStructure() {
    if (!nom.trim()) {
      alert("Veuillez saisir un nom")
      return
    }

    setSaving(true)

    const { error } = await supabase
  .from("structures")
  .insert({
    nom,
    type_structure: typeStructure,
    adresse,
    code_postal: codePostal,
    ville,
    telephone,
    email,
    responsable,
    commentaire,
    actif: true,
  })
    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push("/dashboard/structures")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/structures"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Structures
      </Link>

      <div className="max-w-3xl mx-auto">
        <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-8">
          <p className="text-yellow-400 font-semibold mb-2">
            AGENTIS
          </p>

          <h1 className="text-3xl font-bold mb-6">
            Ajouter une structure
          </h1>

          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-slate-400">
                Nom
              </label>

              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                placeholder="Ex : Centre Hospitalier de Lyon"
              />
            </div>



            <div>
              <label className="block mb-2 text-slate-400">
                Type
              </label>

              <select
                value={typeStructure}
                onChange={(e) => setTypeStructure(e.target.value)}
                className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
              >
                <option>Collectivité</option>
                <option>Hôpital</option>
                <option>EHPAD</option>
                <option>Organisation</option>
              </select>
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

<div>
  <label className="block mb-2 text-slate-400">
    Code postal
  </label>

  <input
    value={codePostal}
    onChange={(e) => setCodePostal(e.target.value)}
    className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
  />
</div>

<div>
  <label className="block mb-2 text-slate-400">
    Ville
  </label>

  <input
    value={ville}
    onChange={(e) => setVille(e.target.value)}
    className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
  />
</div>

<div>
  <label className="block mb-2 text-slate-400">
    Téléphone
  </label>

  <input
    value={telephone}
    onChange={(e) => setTelephone(e.target.value)}
    className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
  />
</div>

<div>
  <label className="block mb-2 text-slate-400">
    Email
  </label>

  <input
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
  />
</div>

<div>
  <label className="block mb-2 text-slate-400">
    Responsable
  </label>

  <input
    value={responsable}
    onChange={(e) => setResponsable(e.target.value)}
    className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
  />
</div>

<div>
  <label className="block mb-2 text-slate-400">
    Commentaire
  </label>

  <textarea
    rows={4}
    value={commentaire}
    onChange={(e) => setCommentaire(e.target.value)}
    className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
  />
</div>

            <button
              onClick={ajouterStructure}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
            >
              {saving ? "Enregistrement..." : "Créer la structure"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}