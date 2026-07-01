import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SitesPage() {
  const { data: sites, error } = await supabase
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
    .order("nom", { ascending: true })

  const { data: structures } = await supabase
    .from("structures")
    .select("id, nom")

  if (error) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        {error.message}
      </div>
    )
  }

  const structureNameById = new Map(
    (structures || []).map((structure) => [
      String(structure.id),
      structure.nom,
    ])
  )

  const totalSites = sites?.length || 0
  const sitesActifs = sites?.filter((site) => site.actif).length || 0
  const sitesSansStructure =
    sites?.filter((site) => !site.structure_id).length || 0

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
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-slate-400">
            Gestion des sites rattachés aux structures
          </p>
        </div>

        <Link
          href="/dashboard/sites/new"
          className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          + Ajouter un site
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Sites</p>
          <p className="text-4xl font-bold text-yellow-400 mt-3">
            {totalSites}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Sites actifs</p>
          <p className="text-4xl font-bold text-emerald-400 mt-3">
            {sitesActifs}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Sans structure</p>
          <p className="text-4xl font-bold text-red-400 mt-3">
            {sitesSansStructure}
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div
          className="grid gap-4 bg-[#111827] border-b border-slate-800 text-sm"
          style={{
            gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr 1fr 1fr",
          }}
        >
          <div className="p-4">Nom</div>
          <div className="p-4">Structure</div>
          <div className="p-4">Type</div>
          <div className="p-4">Ville</div>
          <div className="p-4">Responsable</div>
          <div className="p-4">Statut</div>
          <div className="p-4">Actions</div>
        </div>

        {sites?.length ? (
          sites.map((site) => (
            <div
              key={site.id}
              className="grid gap-4 border-b border-slate-800 last:border-b-0 text-sm"
              style={{
                gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr 1fr 1fr",
              }}
            >
              <div className="p-4 font-medium">{site.nom}</div>

              <div className="p-4 text-slate-300">
                {site.structure_id
                  ? structureNameById.get(String(site.structure_id)) ||
                    "Structure inconnue"
                  : "Non rattaché"}
              </div>

              <div className="p-4 text-slate-300">
                {site.type || "Non renseigné"}
              </div>

              <div className="p-4 text-slate-300">
                {site.ville || "Non renseignée"}
              </div>

              <div className="p-4 text-slate-300">
                {site.responsable || "Non renseigné"}
              </div>

              <div className="p-4">
                <span
                  className={
                    site.actif
                      ? "px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300"
                      : "px-3 py-1 rounded-lg bg-red-500/15 text-red-300"
                  }
                >
                  {site.actif ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="p-4">
                <Link
                  href={`/dashboard/sites/${site.id}`}
                  className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm"
                >
                  Voir
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-slate-400">
            Aucun site enregistré.
          </div>
        )}
      </div>
    </div>
  )
}