"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import AgentForm from "@/components/agentis/forms/AgentForm"
import AgentIdentityCard from "@/components/agentis/AgentIdentityCard"
import AgentOrganizationCard from "@/components/agentis/AgentOrganizationCard"
import RHAlertsPanel from "@/components/agentis/RHAlertsPanel"
import TabsBar from "@/components/agentis/TabsBar"
import AgentSummaryCards from "@/components/agents/AgentSummaryCards"
import AgentEngine, {
  type AgentSummary,
} from "@/lib/services/AgentEngine"
import { supabase } from "@/lib/supabase"

import CompetencesTab from "./tabs/CompetencesTab"
import ContratTab from "./tabs/ContratTab"
import CoordonneesTab from "./tabs/CoordonneesTab"
import DocumentsTab from "./tabs/DocumentsTab"
import FormationsTab from "./tabs/FormationsTab"
import HabilitationsTab from "./tabs/HabilitationsTab"
import IdentiteTab from "./tabs/IdentiteTab"
import PlanningTab from "./tabs/PlanningTab"
import VisitesMedicalesTab from "./tabs/VisitesMedicalesTab"

type RefItem = {
  id: number
  nom: string
}

type NamedRelation = {
  nom: string | null
}

type SiteRelation = {
  id?: number | null
  nom: string | null
  structure_id?: number | null
}

type AgentRecord = {
  id: number
  nom: string | null
  statut: string | null
  temps: string | null
  service: string | null
  poste_id: number | null
  service_id: number | null
  site_id: number | null
  poste?: NamedRelation | NamedRelation[] | null
  service_ref?: NamedRelation | NamedRelation[] | null
  site?: SiteRelation | SiteRelation[] | null
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
  service: string | null
  sites?: NamedRelation | null
}

type AgentCoordonnees = {
  id?: number
  agent_id?: number
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  telephone?: string | null
  mobile?: string | null
  email_pro?: string | null
  email_perso?: string | null
  contact_urgence?: string | null
  telephone_urgence?: string | null
  matricule?: string | null
  date_naissance?: string | null
  date_embauche?: string | null
}

const tabs = [
  "Identité",
  "Coordonnées",
  "Contrat",
  "Formations",
  "Compétences",
  "Habilitations",
  "Visites médicales",
  "Planning",
  "Absences",
  "Documents",
]

export default function AgentProfile() {
  const params = useParams()
  const router = useRouter()

  const id = String(params.id || "")

  const [activeTab, setActiveTab] = useState("Identité")
  const [editMode, setEditMode] = useState(false)

  const [agent, setAgent] = useState<AgentRecord | null>(null)
  const [coordonnees, setCoordonnees] =
    useState<AgentCoordonnees | null>(null)

  const [nom, setNom] = useState("")
  const [statut, setStatut] = useState("Actif")
  const [temps, setTemps] = useState("35h")

  const [posteId, setPosteId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [siteId, setSiteId] = useState("")

  const [matricule, setMatricule] = useState("")
  const [dateNaissance, setDateNaissance] = useState("")
  const [dateEmbauche, setDateEmbauche] = useState("")

  const [emailPro, setEmailPro] = useState("")
  const [emailPerso, setEmailPerso] = useState("")
  const [telephone, setTelephone] = useState("")
  const [mobile, setMobile] = useState("")

  const [adresse, setAdresse] = useState("")
  const [codePostal, setCodePostal] = useState("")
  const [ville, setVille] = useState("")

  const [contactUrgence, setContactUrgence] = useState("")
  const [telephoneUrgence, setTelephoneUrgence] =
    useState("")

  const [postes, setPostes] = useState<RefItem[]>([])
  const [services, setServices] = useState<RefItem[]>([])
  const [sites, setSites] = useState<RefItem[]>([])

  const [absences, setAbsences] = useState<AbsenceItem[]>([])
  const [planning, setPlanning] = useState<PlanningItem[]>([])
  const [agentSummary, setAgentSummary] =
    useState<AgentSummary | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const selectedPoste = useMemo(
    () =>
      postes.find(
        (poste) => String(poste.id) === posteId
      )?.nom || "Non renseigné",
    [postes, posteId]
  )

  const selectedService = useMemo(
    () =>
      services.find(
        (service) => String(service.id) === serviceId
      )?.nom || "Non renseigné",
    [services, serviceId]
  )

  const selectedSite = useMemo(
    () =>
      sites.find(
        (site) => String(site.id) === siteId
      )?.nom || "Non renseigné",
    [sites, siteId]
  )

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!id) return

      setLoading(true)
      setErrorMessage("")

      const [
        postesResult,
        servicesResult,
        sitesResult,
        agentResult,
        coordonneesResult,
        absencesResult,
        planningResult,
      ] = await Promise.all([
        supabase
          .from("postes")
          .select("id, nom")
          .order("nom", { ascending: true }),

        supabase
          .from("services")
          .select("id, nom")
          .order("nom", { ascending: true }),

        supabase
          .from("sites")
          .select("id, nom")
          .order("nom", { ascending: true }),

        supabase
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
          .eq("id", id)
          .single(),

        supabase
          .from("agent_coordonnees")
          .select(`
            id,
            agent_id,
            adresse,
            code_postal,
            ville,
            telephone,
            mobile,
            email_pro,
            email_perso,
            contact_urgence,
            telephone_urgence,
            matricule,
            date_naissance,
            date_embauche
          `)
          .eq("agent_id", id)
          .maybeSingle(),

        supabase
          .from("absences")
          .select(`
            id,
            type,
            date_debut,
            date_fin,
            statut_validation
          `)
          .eq("agent_id", id)
          .order("date_debut", { ascending: false })
          .limit(8),

        supabase
          .from("planning_journalier")
          .select(`
            id,
            date,
            service,
            heure_debut,
            heure_fin,
            statut,
            sites:site_id (
              nom
            )
          `)
          .eq("agent_id", id)
          .order("date", { ascending: false })
          .limit(20),
      ])

      if (!isMounted) return

      const firstError =
        postesResult.error ||
        servicesResult.error ||
        sitesResult.error ||
        agentResult.error ||
        coordonneesResult.error ||
        absencesResult.error ||
        planningResult.error

      if (firstError || !agentResult.data) {
        setErrorMessage(
          firstError?.message ||
            "Impossible de charger la fiche de l’agent."
        )
        setLoading(false)
        return
      }

      const loadedAgent =
        agentResult.data as AgentRecord

      const loadedCoordonnees =
        (coordonneesResult.data as AgentCoordonnees | null) ??
        null

      const normalizedPlanning: PlanningItem[] = (
        planningResult.data || []
      ).map((item: any) => ({
        id: item.id,
        date: item.date,
        service: item.service,
        heure_debut: item.heure_debut,
        heure_fin: item.heure_fin,
        statut: item.statut,
        sites: normalizeNamedRelation(item.sites),
      }))

      setPostes(postesResult.data || [])
      setServices(servicesResult.data || [])
      setSites(sitesResult.data || [])

      setAgent(loadedAgent)
      setCoordonnees(loadedCoordonnees)

      hydrateAgentFields(loadedAgent)
      hydrateCoordinatesFields(loadedCoordonnees)

      setAbsences(
        (absencesResult.data || []) as AbsenceItem[]
      )

      setPlanning(normalizedPlanning)

      try {
        const summary =
          await AgentEngine.getAgentSummary(id)

        if (isMounted) {
          setAgentSummary(summary)
        }
      } catch (summaryError) {
        console.error(
          "Impossible de charger le résumé RH :",
          summaryError
        )

        if (isMounted) {
          setAgentSummary(null)
        }
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (!id || loading) return

    let cancelled = false

    async function refreshAgentSummary() {
      try {
        const summary =
          await AgentEngine.getAgentSummary(id)

        if (!cancelled) {
          setAgentSummary(summary)
        }
      } catch (summaryError) {
        console.error(
          "Impossible d’actualiser le résumé RH :",
          summaryError
        )
      }
    }

    void refreshAgentSummary()

    return () => {
      cancelled = true
    }
  }, [activeTab, id, loading])

  function hydrateAgentFields(
    loadedAgent: AgentRecord
  ) {
    setNom(loadedAgent.nom || "")
    setStatut(loadedAgent.statut || "Actif")
    setTemps(loadedAgent.temps || "35h")

    setPosteId(
      loadedAgent.poste_id
        ? String(loadedAgent.poste_id)
        : ""
    )

    setServiceId(
      loadedAgent.service_id
        ? String(loadedAgent.service_id)
        : ""
    )

    setSiteId(
      loadedAgent.site_id
        ? String(loadedAgent.site_id)
        : ""
    )
  }

  function hydrateCoordinatesFields(
    loadedCoordonnees: AgentCoordonnees | null
  ) {
    setMatricule(loadedCoordonnees?.matricule || "")
    setDateNaissance(
      loadedCoordonnees?.date_naissance || ""
    )
    setDateEmbauche(
      loadedCoordonnees?.date_embauche || ""
    )

    setEmailPro(loadedCoordonnees?.email_pro || "")
    setEmailPerso(
      loadedCoordonnees?.email_perso || ""
    )

    setTelephone(
      loadedCoordonnees?.telephone || ""
    )

    setMobile(loadedCoordonnees?.mobile || "")
    setAdresse(loadedCoordonnees?.adresse || "")

    setCodePostal(
      loadedCoordonnees?.code_postal || ""
    )

    setVille(loadedCoordonnees?.ville || "")

    setContactUrgence(
      loadedCoordonnees?.contact_urgence || ""
    )

    setTelephoneUrgence(
      loadedCoordonnees?.telephone_urgence || ""
    )
  }

  async function modifierAgent() {
    if (saving) return

    const trimmedName = nom.trim()

    if (!trimmedName) {
      setErrorMessage(
        "Le nom de l’agent est obligatoire."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    const selectedServiceName =
      services.find(
        (service) =>
          String(service.id) === serviceId
      )?.nom || null

    const {
      data: updatedAgent,
      error: agentError,
    } = await supabase
      .from("agents")
      .update({
        nom: trimmedName,
        statut,
        temps,
        service: selectedServiceName,
        poste_id: posteId
          ? Number(posteId)
          : null,
        service_id: serviceId
          ? Number(serviceId)
          : null,
        site_id: siteId
          ? Number(siteId)
          : null,
      })
      .eq("id", Number(id))
      .select("*")
      .single()

    if (agentError || !updatedAgent) {
      setErrorMessage(
        agentError?.message ||
          "Impossible de modifier l’agent."
      )
      setSaving(false)
      return
    }

    const coordonneesPayload = {
      agent_id: Number(id),

      matricule: toNullable(matricule),
      date_naissance: toNullable(dateNaissance),
      date_embauche: toNullable(dateEmbauche),

      email_pro: toNullable(emailPro),
      email_perso: toNullable(emailPerso),

      telephone: toNullable(telephone),
      mobile: toNullable(mobile),

      adresse: toNullable(adresse),
      code_postal: toNullable(codePostal),
      ville: toNullable(ville),

      contact_urgence:
        toNullable(contactUrgence),

      telephone_urgence:
        toNullable(telephoneUrgence),
    }

    let updatedCoordonnees:
      | AgentCoordonnees
      | null = null

    if (coordonnees?.id) {
      const {
        data,
        error,
      } = await supabase
        .from("agent_coordonnees")
        .update(coordonneesPayload)
        .eq("id", coordonnees.id)
        .select()
        .single()

      if (error) {
        setErrorMessage(
          `L’agent a été modifié, mais ses coordonnées n’ont pas pu être enregistrées : ${error.message}`
        )
        setSaving(false)
        return
      }

      updatedCoordonnees =
        data as AgentCoordonnees
    } else {
      const {
        data,
        error,
      } = await supabase
        .from("agent_coordonnees")
        .insert(coordonneesPayload)
        .select()
        .single()

      if (error) {
        setErrorMessage(
          `L’agent a été modifié, mais ses coordonnées n’ont pas pu être créées : ${error.message}`
        )
        setSaving(false)
        return
      }

      updatedCoordonnees =
        data as AgentCoordonnees
    }

    const normalizedAgent: AgentRecord = {
      ...agent,
      ...updatedAgent,
    }

    setAgent(normalizedAgent)
    setCoordonnees(updatedCoordonnees)

    hydrateAgentFields(normalizedAgent)
    hydrateCoordinatesFields(updatedCoordonnees)

    setEditMode(false)
    setSuccessMessage(
      "La fiche agent a été enregistrée."
    )
    try {
      const summary =
        await AgentEngine.getAgentSummary(id)
      setAgentSummary(summary)
    } catch (summaryError) {
      console.error(
        "Impossible d’actualiser le résumé RH :",
        summaryError
      )
    }

    setSaving(false)

    router.refresh()
  }

  function cancelEdition() {
    if (agent) {
      hydrateAgentFields(agent)
    }

    hydrateCoordinatesFields(coordonnees)

    setErrorMessage("")
    setSuccessMessage("")
    setEditMode(false)
  }

  const todayIso = new Date()
    .toISOString()
    .slice(0, 10)

  const nextAssignment = [...planning]
    .filter(
      (item) =>
        item.date !== null &&
        item.date >= todayIso &&
        item.statut !== "Absent" &&
        item.statut !== "Absence"
    )
    .sort((a, b) => {
      const dateComparison =
        String(a.date).localeCompare(
          String(b.date)
        )

      if (dateComparison !== 0) {
        return dateComparison
      }

      return String(
        a.heure_debut || ""
      ).localeCompare(
        String(b.heure_debut || "")
      )
    })[0]

  const nextAssignmentLabel = nextAssignment
    ? `${formatAgentDate(
        nextAssignment.date
      )} · ${formatAgentTime(
        nextAssignment.heure_debut
      )}–${formatAgentTime(
        nextAssignment.heure_fin
      )}`
    : "Aucune à venir"

  const tabAgent = {
    ...agent,

    nom,
    statut,
    temps,

    email:
      coordonnees?.email_pro ||
      coordonnees?.email_perso ||
      null,

    email_pro: coordonnees?.email_pro || null,
    email_perso:
      coordonnees?.email_perso || null,

    telephone:
      coordonnees?.mobile ||
      coordonnees?.telephone ||
      null,

    mobile: coordonnees?.mobile || null,

    adresse: formatAdresse(coordonnees),

    code_postal:
      coordonnees?.code_postal || null,

    ville: coordonnees?.ville || null,

    matricule:
      coordonnees?.matricule || null,

    date_naissance:
      coordonnees?.date_naissance || null,

    date_embauche:
      coordonnees?.date_embauche || null,

    contact_urgence:
      coordonnees?.contact_urgence || null,

    telephone_urgence:
      coordonnees?.telephone_urgence || null,

    poste: {
      nom: selectedPoste,
    },

    service_ref: {
      nom: selectedService,
    },

    site: {
      nom: selectedSite,
    },
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
        <div className="mx-auto w-full max-w-[1800px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Chargement de la fiche agent…
          </div>
        </div>
      </main>
    )
  }

  if (errorMessage && !agent) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
        <div className="mx-auto w-full max-w-[1800px]">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {errorMessage}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1800px]">
        <Link
          href="/dashboard/agents"
          className="mb-5 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          ← Retour aux agents
        </Link>

        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Dossier RH
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {nom || "Fiche agent"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {selectedPoste} • {selectedSite}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${badgeClass(
                statut
              )}`}
            >
              {statut}
            </span>

            {agentSummary && (
              <span
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  agentSummary.compliant
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : agentSummary.criticalAlertCount > 0
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {agentSummary.compliant
                  ? "Dossier conforme"
                  : agentSummary.criticalAlertCount > 0
                    ? `${agentSummary.criticalAlertCount} alerte${
                        agentSummary.criticalAlertCount > 1
                          ? "s"
                          : ""
                      } critique${
                        agentSummary.criticalAlertCount > 1
                          ? "s"
                          : ""
                      }`
                    : `${agentSummary.missingItems.length} élément${
                        agentSummary.missingItems.length > 1
                          ? "s"
                          : ""
                      } à compléter`}
              </span>
            )}

            {!editMode ? (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("")
                  setSuccessMessage("")
                  setEditMode(true)
                }}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Modifier la fiche
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelEdition}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
            )}
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {editMode ? (
          <AgentForm
            nom={nom}
            statut={statut}
            temps={temps}
            siteId={siteId}
            serviceId={serviceId}
            posteId={posteId}
            matricule={matricule}
            dateNaissance={dateNaissance}
            dateEmbauche={dateEmbauche}
            emailPro={emailPro}
            emailPerso={emailPerso}
            telephone={telephone}
            mobile={mobile}
            adresse={adresse}
            codePostal={codePostal}
            ville={ville}
            contactUrgence={contactUrgence}
            telephoneUrgence={telephoneUrgence}
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
            onMatriculeChange={setMatricule}
            onDateNaissanceChange={setDateNaissance}
            onDateEmbaucheChange={setDateEmbauche}
            onEmailProChange={setEmailPro}
            onEmailPersoChange={setEmailPerso}
            onTelephoneChange={setTelephone}
            onMobileChange={setMobile}
            onAdresseChange={setAdresse}
            onCodePostalChange={setCodePostal}
            onVilleChange={setVille}
            onContactUrgenceChange={
              setContactUrgence
            }
            onTelephoneUrgenceChange={
              setTelephoneUrgence
            }
            onSave={() => void modifierAgent()}
          />
        ) : (
          <>
            <AgentSummaryCards
              temps={temps}
              contrat={statut}
              prochaineAffectation={
                nextAssignmentLabel
              }
              alertes={agentSummary?.alertCount || 0}
            />

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <aside className="space-y-6 xl:col-span-1">
                <AgentIdentityCard
                  nom={nom}
                  poste={selectedPoste}
                  statut={statut}
                  temps={temps}
                  score={agentSummary?.score || 0}
                />

                <AgentOrganizationCard
                  site={selectedSite}
                  service={selectedService}
                  poste={selectedPoste}
                />

                <RHAlertsPanel agentId={id} />
              </aside>

              <section className="xl:col-span-2">
                <TabsBar
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  {activeTab === "Identité" && (
                    <IdentiteTab agent={tabAgent} />
                  )}

                  {activeTab === "Coordonnées" && (
                    <CoordonneesTab agentId={id} />
                  )}

                  {activeTab === "Contrat" && (
                    <ContratTab agentId={id} />
                  )}

                  {activeTab === "Formations" && (
                    <FormationsTab agentId={id} />
                  )}

                  {activeTab === "Compétences" && (
                    <CompetencesTab agentId={id} />
                  )}

                  {activeTab === "Habilitations" && (
                    <HabilitationsTab agentId={id} />
                  )}

                  {activeTab === "Visites médicales" && (
                    <VisitesMedicalesTab agentId={id} />
                  )}

                  {activeTab === "Planning" && (
                    <PlanningTab planning={planning} />
                  )}

                  {activeTab === "Absences" && (
                    <AbsencesPanel absences={absences} />
                  )}

                  {activeTab === "Documents" && (
                    <DocumentsTab agentId={id} />
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function AbsencesPanel({
  absences,
}: {
  absences: AbsenceItem[]
}) {
  if (absences.length === 0) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <p className="text-sm text-slate-500">
          Aucun historique d’absence pour cet agent.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {absences.map((absence) => (
        <article
          key={absence.id}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                {absence.type || "Absence"}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {formatAgentDate(
                  absence.date_debut
                )}{" "}
                →{" "}
                {formatAgentDate(
                  absence.date_fin
                )}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(
                absence.statut_validation || ""
              )}`}
            >
              {absence.statut_validation ||
                "En attente"}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function badgeClass(value: string) {
  switch (value) {
    case "Actif":
    case "Validée":
    case "Présent":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"

    case "Absent":
    case "Absence":
    case "Refusée":
      return "border-red-200 bg-red-50 text-red-700"

    case "Remplacé":
    case "En attente":
      return "border-amber-200 bg-amber-50 text-amber-700"

    default:
      return "border-slate-200 bg-slate-100 text-slate-600"
  }
}

function normalizeNamedRelation(
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

function formatAdresse(
  coordonnees?: AgentCoordonnees | null
) {
  if (!coordonnees) {
    return null
  }

  const cityLine = [
    coordonnees.code_postal,
    coordonnees.ville,
  ]
    .filter(Boolean)
    .join(" ")

  return [
    coordonnees.adresse,
    cityLine,
  ]
    .filter(Boolean)
    .join(", ") || null
}

function formatAgentDate(
  value?: string | null
) {
  if (!value) return "Date inconnue"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    "fr-FR"
  ).format(date)
}

function formatAgentTime(
  value?: string | null
) {
  if (!value) return "—"

  return value.slice(0, 5).replace(":", "h")
}

function toNullable(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue || null
}