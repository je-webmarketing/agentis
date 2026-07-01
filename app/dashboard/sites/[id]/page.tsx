import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: site, error } = await supabase
    .from("sites")
    .select(`
      id,
      nom,
      type,
      adresse,
      code_postal,
      ville,
      telephone,
      email,
      responsable,
      commentaire,
      actif,
      structure_id
    `)
    .eq("id", id)
    .single()

  if (error || !site) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        Site introuvable
      </div>
    )
  }

  const { data: structure } = site.structure_id
    ? await supabase
        .from("structures")
        .select("id, nom, type_structure")
        .eq("id", site.structure_id)
        .single()
    : { data: null }

  const { data: agents } = await supabase
    .from("agents")
    .select("id, nom, statut, temps, service, service_id, poste_id")
    .eq("site_id", id)
    .order("nom", { ascending: true })

  const { data: services } = await supabase
    .from("services")
    .select("id, nom, actif")
    .order("nom", { ascending: true })

  const { data: postes } = await supabase
    .from("postes")
    .select("id, nom, service_id, actif")
    .order("nom", { ascending: true })

  const serviceIds = new Set(
    (agents || [])
      .map((agent) => agent.service_id)
      .filter(Boolean)
      .map(String)
  )

  const posteIds = new Set(
    (agents || [])
      .map((agent) => agent.poste_id)
      .filter(Boolean)
      .map(String)
  )

  const servicesDuSite = (services || []).filter((service) =>
    serviceIds.has(String(service.id))
  )

  const postesDuSite = (postes || []).filter((poste) =>
    posteIds.has(String(poste.id))
  )

  const agentsActifs = (agents || []).filter(
    (agent) => agent.statut === "Actif"
  ).length

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/sites"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Sites
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-400 font-semibold mb-1">
            {site.type || "Site"}
          </p>

          <h1 className="text-3xl font-bold">{site.nom}</h1>

          <p className="text-slate-400">
            {structure?.nom || "Structure non renseignée"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/sites/${site.id}/edit`}
            className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
          >
            Modifier
          </Link>

          {site.structure_id && (
            <Link
              href={`/dashboard/structures/${site.structure_id}`}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
            >
              Voir la structure
            </Link>
          )}

          <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs">
            {site.actif ? "Actif" : "Inactif"}
          </span>
        </div>
      </div>

      <div className="mb-8 bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-yellow-400 mb-5">
          Informations du site
        </h2>

        <div
          className="grid gap-5 text-sm"
          style={{
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          <div>
            <p className="text-slate-500">Structure</p>
            <p>{structure?.nom || "Non rattaché"}</p>
          </div>

          <div>
            <p className="text-slate-500">Type de structure</p>
            <p>{structure?.type_structure || "Non renseigné"}</p>
          </div>

          <div>
            <p className="text-slate-500">Adresse</p>
            <p>{site.adresse || "Non renseignée"}</p>
          </div>

          <div>
            <p className="text-slate-500">Code postal / Ville</p>
            <p>
              {[site.code_postal, site.ville].filter(Boolean).join(" ") ||
                "Non renseigné"}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Téléphone</p>
            <p>{site.telephone || "Non renseigné"}</p>
          </div>

          <div>
            <p className="text-slate-500">Email</p>
            <p>{site.email || "Non renseigné"}</p>
          </div>

          <div>
            <p className="text-slate-500">Responsable</p>
            <p>{site.responsable || "Non renseigné"}</p>
          </div>

          <div>
            <p className="text-slate-500">Commentaire</p>
            <p>{site.commentaire || "Aucun commentaire"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Services</p>
          <p className="text-4xl font-bold text-yellow-400 mt-3">
            {servicesDuSite.length}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Postes</p>
          <p className="text-4xl font-bold text-violet-400 mt-3">
            {postesDuSite.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">
            Services
          </h2>

          {servicesDuSite.length ? (
            <div className="flex flex-wrap gap-2">
              {servicesDuSite.map((service) => (
                <span
                  key={service.id}
                  className="px-3 py-2 rounded-xl bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 text-xs"
                >
                  {service.nom}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              Aucun service rattaché via les agents.
            </p>
          )}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">
            Postes
          </h2>

          {postesDuSite.length ? (
            <div className="flex flex-wrap gap-2">
              {postesDuSite.map((poste) => (
                <span
                  key={poste.id}
                  className="px-3 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs"
                >
                  {poste.nom}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              Aucun poste rattaché via les agents.
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div
          className="grid gap-4 bg-[#111827] border-b border-slate-800 text-sm"
          style={{
            gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
          }}
        >
          <div className="p-4">Agent</div>
          <div className="p-4">Service</div>
          <div className="p-4">Temps</div>
          <div className="p-4">Statut</div>
        </div>

        {agents?.length ? (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="grid gap-4 border-b border-slate-800 last:border-b-0 text-sm"
              style={{
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
              }}
            >
              <div className="p-4 font-medium">{agent.nom}</div>

              <div className="p-4 text-slate-300">
                {agent.service || "Non renseigné"}
              </div>

              <div className="p-4 text-slate-300">
                {agent.temps || "Non renseigné"}
              </div>

              <div className="p-4">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300">
                  {agent.statut}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-slate-400">
            Aucun agent rattaché à ce site.
          </div>
        )}
      </div>
    </div>
  )
}