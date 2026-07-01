"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import TabsBar from "@/components/agentis/TabsBar"
import IdentiteTab from "./tabs/IdentiteTab"
import CoordonneesTab from "./tabs/CoordonneesTab"
import ContratTab from "./tabs/ContratTab"
import FormationsTab from "./tabs/FormationsTab"
import AgentIdentityCard from "@/components/agentis/AgentIdentityCard"
import AgentOrganizationCard from "@/components/agentis/AgentOrganizationCard"
import RHAlertsPanel from "@/components/agentis/RHAlertsPanel"
import AgentForm from "@/components/agentis/forms/AgentForm"

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
  sites?: { nom: string | null } | null
}

const tabs = [
  "Identité",
  "Coordonnées",
  "Contrat",
  "Formations",
  "Planning",
  "Absences",
]

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

export default function AgentProfile() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [activeTab, setActiveTab] = useState("Identité")
  const [editMode, setEditMode] = useState(false)

  const [agent, setAgent] = useState<any>(null)
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
    () =>
      postes.find((poste) => String(poste.id) === posteId)?.nom ||
      "Non renseigné",
    [postes, posteId]
  )

  const selectedService = useMemo(
    () =>
      services.find((service) => String(service.id) === serviceId)?.nom ||
      "Non renseigné",
    [services, serviceId]
  )

  const selectedSite = useMemo(
    () =>
      sites.find((site) => String(site.id) === siteId)?.nom ||
      "Non renseigné",
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
        .select(`
          *,
          poste:poste_id (nom),
          service_ref:service_id (nom),
          site:site_id (id, nom, structure_id)
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        alert("Erreur chargement agent")
        setLoading(false)
        return
      }

      setAgent(data)
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
          sites:site_id (nom)
        `)
        .eq("agent_id", id)
        .order("date", { ascending: false })
        .limit(8)

      setAbsences((absencesData || []) as AbsenceItem[])

      const normalizedPlanning: PlanningItem[] = (planningData || []).map(
        (item: any) => ({
          id: item.id,
          date: item.date,
          heure_debut: item.heure_debut,
          heure_fin: item.heure_fin,
          statut: item.statut,
          sites: Array.isArray(item.sites)
            ? item.sites[0] || null
            : item.sites || null,
        })
      )

      setPlanning(normalizedPlanning)
      setLoading(false)
    }

    loadData()
  }, [id])

  async function modifierAgent() {
    setSaving(true)

    const selectedServiceName =
      services.find((service) => String(service.id) === serviceId)?.nom || null

    const { data, error } = await supabase
      .from("agents")
      .update({
        nom,
        statut,
        temps,
        service: selectedServiceName,
        poste_id: posteId ? Number(posteId) : null,
        service_id: serviceId ? Number(serviceId) : null,
        site_id: siteId ? Number(siteId) : null,
      })
      .eq("id", Number(id))
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert("Erreur modification : " + error.message)
      return
    }

    setNom(data.nom || "")
    setStatut(data.statut || "Actif")
    setTemps(data.temps || "35h")
    setPosteId(data.poste_id ? String(data.poste_id) : "")
    setServiceId(data.service_id ? String(data.service_id) : "")
    setSiteId(data.site_id ? String(data.site_id) : "")
    setAgent({ ...agent, ...data })
    setEditMode(false)

    alert("Agent modifié avec succès")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] text-slate-100 p-8">
        Chargement de la fiche agent...
      </div>
    )
  }

  const tabAgent = {
    ...agent,
    nom,
    statut,
    temps,
    poste: { nom: selectedPoste },
    service_ref: { nom: selectedService },
    site: { nom: selectedSite },
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
          <h1 className="text-3xl font-bold">{nom || "Fiche agent"}</h1>
          <p className="text-slate-400">
            Dossier RH Premium — {selectedPoste}
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
          <AgentIdentityCard
            nom={nom}
            poste={selectedPoste}
            statut={statut}
            temps={temps}
            score={82}
          />

          <AgentOrganizationCard
            site={selectedSite}
            service={selectedService}
            poste={selectedPoste}
          />

          <RHAlertsPanel agentId={id} />
        </div>

        <div className="xl:col-span-2">
          <TabsBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="flex justify-end mb-5">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-5 py-2 rounded-xl bg-yellow-500 text-slate-950 font-semibold"
              >
                ✏ Modifier la fiche
              </button>
            ) : (
              <button
                onClick={() => setEditMode(false)}
                className="px-5 py-2 rounded-xl border border-slate-700"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            {activeTab === "Identité" && <IdentiteTab agent={tabAgent} />}

            {activeTab === "Coordonnées" && <CoordonneesTab agentId={id} />}

            {activeTab === "Contrat" && <ContratTab agentId={id} />}

            {activeTab === "Formations" && <FormationsTab agentId={id} />}

            {activeTab === "Planning" && (
              <div className="space-y-3">
                {planning.length ? (
                  planning.map((item) => (
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
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">
                    Aucune affectation récente pour cet agent.
                  </p>
                )}
              </div>
            )}

            {activeTab === "Absences" && (
              <div className="space-y-3">
                {absences.length ? (
                  absences.map((absence) => (
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
                  ))
                ) : (
                  <p className="text-slate-400">
                    Aucun historique d'absence pour cet agent.
                  </p>
                )}
              </div>
            )}
          </div>
          
           {editMode && (
  <AgentForm
    nom={nom}
    statut={statut}
    temps={temps}
    siteId={siteId}
    serviceId={serviceId}
    posteId={posteId}
    sites={sites}
    services={services}
    postes={postes}
    saving={saving}
    onNomChange={setNom}
    onStatutChange={setStatut}
    onTempsChange={setTemps}
    onSiteChange={setSiteId}
    onServiceChange={setServiceId}
    onPosteChange={setPosteId}
    onSave={modifierAgent}
  />
)}
          
        </div>
      </div>
    </div>
  )
}