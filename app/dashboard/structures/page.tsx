import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function StructuresPage() {
  const { data: structures, error } = await supabase
  .from("structures")
  .select("id, nom, type_structure, actif")
  .order("id", { ascending: true })

  if (error) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        {error.message}
      </div>
    )
  }
  console.log("STRUCTURES:", structures)

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Dashboard
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-400 font-semibold mb-1">
            AGENTIS
          </p>
          <h1 className="text-3xl font-bold">Structures</h1>
          <p className="text-slate-400">
            Gestion des collectivités, hôpitaux, EHPAD et organisations
          </p>
        </div>

        <Link
          href="/dashboard/structures/new"
          className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          + Ajouter une structure
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(structures || []).map((structure) => (
          <Link
            key={structure.id}
            href={`/dashboard/structures/${structure.id}`}
            className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/50 transition"
          >
            <p className="text-sm text-yellow-400 font-semibold">
              {structure.type_structure}
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {structure.nom}
            </h2>

            <p className="text-slate-400 mt-3 text-sm">
              Sites, services, postes et agents rattachés
            </p>

            <span className="inline-block mt-5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs">
              {structure.actif ? "Active" : "Inactive"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}