"use client"

import {
  Building2,
  Loader2,
  MapPin,
  Network,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { supabase } from "@/lib/supabase"

export type UserScopeValues = {
  structure_id: string
  site_id: string
  service_id: string
}

type ReferenceItem = {
  id: string | number
  nom: string | null
}

type SiteItem = ReferenceItem & {
  structure_id?: string | number | null
}

type UserScopeFieldsProps = {
  values: UserScopeValues
  role?: string
  additionalSiteIds?: string[]
  disabled?: boolean

  onChange: (
    values: UserScopeValues
  ) => void

  onAdditionalSitesChange?: (
    siteIds: string[]
  ) => void
}

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"

export default function UserScopeFields({
  values,
  role,
  additionalSiteIds = [],
  disabled = false,
  onChange,
  onAdditionalSitesChange,
}: UserScopeFieldsProps) {
  const [structures, setStructures] = useState<
    ReferenceItem[]
  >([])
  const [sites, setSites] = useState<SiteItem[]>([])
  const [services, setServices] = useState<
    ReferenceItem[]
  >([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let active = true

    async function loadReferences() {
      try {
        setLoading(true)
        setErrorMessage("")

        const [
          structuresResult,
          sitesResult,
          servicesResult,
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
            .from("services")
            .select("id, nom")
            .order("nom", { ascending: true }),
        ])

        const firstError =
          structuresResult.error ||
          sitesResult.error ||
          servicesResult.error

        if (firstError) {
          throw firstError
        }

        if (!active) return

        setStructures(
          (structuresResult.data || []) as ReferenceItem[]
        )

        setSites(
          (sitesResult.data || []) as SiteItem[]
        )

        setServices(
          (servicesResult.data || []) as ReferenceItem[]
        )
      } catch (error: unknown) {
        if (!active) return

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les structures, sites et services."
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadReferences()

    return () => {
      active = false
    }
  }, [])

  const filteredSites = useMemo(() => {
    if (!values.structure_id) {
      return sites
    }

    return sites.filter((site) => {
      if (
        site.structure_id === null ||
        site.structure_id === undefined
      ) {
        return true
      }

      return (
        String(site.structure_id) ===
        String(values.structure_id)
      )
    })
  }, [sites, values.structure_id])

  function updateScope(
    patch: Partial<UserScopeValues>
  ) {
    onChange({
      ...values,
      ...patch,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        Chargement des structures, sites et services…
      </div>
    )
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
          <Building2 className="h-5 w-5" />
        </span>

        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
            Périmètre d’accès
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Limitez l’utilisateur à une structure, un site ou un service.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Building2 className="h-4 w-4 text-amber-600" />
            Structure
          </span>

          <select
            value={values.structure_id}
            disabled={disabled}
            onChange={(event) => {
              updateScope({
                structure_id: event.target.value,
                site_id: "",
              })
            }}
            className={selectClass}
          >
            <option value="">
              Toutes les structures
            </option>

            {structures.map((structure) => (
              <option
                key={structure.id}
                value={String(structure.id)}
              >
                {structure.nom ||
                  `Structure ${structure.id}`}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <MapPin className="h-4 w-4 text-amber-600" />
            Site
          </span>

          <select
            value={values.site_id}
            disabled={disabled}
            onChange={(event) =>
              updateScope({
                site_id: event.target.value,
              })
            }
            className={selectClass}
          >
            <option value="">
              Tous les sites
            </option>

            {filteredSites.map((site) => (
              <option
                key={site.id}
                value={String(site.id)}
              >
                {site.nom || `Site ${site.id}`}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Network className="h-4 w-4 text-amber-600" />
            Service
          </span>

          <select
            value={values.service_id}
            disabled={disabled}
            onChange={(event) =>
              updateScope({
                service_id: event.target.value,
              })
            }
            className={selectClass}
          >
            <option value="">
              Tous les services
            </option>

            {services.map((service) => (
              <option
                key={service.id}
                value={String(service.id)}
              >
                {service.nom ||
                  `Service ${service.id}`}
              </option>
            ))}
          </select>
        </label>
      </div>
{role === "responsable_site" && (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
    <div className="mb-4">
      <h3 className="text-sm font-extrabold text-slate-900">
        Sites supplémentaires
      </h3>

      <p className="mt-1 text-xs text-slate-600">
        Le site sélectionné ci-dessus reste le site principal.
        Vous pouvez ajouter ici les autres sites gérés par ce responsable.
      </p>
    </div>

    <div className="grid gap-3 md:grid-cols-2">
      {filteredSites
        .filter(
          (site) =>
            String(site.id) !==
            String(values.site_id)
        )
        .map((site) => {
          const siteId =
            String(site.id)

          const checked =
            additionalSiteIds.includes(
              siteId
            )

          return (
            <label
              key={site.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => {
                  const next =
                    event.target.checked
                      ? [
                          ...additionalSiteIds,
                          siteId,
                        ]
                      : additionalSiteIds.filter(
                          (id) =>
                            id !== siteId
                        )

                  onAdditionalSitesChange?.(
                    next
                  )
                }}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />

              <span className="text-sm font-medium text-slate-700">
                {site.nom ||
                  `Site ${site.id}`}
              </span>
            </label>
          )
        })}
    </div>
  </div>
)}

    </section>
  )
}