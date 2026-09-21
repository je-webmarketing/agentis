"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  AgentAffectationService,
  type AgentAffectation,
} from "@/lib/services/AgentAffectationService"

import { SiteService } from "@/lib/services/SiteService"
import { ServiceService } from "@/lib/services/ServiceService"
import { ReferenceService } from "@/lib/services/ReferenceService"

type AffectationsTabProps = {
  agentId: string
}

type PosteRecord = {
  id: string | number
  nom: string
}

export default function AffectationsTab({
  agentId,
}: AffectationsTabProps) {
  const [affectations, setAffectations] =
    useState<AgentAffectation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [showAddForm, setShowAddForm] =
    useState(false)

  const [sites, setSites] =
    useState<
      Awaited<ReturnType<typeof SiteService.list>>
    >([])

  const [services, setServices] =
    useState<
      Awaited<ReturnType<typeof ServiceService.list>>
    >([])

  const [postes, setPostes] =
    useState<PosteRecord[]>([])

  
  const [selectedSiteId, setSelectedSiteId] =
    useState("")

  const [selectedServiceId, setSelectedServiceId] =
    useState("")

  const [selectedPosteId, setSelectedPosteId] =
    useState("")

  useEffect(() => {
    async function loadAffectations() {
      setLoading(true)
      setErrorMessage("")

      try {
        const data =
          await AgentAffectationService.listByAgent(
            agentId
          )

        setAffectations(data)

        const sitesData =
          await SiteService.list()

        setSites(sitesData)

        const servicesData =
          await ServiceService.list()

        setServices(servicesData)

        const postesData =
          await ReferenceService.getPostes()

        setPostes(
          (postesData ?? []).map((poste) => ({
            id: poste.id,
            nom: poste.nom,
          }))
        )
      } catch (error) {
        setAffectations([])
        setSites([])
        setServices([])
        setPostes([])

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les affectations."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadAffectations()
  }, [agentId])

  async function handleCreateAffectation() {
  if (!selectedSiteId || !selectedServiceId) {
    setErrorMessage(
      "Veuillez sélectionner au minimum un site et un service."
    )
    return
  }

  try {
    setErrorMessage("")

    const created =
      await AgentAffectationService.create({
        agentId,
        siteId: selectedSiteId,
        serviceId: selectedServiceId,
        posteId: selectedPosteId || null,
        principal: affectations.length === 0,
      })

    setAffectations((current) => [
      ...current,
      created,
    ])

    setSelectedSiteId("")
    setSelectedServiceId("")
    setSelectedPosteId("")
    setShowAddForm(false)

    const refreshed =
      await AgentAffectationService.listByAgent(
        agentId
      )

    setAffectations(refreshed)
  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible d'enregistrer l'affectation."
    )
  }
}

async function handleSetPrincipal(
  affectationId: string | number
) {
  try {
    setErrorMessage("")

    await AgentAffectationService.setPrincipal(
      affectationId,
      agentId
    )

    const refreshed =
      await AgentAffectationService.listByAgent(
        agentId
      )

    setAffectations(refreshed)
  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible de définir l'affectation principale."
    )
  }
}

async function handleDeactivateAffectation(
  affectationId: string | number
) {
  const confirmed = window.confirm(
    "Voulez-vous vraiment supprimer cette affectation ?"
  )

  if (!confirmed) return

  try {
    setErrorMessage("")

    await AgentAffectationService.deactivate(
      affectationId
    )

    const refreshed =
      await AgentAffectationService.listByAgent(
        agentId
      )

    setAffectations(refreshed)
  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible de supprimer l'affectation."
    )
  }
}

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        Chargement des affectations…
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        Impossible de charger les affectations :{" "}
        {errorMessage}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Affectations de l’agent
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gérez les postes, services et sites sur lesquels
            cet agent peut être affecté.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          + Ajouter une affectation
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">
                Nouvelle affectation
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Sélection du site, du service et du poste.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setSelectedSiteId("")
                setSelectedServiceId("")
                setSelectedPosteId("")
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Annuler
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Site
              </label>

              <select
                value={selectedSiteId}
                onChange={(event) =>
                  setSelectedSiteId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">
                  Sélectionner un site
                </option>

                {sites.map((site) => (
                  <option
                    key={String(site.id)}
                    value={String(site.id)}
                  >
                    {site.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Service
              </label>

              <select
                value={selectedServiceId}
                onChange={(event) =>
                  setSelectedServiceId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">
                  Sélectionner un service
                </option>

                {services.map((service) => (
                  <option
                    key={String(service.id)}
                    value={String(service.id)}
                  >
                    {service.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Poste
              </label>

              <select
                value={selectedPosteId}
                onChange={(event) =>
                  setSelectedPosteId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">
                  Sélectionner un poste
                </option>

                {postes.map((poste) => (
                  <option
                    key={String(poste.id)}
                    value={String(poste.id)}
                  >
                    {poste.nom}
                  </option>
                ))}
              </select>
            </div>            
          </div>
          <div className="mt-4 flex justify-end">
  <button
    type="button"
    onClick={handleCreateAffectation}
    disabled={
      !selectedSiteId ||
      !selectedServiceId
    }
    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
  >
    Enregistrer l’affectation
  </button>
</div>
        </div>
      )}

      {affectations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-700">
            Aucune affectation enregistrée.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Cet agent ne possède actuellement aucune
            affectation active.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {affectations.map((affectation) => (
            <div
              key={String(affectation.id)}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    Affectation #{affectation.id}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {affectation.site?.nom ??
                      "Site non renseigné"}
                    {" · "}
                    {affectation.service?.nom ??
                      "Service non renseigné"}
                    {" · "}
                    {affectation.poste?.nom ??
                      "Poste non renseigné"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
  {affectation.principal ? (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      Principale
    </span>
  ) : (
    <button
      type="button"
      onClick={() =>
        handleSetPrincipal(affectation.id)
      }
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
    >
      Définir comme principale
    </button>
  )}

  <button
    type="button"
    onClick={() =>
      handleDeactivateAffectation(affectation.id)
    }
    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
  >
    Supprimer
  </button>
</div>
               
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}