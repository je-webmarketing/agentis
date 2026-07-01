import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PostesPage() {
  const { data: postes, error } = await supabase
    .from("postes")
    .select(`
      id,
      nom,
      qualification,
      actif,
      service_id
    `)
    .order("nom", { ascending: true })

  const { data: services } = await supabase
    .from("services")
    .select("id, nom")

  const { data: agents } = await supabase
    .from("agents")
    .select("id, poste_id")

  if (error) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        {error.message}
      </div>
    )
  }

  const serviceNameById = new Map(
    (services || []).map((service) => [String(service.id), service.nom])
  )

  const totalPostes = postes?.length || 0
  const postesActifs = postes?.filter((poste) => poste.actif).length || 0
  const postesInactifs = totalPostes - postesActifs

  function countAgents(poste: any) {
    return (agents || []).filter(
      (agent) => String(agent.poste_id || "") === String(poste.id)
    ).length
  }

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
          <p className="text-sm text-yellow-400 font-semibold mb-1">AGENTIS</p>
          <h1 className="text-3xl font-bold">Postes</h1>
          <p className="text-slate-400">
            Gestion des postes rattachés aux services
          </p>
        </div>

        <Link
          href="/dashboard/postes/new"
          className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          + Ajouter un poste
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Postes</p>
          <p className="text-4xl font-bold text-yellow-400 mt-3">
            {totalPostes}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Postes actifs</p>
          <p className="text-4xl font-bold text-emerald-400 mt-3">
            {postesActifs}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Postes inactifs</p>
          <p className="text-4xl font-bold text-red-400 mt-3">
            {postesInactifs}
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div
          className="grid gap-4 bg-[#111827] border-b border-slate-800 text-sm"
          style={{
            gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1.5fr",
          }}
        >
          <div className="p-4">Poste</div>
          <div className="p-4">Service</div>
          <div className="p-4">Qualification</div>
          <div className="p-4">Agents</div>
          <div className="p-4">Actions</div>
        </div>

        {postes?.length ? (
          postes.map((poste) => (
            <div
              key={poste.id}
              className="grid gap-4 border-b border-slate-800 last:border-b-0 text-sm"
              style={{
                gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1.5fr",
              }}
            >
              <div className="p-4 font-medium">{poste.nom}</div>

              <div className="p-4 text-slate-300">
                {poste.service_id
                  ? serviceNameById.get(String(poste.service_id)) ||
                    "Service inconnu"
                  : "Non rattaché"}
              </div>

              <div className="p-4 text-slate-300">
                {poste.qualification || "Non renseignée"}
              </div>

              <div className="p-4 text-slate-300">
                {countAgents(poste)}
              </div>

              <div className="p-4">
                <Link
                  href={`/dashboard/postes/${poste.id}`}
                  className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm"
                >
                  Voir
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-slate-400">
            Aucun poste enregistré.
          </div>
        )}
      </div>
    </div>
  )
}