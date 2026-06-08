import Link from "next/link"
import { supabase } from "@/lib/supabase"
import DeleteAgentButton from "./delete-button"

export default async function AgentsPage() {
  const { data: agents, error } = await supabase
    .from("agents")
    .select("*")
    .order("id", { ascending: true })

  if (error) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        Erreur de chargement des agents
      </div>
    )
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
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-slate-400">
            Gestion des agents de la collectivité
          </p>
        </div>

        <Link
          href="/dashboard/agents/new"
          className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          + Ajouter un agent
        </Link>
      </div>

      <div className="mb-4 text-slate-400 text-sm">
        Total agents :{" "}
        <span className="text-white font-semibold">
          {agents?.length || 0}
        </span>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div
  className="bg-[#111827] border-b border-slate-800"
  style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr" }}
>
          <div className="p-4">Nom</div>
          <div className="p-4">Service</div>
          <div className="p-4">Statut</div>
          <div className="p-4">Temps</div>
          <div className="p-4">Actions</div>
        </div>

        {agents?.map((agent) => (
          <div
            key={agent.id}
            className="border-b border-slate-800 last:border-b-0"
style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr" }}
          >
            <div className="p-4 font-medium">{agent.nom}</div>

            <div className="p-4 text-slate-300">
              {agent.service}
            </div>

            <div className="p-4">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300">
                {agent.statut}
              </span>
            </div>

            <div className="p-4">
              {agent.temps}
            </div>

            <div className="p-4 flex gap-2">
  <Link
    href={`/dashboard/agents/${agent.id}`}
    className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm"
  >
    Modifier
  </Link>

  <DeleteAgentButton id={agent.id} />
</div>
          </div>
        ))}
      </div>
    </div>
  )
}