"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import AgentForm from "@/components/agentis/forms/AgentForm"
import {
  createEmptyWeeklyCycle,
  type WeeklyCycleDay,
} from "@/components/agentis/forms/AgentWeeklyCycleEditor"
import { supabase } from "@/lib/supabase"

type RefItem = {
  id: number
  nom: string
}

export default function NewAgentPage() {
  const router = useRouter()

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

  const [loadingReferences, setLoadingReferences] =
    useState(true)

  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [estPolyvalent, setEstPolyvalent] =
  useState(false)

 const [
  weeklyCycle,
  setWeeklyCycle,
] = useState<WeeklyCycleDay[]>(
  createEmptyWeeklyCycle()
)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoadingReferences(true)
      setErrorMessage("")

      const [
        postesResult,
        servicesResult,
        sitesResult,
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
      ])

      if (!isMounted) return

      const referenceError =
        postesResult.error ||
        servicesResult.error ||
        sitesResult.error

      if (referenceError) {
        setErrorMessage(
          `Impossible de charger les référentiels : ${referenceError.message}`
        )
      }

      setPostes(postesResult.data || [])
      setServices(servicesResult.data || [])
      setSites(sitesResult.data || [])
      setLoadingReferences(false)
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSave() {
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

    const {
      data: createdAgent,
      error: agentError,
    } = await supabase
      .from("agents")
      .insert({
        nom: trimmedName,
        statut,
        temps,
        poste_id: posteId
          ? Number(posteId)
          : null,
        service_id: serviceId
          ? Number(serviceId)
          : null,
        site_id: siteId
          ? Number(siteId)
          : null,
        est_polyvalent: estPolyvalent,  
      })
      .select("id")
      .single()

    if (agentError || !createdAgent) {
      setErrorMessage(
        agentError?.message ||
          "Impossible de créer l’agent."
      )
      setSaving(false)
      return
    }

    const agentId = createdAgent.id

    const {
      error: coordonneesError,
    } = await supabase
      .from("agent_coordonnees")
      .insert({
        agent_id: agentId,
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
      })

    if (coordonneesError) {
      const { error: rollbackError } =
        await supabase
          .from("agents")
          .delete()
          .eq("id", agentId)

      if (rollbackError) {
        console.error(
          "Erreur lors de l’annulation de la création :",
          rollbackError
        )
      }

      setErrorMessage(
        `L’agent n’a pas été créé : ${coordonneesError.message}`
      )
      setSaving(false)
      return
    }

    router.push(`/dashboard/agents/${agentId}`)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <Link
          href="/dashboard/agents"
          className="mb-5 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          ← Retour aux agents
        </Link>

        <header className="mb-7 border-b border-slate-200 pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            Ressources humaines
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Ajouter un agent
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Créez le dossier professionnel et les
            coordonnées du nouvel agent.
          </p>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loadingReferences ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Chargement des référentiels…
          </div>
        ) : (
          <AgentForm
            nom={nom}
            statut={statut}
            temps={temps}
             weeklyCycle={weeklyCycle}
  onWeeklyCycleChange={setWeeklyCycle}
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
            onContactUrgenceChange={setContactUrgence}
            onTelephoneUrgenceChange={
              setTelephoneUrgence
            }
            onSave={() => void handleSave()}
            estPolyvalent={estPolyvalent}
onEstPolyvalentChange={setEstPolyvalent}
          />
        )}
      </div>
    </main>
  )
}

function toNullable(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue || null
}