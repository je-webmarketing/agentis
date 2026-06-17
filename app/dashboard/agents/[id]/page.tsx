"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type RefItem = {
  id: number
  nom: string
}

type AbsenceItem = {
  id: number
  type: string | null
  date_debut: string | null
  date_fin: string | null
  statut_validation: string | null
}

type PlanningItem = {
  id: number
  date: string | null
  heure_debut: string | null
  heure_fin: string | null
  statut: string | null
  sites?: {
    nom: string | null
  } | null
}

function badgeClass(value: string) {
  switch (value) {
    case "Actif":
    case "Validée":
    case "Présent":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    case "Absent":
    case "Absence":
    case "Refusée":
      return "bg-red-500/15 text-red-300 border-red-500/30"
    case "Remplacé":
    case "En attente":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30"
  }
}

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [nom, setNom] = useState("")
  const [statut, setStatut] = useState("Actif")
  const [temps, setTemps] = useState("35h")

  const [posteId, setPosteId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [siteId, setSiteId] = useState("")

  const [postes, setPostes] = useState<RefItem[]>([])
  const [services, setServices] = useState<RefItem[]>([])
  const [sites, setSites] = useState<RefItem[]>([])

  const [absences, setAbsences] = useState<AbsenceItem[]>([])
  const [planning, setPlanning] = useState<PlanningItem[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedPoste = useMemo(
    () => postes.find((poste) => String(poste.id) === posteId)?.nom || "Non renseigné",
    [postes, posteId]
  )

  const selectedService = useMemo(
    () =>
      services.find((service) => String(service.id) === serviceId)?.nom ||
      "Non renseigné",
    [services, serviceId]
  )

  const selectedSite = useMemo(
    () => sites.find((site) => String(site.id) === siteId)?.nom || "Non renseigné",
    [sites, siteId]
  )

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const { data: postesData } = await supabase
        .from("postes")
        .select("*")
        .order("nom")

      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .order("nom")

      const { data: sitesData } = await supabase
        .from("sites")
        .select("*")
        .order("nom")

      setPostes((postesData || []) as RefItem[])
      setServices((servicesData || []) as RefItem[])
      setSites((sitesData || []) as RefItem[])

      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        alert("Erreur chargement agent")
        setLoading(false)
        return
      }

      setNom(data.nom || "")
      setStatut(data.statut || "Actif")
      setTemps(data.temps || "35h")
      setPosteId(data.poste_id ? String(data.poste_id) : "")
      setServiceId(data.service_id ? String(data.service_id) : "")
      setSiteId(data.site_id ? String(data.site_id) : "")

      const { data: absencesData } = await supabase
        .from("absences")
        .select("id,type,date_debut,date_fin,statut_validation")
        .eq("agent_id", id)
        .order("date_debut", { ascending: false })
        .limit(8)

      const { data: planningData } = await supabase
        .from("planning_journalier")
        .select(`
          id,
          date,
          heure_debut,
          heure_fin,
          statut,
          sites:site_id (
            nom
          )
        `)
        .eq("agent_id", id)
        .order("date", { ascending: false })
        .limit(8)

      setAbsences((absencesData || []) as AbsenceItem[])
      setPlanning((planningData || []) as PlanningItem[])
      setLoading(false)
    }

    loadData()
  }, [id])

  async function modifierAgent() {
    setSaving(true)

    const { error } = await supabase
      .from("agents")
      .update({
        nom,
        statut,
        temps,
        poste_id: posteId ? Number(posteId) : null,
        service_id: serviceId ? Number(serviceId) : null,
        site_id: siteId ? Number(siteId) : null,
      })
      .eq("id", id)

    setSaving(false)

    if (error) {
      console.error(error)
      alert("Erreur modification")
      return
    }

    router.push("/dashboard/agents")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
        Chargement de la fiche agent...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
      <Link
        href="/dashboard/agents"
        className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827]"
      >
        ← Retour Agents
      </Link>

      <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm text-yellow-400 font-semibold mb-1">AGENTIS</p>
          <h1 className="text-3xl font-bold">Fiche agent</h1>
          <p className="text-slate-400">
            Informations RH, affectations et historique
          </p>
        </div>

        <span
          className={`w-fit px-3 py-2 rounded-xl border text-xs font-semibold ${badgeClass(
            statut
          )}`}
        >
          {statut}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-6">
            <div className="h-20 w-20 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mb-4">
              <span className="text-3xl font-black text-yellow-400">
                {nom ? nom.charAt(0).toUpperCase() : "A"}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white">
              {nom || "Agent sans nom"}
            </h2>

            <p className="text-slate-400 mt-2">
              {selectedPoste}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500">Temps</p>
                <p className="font-bold text-yellow-400">{temps}</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500">Statut</p>
                <p className="font-bold text-yellow-400">{statut}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">
              Organisation
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Site</p>
                <p>{selectedSite}</p>
              </div>

              <div>
                <p className="text-slate-500">Service</p>
                <p>{selectedService}</p>
              </div>

              <div>
                <p className="text-slate-500">Poste</p>
                <p>{selectedPoste}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-5">
              Modifier les informations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">
                  Nom de l'agent
                </label>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom de l'agent"
                  className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map((site) => (
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
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                >
                  <option value="">Sélectionner un service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Poste
                </label>
                <select
                  value={posteId}
                  onChange={(e) => setPosteId(e.target.value)}
                  className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                >
                  <option value="">Sélectionner un poste</option>
                  {postes.map((poste) => (
                    <option key={poste.id} value={poste.id}>
                      {poste.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Statut
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                >
                  <option>Actif</option>
                  <option>Absent</option>
                  <option>Suspendu</option>
                  <option>Inactif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Temps de travail
                </label>
                <select
                  value={temps}
                  onChange={(e) => setTemps(e.target.value)}
                  className="w-full rounded-xl bg-[#020817] border border-slate-700 px-4 py-3"
                >
                  <option>35h</option>
                  <option>32h</option>
                  <option>28h</option>
                  <option>24h</option>
                  <option>20h</option>
                  <option>18h</option>
                  <option>16h</option>
                </select>
              </div>
            </div>

            <button
              onClick={modifierAgent}
              disabled={saving}
              className="mt-6 px-5 py-3 rounded-xl bg-yellow-500 text-slate-950 font-semibold disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">
                Historique absences
              </h3>

              {absences.length ? (
                <div className="space-y-3">
                  {absences.map((absence) => (
                    <div
                      key={absence.id}
                      className="border border-slate-800 bg-[#111827] rounded-xl p-4"
                    >
                      <p className="font-semibold">
                        {absence.type || "Absence"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {absence.date_debut || "-"} → {absence.date_fin || "-"}
                      </p>
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-xl border text-xs ${badgeClass(
                          absence.statut_validation || ""
                        )}`}
                      >
                        {absence.statut_validation || "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Aucun historique d'absence pour cet agent.
                </p>
              )}
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">
                Dernières affectations
              </h3>

              {planning.length ? (
                <div className="space-y-3">
                  {planning.map((item) => (
                    <div
                      key={item.id}
                      className="border border-slate-800 bg-[#111827] rounded-xl p-4"
                    >
                      <p className="font-semibold">
                        {item.date || "Date non renseignée"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {item.sites?.nom || "Site non renseigné"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {item.heure_debut || "-"} / {item.heure_fin || "-"}
                      </p>
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-xl border text-xs ${badgeClass(
                          item.statut || ""
                        )}`}
                      >
                        {item.statut || "Statut inconnu"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Aucune affectation récente pour cet agent.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}