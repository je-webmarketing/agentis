import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"

async function createService(formData: FormData) {
  "use server"

  const nom = String(formData.get("nom") || "").trim()
  const actif = formData.get("actif") === "on"

  if (!nom) {
    return
  }

  await supabase.from("services").insert({
    nom,
    actif,
  })

  redirect("/dashboard/services")
}

export default function NewServicePage() {
  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/services"
        className="inline-block mb-6 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Services
      </Link>

      <div className="mb-8">
        <p className="text-yellow-400 font-semibold">
          AGENTIS
        </p>

        <h1 className="text-3xl font-bold mt-2">
          Nouveau service
        </h1>

        <p className="text-slate-400">
          Création d'un service
        </p>
      </div>

      <form
        action={createService}
        className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 max-w-2xl"
      >
        <div className="mb-6">
          <label className="block mb-2 text-sm text-slate-400">
            Nom du service
          </label>

          <input
            type="text"
            name="nom"
            required
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
            placeholder="Ex : Ressources Humaines"
          />
        </div>

        <div className="mb-8">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="actif"
              defaultChecked
            />

            <span>Service actif</span>
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
            href="/dashboard/services"
            className="px-6 py-3 rounded-xl border border-slate-700"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}