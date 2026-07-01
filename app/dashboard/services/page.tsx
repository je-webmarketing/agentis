import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ServicesPage() {
  const { data: services, error } = await supabase
    .from("services")
    .select("id, nom, actif")
    .order("nom", { ascending: true })

  const { data: agents } = await supabase
    .from("agents")
    .select("id, nom, service_id, service")

  const { data: postes } = await supabase
    .from("postes")
    .select("id, nom, service_id")

  if (error) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        {error.message}
      </div>
    )
  }

  const totalServices = services?.length || 0
  const servicesActifs = services?.filter((service) => service.actif).length || 0
  const servicesInactifs = totalServices - servicesActifs

  function countAgents(service: any) {
    return (agents || []).filter((agent) => {
      const byId = agent.service_id
        ? String(agent.service_id) === String(service.id)
        : false

      const byName = agent.service
        ? agent.service.toLowerCase() === service.nom.toLowerCase()
        : false

      return byId || byName
    }).length
  }

  function countPostes(service: any) {
    return (postes || []).filter(
      (poste) => String(poste.service_id || "") === String(service.id)
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
          <p className="text-sm text-yellow-400 font-semibold mb-1">
            AGENTIS
          </p>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-slate-400">
            Gestion des services rattachés aux agents et aux postes
          </p>
        </div>

        <Link
          href="/dashboard/services/new"
          className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          + Ajouter un service
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Services</p>
          <p className="text-4xl font-bold text-yellow-400 mt-3">
            {totalServices}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Services actifs</p>
          <p className="text-4xl font-bold text-emerald-400 mt-3">
            {servicesActifs}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Services inactifs</p>
          <p className="text-4xl font-bold text-red-400 mt-3">
            {servicesInactifs}
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div
          className="grid gap-4 bg-[#111827] border-b border-slate-800 text-sm"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr",
          }}
        >
          <div className="p-4">Service</div>
          <div className="p-4">Agents</div>
          <div className="p-4">Postes</div>
          <div className="p-4">Statut</div>
          <div className="p-4">Actions</div>
        </div>

        {services?.length ? (
          services.map((service) => (
            <div
              key={service.id}
              className="grid gap-4 border-b border-slate-800 last:border-b-0 text-sm"
              style={{
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr",
              }}
            >
              <div className="p-4 font-medium">{service.nom}</div>

              <div className="p-4 text-slate-300">
                {countAgents(service)}
              </div>

              <div className="p-4 text-slate-300">
                {countPostes(service)}
              </div>

              <div className="p-4">
                <span
                  className={
                    service.actif
                      ? "px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300"
                      : "px-3 py-1 rounded-lg bg-red-500/15 text-red-300"
                  }
                >
                  {service.actif ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="p-4">
                <Link
                  href={`/dashboard/services/${service.id}`}
                  className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm"
                >
                  Voir
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-slate-400">
            Aucun service enregistré.
          </div>
        )}
      </div>
    </div>
  )
}