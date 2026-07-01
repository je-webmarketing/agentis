import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"

async function createPoste(formData: FormData) {
  "use server"

  const nom = String(formData.get("nom") || "").trim()
  const qualification = String(formData.get("qualification") || "").trim()
  const serviceId = Number(formData.get("service_id"))
  const actif = formData.get("actif") === "on"

  if (!nom || !serviceId) {
    return
  }

  await supabase
    .from("postes")
    .insert({
      nom,
      qualification,
      service_id: serviceId,
      actif,
    })

  redirect("/dashboard/postes")
}

export default async function NewPostePage() {
  const { data: services } = await supabase
    .from("services")
    .select("id, nom")
    .eq("actif", true)
    .order("nom")

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">

      <Link
        href="/dashboard/postes"
        className="inline-block mb-6 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Postes
      </Link>

      <div className="mb-8">
        <p className="text-yellow-400 font-semibold">
          AGENTIS
        </p>

        <h1 className="text-3xl font-bold mt-2">
          Nouveau poste
        </h1>

        <p className="text-slate-400">
          Création d'un poste
        </p>
      </div>

      <form
        action={createPoste}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 max-w-3xl"
      >

        <div className="mb-6">

          <label className="block mb-2 text-slate-400">
            Nom du poste
          </label>

          <input
            type="text"
            name="nom"
            required
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
            placeholder="Ex : Responsable RH"
          />

        </div>

        <div className="mb-6">

          <label className="block mb-2 text-slate-400">
            Service
          </label>

          <select
            name="service_id"
            required
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
          >
            <option value="">
              Sélectionner...
            </option>

            {(services || []).map((service) => (
              <option
                key={service.id}
                value={service.id}
              >
                {service.nom}
              </option>
            ))}

          </select>

        </div>

        <div className="mb-6">

          <label className="block mb-2 text-slate-400">
            Qualification
          </label>

          <input
            type="text"
            name="qualification"
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
            placeholder="Ex : Catégorie A"
          />

        </div>

        <div className="mb-8">

          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              name="actif"
              defaultChecked
            />

            <span>Poste actif</span>

          </label>

        </div>

        <div className="flex gap-4">

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
          >
            Enregistrer
          </button>

          <Link
            href="/dashboard/postes"
            className="px-6 py-3 rounded-xl border border-slate-700"
          >
            Annuler
          </Link>

        </div>

      </form>

    </div>
  )
}