import Link from "next/link"
import { supabase } from "@/lib/supabase"
import DeleteAgentButton from "./delete-button"

export const dynamic = "force-dynamic"
export const revalidate = 0

type SearchParams = {
  structure?: string
  site?: string
  service?: string
  agent?: string
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = await searchParams

  const selectedStructure = params?.structure || ""
  const selectedSite = params?.site || ""
  const selectedService = params?.service || ""
  const searchAgent = params?.agent || ""

  const { data: structures } = await supabase
    .from("structures")
    .select("*")
    .order("nom", { ascending: true })

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("nom", { ascending: true })

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("nom", { ascending: true })

  const { data: agents, error } = await supabase
    .from("agents")
    .select(`
      *,
      poste:poste_id (
        nom
      ),
      service_ref:service_id (
        nom
      ),
     site:site_id (
  id,
  nom,
  structure_id
)
    `)
    .order("id", { ascending: true })

  if (error) {
    return (
      <div className="min-h-screen bg-[#020817] p-8 text-red-500">
        {error.message}
      </div>
    )
  }

  const filteredAgents = (agents || []).filter((agent) => {
    const matchStructure = selectedStructure
      ? String(agent.site?.structure_id || "") === selectedStructure
      : true

    const matchSite = selectedSite
  ? String(agent.site?.id || "") === selectedSite
  : true

    const agentServiceName = agent.service_ref?.nom || agent.service || ""

    const matchService = selectedService
      ? agentServiceName === selectedService
      : true

    const matchAgent = searchAgent
      ? agent.nom?.toLowerCase().includes(searchAgent.toLowerCase())
      : true

    return matchStructure && matchSite && matchService && matchAgent
  })

  const filteredSites = selectedStructure
    ? (sites || []).filter((site) => String(site.structure_id || "") === selectedStructure)
    : sites || []

  const serviceNames = Array.from(
    new Set(
      (agents || [])
        .map((agent) => agent.service_ref?.nom || agent.service)
        .filter(Boolean)
    )
  ).sort()

  const actifs = filteredAgents.filter((agent) => agent.statut === "Actif").length
  const inactifs = filteredAgents.filter((agent) => agent.statut !== "Actif").length


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
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-slate-400">
            Gestion des agents par structure, site, service et poste
          </p>
        </div>

        <Link
          href="/dashboard/agents/new"
          className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
        >
          + Ajouter un agent
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-4">
          <p className="text-slate-400 text-sm">Agents affichés</p>
          <p className="text-3xl font-bold text-white">{filteredAgents.length}</p>
        </div>

        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
          <p className="text-slate-400 text-sm">Actifs</p>
          <p className="text-3xl font-bold text-emerald-300">{actifs}</p>
        </div>

        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-slate-400 text-sm">Autres statuts</p>
          <p className="text-3xl font-bold text-red-300">{inactifs}</p>
        </div>
      </div>

      <form className="mb-6 grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Structure
          </label>
          <select
            name="structure"
            defaultValue={selectedStructure}
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-2 text-slate-100"
          >
            <option value="">Toutes les structures</option>
            {(structures || []).map((structure) => (
              <option key={structure.id} value={structure.id}>
                {structure.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Site
          </label>
          <select
            name="site"
            defaultValue={selectedSite}
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-2 text-slate-100"
          >
            <option value="">Tous les sites</option>
            {filteredSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Service
          </label>
          <select
            name="service"
            defaultValue={selectedService}
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-2 text-slate-100"
          >
            <option value="">Tous les services</option>
            {serviceNames.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Agent
          </label>
          <input
            type="text"
            name="agent"
            defaultValue={searchAgent}
            placeholder="Rechercher..."
            className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-2 text-slate-100"
          />
        </div>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
          >
            Filtrer
          </button>

          <Link
            href="/dashboard/agents"
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div
          className="bg-[#111827] border-b border-slate-800"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1.5fr",
          }}
        >
          <div className="p-4">Nom</div>
          <div className="p-4">Site</div>
          <div className="p-4">Service</div>
          <div className="p-4">Poste</div>
          <div className="p-4">Statut</div>
          <div className="p-4">Temps</div>
          <div className="p-4">Actions</div>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="p-6 text-slate-400">
            Aucun agent trouvé avec ces filtres.
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="border-b border-slate-800 last:border-b-0"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1.5fr",
              }}
            >
              <div className="p-4 font-medium">{agent.nom}</div>

              <div className="p-4 text-slate-300">
                {agent.site?.nom || "Non renseigné"}
              </div>

              <div className="p-4 text-slate-300">
                {agent.service_ref?.nom || agent.service || "Non renseigné"}
              </div>

              <div className="p-4 text-slate-300">
                {agent.poste?.nom || "Non renseigné"}
              </div>

              <div className="p-4">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300">
                  {agent.statut}
                </span>
              </div>

              <div className="p-4">{agent.temps}</div>

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
          ))
        )}
      </div>
    </div>
  )
}