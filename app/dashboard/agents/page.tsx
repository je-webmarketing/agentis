import Link from "next/link"
import {
  BriefcaseBusiness,
  Building2,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
  UsersRound,
  UserX,
} from "lucide-react"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"
import DeleteAgentButton from "./delete-button"
import { PermissionService } from "@/lib/security/PermissionService"
import { createSecurityUser } from "@/lib/security/SecurityUserFactory"
import type {
  ProfileRecord,
} from "@/lib/services/ProfileService"

export const dynamic = "force-dynamic"
export const revalidate = 0

type SearchParams = {
  structure?: string
  site?: string
  service?: string
  agent?: string
  statut?: string
}

type NamedRelation = {
  id?: string | number | null
  nom?: string | null
  structure_id?: string | number | null
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = await searchParams

  const supabase =
  await createServerSupabaseClient()

  const {
  data: { user },
} = await supabase.auth.getUser()

let canCreate = false
let canDelete = false

if (user) {
  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      nom,
      prenom,
      telephone,
      fonction,
      role,
      agent_id,
      structure_id,
      site_id,
      service_id,
      actif,
      avatar_url,
      derniere_connexion,
      created_at,
      updated_at
    `)
    .eq("id", user.id)
    .single()

  if (
    !profileError &&
    profileData
  ) {
    const profile =
      profileData as ProfileRecord

    const securityUser =
      createSecurityUser(profile)

    canCreate =
      PermissionService.has(
        securityUser,
        "agents.create"
      )

    canDelete =
      PermissionService.has(
        securityUser,
        "agents.delete"
      )
  }
}

  const selectedStructure = params?.structure || ""
  const selectedSite = params?.site || ""
  const selectedService = params?.service || ""
  const selectedStatus = params?.statut || ""
  const searchAgent = params?.agent?.trim() || ""

  const [
    structuresResult,
    sitesResult,
    agentsResult,
  ] = await Promise.all([
    supabase
      .from("structures")
      .select("id, nom")
      .order("nom", { ascending: true }),

    supabase
      .from("sites")
      .select("id, nom, structure_id")
      .order("nom", { ascending: true }),

    supabase
      .from("agents")
      .select(`
        *,
        poste:poste_id (
          id,
          nom
        ),
        service_ref:service_id (
          id,
          nom
        ),
        site:site_id (
          id,
          nom,
          structure_id
        )
      `)
      .order("nom", { ascending: true }),
  ])

  const structures = structuresResult.data || []
  const sites = sitesResult.data || []
  const agents = agentsResult.data || []

  if (agentsResult.error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Impossible de charger les agents :{" "}
          {agentsResult.error.message}
        </div>
      </main>
    )
  }

  const filteredSites = selectedStructure
    ? sites.filter(
        (site) =>
          String(site.structure_id || "") ===
          selectedStructure
      )
    : sites

  const serviceNames = Array.from(
    new Set(
      agents
        .map((agent) =>
          getRelationName(
            agent.service_ref,
            agent.service || ""
          )
        )
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "fr"))

  const filteredAgents = agents.filter((agent) => {
    const site = getRelation(agent.site)

    const agentServiceName = getRelationName(
      agent.service_ref,
      agent.service || ""
    )

    const agentStatus =
      String(agent.statut || "").trim()

    const matchStructure = selectedStructure
      ? String(site?.structure_id || "") ===
        selectedStructure
      : true

    const matchSite = selectedSite
      ? String(site?.id || "") === selectedSite
      : true

    const matchService = selectedService
      ? agentServiceName === selectedService
      : true

    const matchStatus = selectedStatus
      ? agentStatus === selectedStatus
      : true

    const matchAgent = searchAgent
      ? String(agent.nom || "")
          .toLowerCase()
          .includes(searchAgent.toLowerCase())
      : true

    return (
      matchStructure &&
      matchSite &&
      matchService &&
      matchStatus &&
      matchAgent
    )
  })

  const activeAgents = filteredAgents.filter(
    (agent) =>
      normalizeStatus(agent.statut) === "actif"
  ).length

  const inactiveAgents =
    filteredAgents.length - activeAgents

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* En-tête */}
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Ressources humaines
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Agents
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Consultez et gérez les agents par
              structure, site, service et poste.
            </p>
          </div>

          {canCreate && (
  <Link
    href="/dashboard/agents/new"
    className="inline-flex w-fit items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
  >
    <Plus className="h-4 w-4" />
    Ajouter un agent
  </Link>
)}
        </header>

        {/* Indicateurs */}
        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Agents affichés"
            value={filteredAgents.length}
            icon={UsersRound}
            color="text-blue-600"
            background="bg-blue-50"
          />

          <StatCard
            label="Agents actifs"
            value={activeAgents}
            icon={UserCheck}
            color="text-emerald-600"
            background="bg-emerald-50"
          />

          <StatCard
            label="Autres statuts"
            value={inactiveAgents}
            icon={UserX}
            color="text-rose-600"
            background="bg-rose-50"
          />
        </section>

        {/* Filtres */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Filter className="h-4 w-4" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Filtres
              </h2>

              <p className="text-xs text-slate-500">
                Affinez la liste selon votre périmètre.
              </p>
            </div>
          </div>

          <form className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
            <FilterSelect
              label="Structure"
              name="structure"
              defaultValue={selectedStructure}
            >
              <option value="">
                Toutes les structures
              </option>

              {structures.map((structure) => (
                <option
                  key={structure.id}
                  value={structure.id}
                >
                  {structure.nom}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Site"
              name="site"
              defaultValue={selectedSite}
            >
              <option value="">
                Tous les sites
              </option>

              {filteredSites.map((site) => (
                <option
                  key={site.id}
                  value={site.id}
                >
                  {site.nom}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Service"
              name="service"
              defaultValue={selectedService}
            >
              <option value="">
                Tous les services
              </option>

              {serviceNames.map((service) => (
                <option
                  key={service}
                  value={service}
                >
                  {service}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Statut"
              name="statut"
              defaultValue={selectedStatus}
            >
              <option value="">
                Tous les statuts
              </option>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="Archivé">Archivé</option>
            </FilterSelect>

            <label className="xl:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Rechercher un agent
              </span>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  name="agent"
                  defaultValue={searchAgent}
                  placeholder="Nom de l’agent…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </label>

            <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-6">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Filter className="h-4 w-4" />
                Appliquer les filtres
              </button>

              <Link
                href="/dashboard/agents"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Link>
            </div>
          </form>
        </section>

        {/* Liste */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Liste des agents
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredAgents.length} résultat
                {filteredAgents.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {filteredAgents.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <UsersRound className="h-10 w-10 text-slate-300" />

              <p className="mt-4 font-semibold text-slate-700">
                Aucun agent trouvé
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Modifiez les filtres ou ajoutez un
                nouvel agent.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">
                      Agent
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Site
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Service
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Poste
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Statut
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Temps
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAgents.map((agent) => {
                    const siteName = getRelationName(
                      agent.site,
                      "Non renseigné"
                    )

                    const serviceName = getRelationName(
                      agent.service_ref,
                      agent.service || "Non renseigné"
                    )

                    const positionName = getRelationName(
                      agent.poste,
                      "Non renseigné"
                    )

                    return (
                      <tr
                        key={agent.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                              {getInitials(agent.nom)}
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/dashboard/agents/${agent.id}`}
                                className="font-semibold text-slate-900 transition hover:text-amber-600"
                              >
                                {agent.nom ||
                                  "Agent sans nom"}
                              </Link>

                              <p className="mt-1 text-xs text-slate-500">
                                Agent #{agent.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            {siteName}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                            {serviceName}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
                            {positionName}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={agent.statut}
                          />
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {agent.temps || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/dashboard/agents/${agent.id}`}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                            >
                              Ouvrir
                            </Link>

                            {canDelete && (
  <DeleteAgentButton
    id={agent.id}
  />
)}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  background,
}: {
  label: string
  value: number
  icon: typeof UsersRound
  color: string
  background: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">
            {label}
          </p>

          <p className={`mt-3 text-3xl font-bold ${color}`}>
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${background} ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string
  name: string
  defaultValue: string
  children: React.ReactNode
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      >
        {children}
      </select>
    </label>
  )
}

function StatusBadge({
  status,
}: {
  status?: string | null
}) {
  const normalized = normalizeStatus(status)

  const style =
    normalized === "actif"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "archivé" ||
          normalized === "archive"
        ? "border-slate-200 bg-slate-100 text-slate-600"
        : "border-rose-200 bg-rose-50 text-rose-700"

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status || "Non renseigné"}
    </span>
  )
}

function getRelation(
  relation:
    | NamedRelation
    | NamedRelation[]
    | null
    | undefined
) {
  if (Array.isArray(relation)) {
    return relation[0] || null
  }

  return relation || null
}

function getRelationName(
  relation:
    | NamedRelation
    | NamedRelation[]
    | null
    | undefined,
  fallback: string
) {
  return getRelation(relation)?.nom || fallback
}

function normalizeStatus(
  value?: string | null
) {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function getInitials(
  name?: string | null
) {
  if (!name) return "?"

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}