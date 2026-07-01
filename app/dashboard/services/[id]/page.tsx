import Link from "next/link"
import { supabase } from "@/lib/supabase"
import DeleteServiceButton from "../delete-button"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !service) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        Service introuvable
      </div>
    )
  }

  const { data: agents } = await supabase
    .from("agents")
    .select("id, nom, statut, temps")
    .eq("service_id", id)
    .order("nom")

  const { data: postes } = await supabase
    .from("postes")
    .select("id, nom, qualification, actif")
    .eq("service_id", id)
    .order("nom")

  const agentsActifs =
    agents?.filter((a) => a.statut === "Actif").length || 0

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">

      <Link
        href="/dashboard/services"
        className="inline-block mb-6 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Services
      </Link>

      <div className="flex justify-between items-start border-b border-slate-800 pb-6 mb-8">

        <div>
          <p className="text-yellow-400 font-semibold">
            AGENTIS
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {service.nom}
          </h1>

          <p className="text-slate-400">
            Fiche du service
          </p>
        </div>

        <span
          className={
            service.actif
              ? "px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-300"
              : "px-4 py-2 rounded-xl bg-red-500/15 text-red-300"
          }
        >
          {service.actif ? "Actif" : "Inactif"}
        </span>

      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400">Agents</p>

          <p className="text-4xl font-bold text-cyan-400 mt-3">
            {agents?.length || 0}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400">Agents actifs</p>

          <p className="text-4xl font-bold text-emerald-400 mt-3">
            {agentsActifs}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400">Postes</p>

          <p className="text-4xl font-bold text-yellow-400 mt-3">
            {postes?.length || 0}
          </p>
        </div>

      </div>

      <div className="mb-8 bg-[#0f172a] border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-bold text-yellow-400 mb-5">
          Informations
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <p className="text-slate-500">Nom</p>
            <p>{service.nom}</p>
          </div>

          <div>
            <p className="text-slate-500">Statut</p>
            <p>{service.actif ? "Actif" : "Inactif"}</p>
          </div>

        </div>

      </div>

      <div className="grid xl:grid-cols-2 gap-6">

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">

          <div className="p-5 border-b border-slate-800">

            <h2 className="text-xl font-bold text-yellow-400">
              Agents
            </h2>

          </div>

          {agents?.length ? (

            agents.map((agent) => (

              <div
                key={agent.id}
                className="flex justify-between border-b border-slate-800 p-4"
              >

                <div>

                  <div className="font-semibold">
                    {agent.nom}
                  </div>

                  <div className="text-slate-400 text-sm">
                    {agent.temps}
                  </div>

                </div>

                <span className="text-emerald-300">
                  {agent.statut}
                </span>

              </div>

            ))

          ) : (

            <div className="p-6 text-slate-400">
              Aucun agent.
            </div>

          )}

        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">

          <div className="p-5 border-b border-slate-800">

            <h2 className="text-xl font-bold text-yellow-400">
              Postes
            </h2>

          </div>

          {postes?.length ? (

            postes.map((poste) => (

              <div
                key={poste.id}
                className="flex justify-between border-b border-slate-800 p-4"
              >

                <div>

                  <div className="font-semibold">
                    {poste.nom}
                  </div>

                  <div className="text-slate-400 text-sm">
                    {poste.qualification || "Sans qualification"}
                  </div>

                </div>

                <span
                  className={
                    poste.actif
                      ? "text-emerald-300"
                      : "text-red-300"
                  }
                >
                  {poste.actif ? "Actif" : "Inactif"}
                </span>

              </div>

            ))

          ) : (

            <div className="p-6 text-slate-400">
              Aucun poste.
            </div>

          )}

        </div>

      </div>

      <div className="mt-8 flex gap-4">

        <Link
          href={`/dashboard/services/${service.id}/edit`}
          className="px-6 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          Modifier
        </Link>
        <DeleteServiceButton
  id={service.id}
  agentsCount={agents?.length || 0}
  postesCount={postes?.length || 0}
/>

      </div>

    </div>
  )
}