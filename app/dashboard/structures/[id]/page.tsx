import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function StructureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: structure, error } = await supabase
    .from("structures")
    .select(
      "id, nom, type_structure, actif, adresse, code_postal, ville, telephone, email, responsable, commentaire"
    )
    .eq("id", id)
    .single()

  if (error || !structure) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        Structure introuvable
      </div>
    )
  }

  const { data: sites } = await supabase
    .from("sites")
    .select("id, nom, actif")
    .eq("structure_id", id)
    .order("nom", { ascending: true })

  const siteIds = (sites || []).map((site) => site.id)

  const { data: agents } = siteIds.length
    ? await supabase
        .from("agents")
        .select("id, nom, statut, temps, service")
        .in("site_id", siteIds)
        .order("nom", { ascending: true })
    : { data: [] }

  const services = Array.from(
    new Set((agents || []).map((agent) => agent.service).filter(Boolean))
  ).sort()

  const agentsActifs = (agents || []).filter(
    (agent) => agent.statut === "Actif"
  ).length

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/structures"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Structures
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-400 font-semibold mb-1">
            {structure.type_structure}
          </p>

          <h1 className="text-3xl font-bold">{structure.nom}</h1>

          <p className="text-slate-400">
            Sites, services, postes et agents rattachés
          </p>
        </div>

        <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs">
          {structure.actif ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mb-8 bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-yellow-400 mb-5">
          Informations établissement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div>
            <p className="text-slate-500">Adresse</p>
            <p>{structure.adresse || "Non renseignée"}</p>
          </div>

          <div>
            <p className="text-slate-500">Code postal / Ville</p>
            <p>
              {[structure.code_postal, structure.ville]
                .filter(Boolean)
                .join(" ") || "Non renseigné"}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Téléphone</p>
            <p>{structure.telephone || "Non renseigné"}</p>
          </div>

          <div>
            <p className="text-slate-500">Email</p>
            <p>{structure.email || "Non renseigné"}</p>
          </div>

          <div>
            <p className="text-slate-500">Responsable</p>
            <p>{structure.responsable || "Non renseigné"}</p>
          </div>

          <div>
            <p className="text-slate-500">Commentaire</p>
            <p>{structure.commentaire || "Aucun commentaire"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Sites rattachés</p>
          <p className="text-4xl font-bold text-yellow-400 mt-3">
            {sites?.length || 0}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Agents</p>
          <p className="text-4xl font-bold text-cyan-400 mt-3">
            {agents?.length || 0}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Agents actifs</p>
          <p className="text-4xl font-bold text-emerald-400 mt-3">
            {agentsActifs}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Sites</h2>

          {sites?.length ? (
            <div className="space-y-3">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="bg-[#111827] border border-slate-800 rounded-xl p-4"
                >
                  <p className="font-semibold">{site.nom}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {site.actif ? "Actif" : "Inactif"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              Aucun site rattaché à cette structure.
            </p>
          )}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Services</h2>

          {services.length ? (
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <span
                  key={service}
                  className="px-3 py-2 rounded-xl bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 text-xs"
                >
                  {service}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              Aucun service détecté pour cette structure.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 bg-[#111827] border-b border-slate-800">
          <div className="p-4">Agent</div>
          <div className="p-4">Service</div>
          <div className="p-4">Temps</div>
          <div className="p-4">Statut</div>
        </div>

        {agents?.length ? (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="grid grid-cols-4 border-b border-slate-800 last:border-b-0"
            >
              <div className="p-4 font-medium">{agent.nom}</div>
              <div className="p-4 text-slate-300">
                {agent.service || "Non renseigné"}
              </div>
              <div className="p-4">{agent.temps}</div>
              <div className="p-4">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300">
                  {agent.statut}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-slate-400">
            Aucun agent rattaché à cette structure.
          </div>
        )}
      </div>
    </div>
  )
}