"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react"

import { planningSlots } from "@/lib/planning/slots"
import PlanningRequirementsService, {
  type PlanningRequirementRow,
} from "@/lib/services/PlanningRequirementsService"

type SiteRow = {
  id: string | number
  nom: string
}

type Props = {
  sites: SiteRow[]
  initialRequirements: PlanningRequirementRow[]
}

type RequirementValues = Record<
  string,
  Record<string, number>
>

function buildValues(
  sites: SiteRow[],
  rows: PlanningRequirementRow[]
): RequirementValues {
  const values: RequirementValues = {}

  for (const site of sites) {
    const siteId = String(site.id)
    values[siteId] = {}

    for (const slot of planningSlots) {
      values[siteId][slot.key] = 0
    }
  }

  for (const row of rows) {
    const siteId = String(row.site_id)

    if (!values[siteId]) {
      values[siteId] = {}
    }

    values[siteId][row.slot_key] =
      Math.max(0, Number(row.required_agents) || 0)
  }

  return values
}

export default function PlanningRequirementsEditor({
  sites,
  initialRequirements,
}: Props) {
  const [values, setValues] = useState<RequirementValues>(() =>
    buildValues(sites, initialRequirements)
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const totalsBySite = useMemo(() => {
    return sites.reduce<Record<string, number>>(
      (result, site) => {
        const siteId = String(site.id)

        result[siteId] = planningSlots.reduce(
          (total, slot) =>
            total + (values[siteId]?.[slot.key] || 0),
          0
        )

        return result
      },
      {}
    )
  }, [sites, values])

  function updateValue(
    siteId: string,
    slotKey: string,
    value: string
  ) {
    const numericValue = Math.max(
      0,
      Math.trunc(Number(value) || 0)
    )

    setSaved(false)

    setValues((current) => ({
      ...current,
      [siteId]: {
        ...current[siteId],
        [slotKey]: numericValue,
      },
    }))
  }

  async function saveAll() {
    try {
      setSaving(true)
      setSaved(false)
      setErrorMessage("")

      const operations = sites.flatMap((site) => {
        const siteId = String(site.id)

        return planningSlots.map((slot) =>
          PlanningRequirementsService.updateRequiredAgents({
            siteId: site.id,
            slotKey: slot.key,
            requiredAgents:
              values[siteId]?.[slot.key] || 0,
          })
        )
      })

      await Promise.all(operations)
      setSaved(true)
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer les besoins."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Référentiel des besoins
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Modifiez les effectifs puis enregistrez l’ensemble du tableau.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Besoins enregistrés.
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1250px]">
            <div
              className="grid border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
              style={{
                gridTemplateColumns:
                  "240px repeat(6, minmax(140px, 1fr)) 120px",
              }}
            >
              <div className="p-4">Site</div>

              {planningSlots.map((slot) => (
                <div
                  key={slot.key}
                  className="border-l border-slate-200 p-4"
                >
                  {slot.shortLabel}
                </div>
              ))}

              <div className="border-l border-slate-200 p-4 text-center">
                Total
              </div>
            </div>

            {sites.map((site) => {
              const siteId = String(site.id)

              return (
                <div
                  key={site.id}
                  className="grid border-b border-slate-100 last:border-b-0"
                  style={{
                    gridTemplateColumns:
                      "240px repeat(6, minmax(140px, 1fr)) 120px",
                  }}
                >
                  <div className="flex items-center p-4 font-semibold text-slate-900">
                    {site.nom}
                  </div>

                  {planningSlots.map((slot) => (
                    <div
                      key={slot.key}
                      className="border-l border-slate-100 p-3"
                    >
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={
                          values[siteId]?.[slot.key] || 0
                        }
                        onChange={(event) =>
                          updateValue(
                            siteId,
                            slot.key,
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center font-semibold text-slate-900 outline-none transition focus:border-amber-400"
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-center border-l border-slate-100 bg-slate-50 p-4">
                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 font-bold text-amber-700">
                      {totalsBySite[siteId] || 0}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}