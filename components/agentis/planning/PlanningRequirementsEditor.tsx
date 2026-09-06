"use client"

import {
  useMemo,
  useState,
} from "react"

import {
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react"

import {
  planningSlots,
  type PlanningSlotKey,
} from "@/lib/planning/slots"

import PlanningRequirementsService, {
  planningRequirementRoles,
  type PlanningRequirementRoleKey,
  type PlanningRequirementRow,
  type PlanningRequirementSlotKey,
} from "@/lib/services/PlanningRequirementsService"

type SiteRow = {
  id: string | number
  nom: string
}

type Props = {
  sites: SiteRow[]
  initialRequirements: PlanningRequirementRow[]
}

type RoleValues = Partial<
  Record<
    PlanningRequirementRoleKey,
    number
  >
>

type SlotValues = Partial<
  Record<
    PlanningRequirementSlotKey,
    RoleValues
  >
>

type RequirementValues = Record<
  string,
  SlotValues
>

/*
 * =========================================================
 * CONSTRUCTION DES VALEURS INITIALES
 * =========================================================
 */

function buildValues(
  sites: SiteRow[],
  rows: PlanningRequirementRow[]
): RequirementValues {
  const values: RequirementValues = {}

  for (const site of sites) {
    const siteId =
      String(site.id)

    values[siteId] = {}

    for (const slot of planningSlots) {
      values[siteId][slot.key] = {}
    }
  }

  for (const row of rows) {
    const siteId =
      String(row.site_id)

    if (!values[siteId]) {
      values[siteId] = {}
    }

    if (
      !values[siteId][row.slot_key]
    ) {
      values[siteId][row.slot_key] = {}
    }

    values[siteId][row.slot_key]![
      row.role_key
    ] = Math.max(
      0,
      Number(
        row.required_agents
      ) || 0
    )
  }

  return values
}

/*
 * =========================================================
 * EDITEUR
 * =========================================================
 */

export default function PlanningRequirementsEditor({
  sites,
  initialRequirements,
}: Props) {
  const [
    values,
    setValues,
  ] =
    useState<RequirementValues>(
      () =>
        buildValues(
          sites,
          initialRequirements
        )
    )

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    saved,
    setSaved,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  /*
   * Rôle sélectionné dans le petit
   * menu "Ajouter un rôle".
   *
   * Une sélection indépendante
   * par site + créneau.
   */
  const [
    roleToAdd,
    setRoleToAdd,
  ] = useState<
    Record<string, string>
  >({})

  /*
   * =======================================================
   * TOTAL PAR SITE
   * =======================================================
   */

  const totalsBySite =
    useMemo(() => {
      return sites.reduce<
        Record<
          string,
          number
        >
      >(
        (
          result,
          site
        ) => {
          const siteId =
            String(
              site.id
            )

          result[siteId] =
            planningSlots.reduce(
              (
                siteTotal,
                slot
              ) => {
                const roleValues =
                  values[
                    siteId
                  ]?.[
                    slot.key
                  ] || {}

                const slotTotal =
                  Object.values(
                    roleValues
                  ).reduce(
                    (
                      total,
                      value
                    ) =>
                      total +
                      (
                        Number(
                          value
                        ) ||
                        0
                      ),
                    0
                  )

                return (
                  siteTotal +
                  slotTotal
                )
              },
              0
            )

          return result
        },
        {}
      )
    }, [
      sites,
      values,
    ])

  /*
   * =======================================================
   * MODIFICATION D'UNE QUANTITÉ
   * =======================================================
   */

  function updateValue(
    siteId: string,
    slotKey: PlanningSlotKey,
    roleKey: PlanningRequirementRoleKey,
    value: string
  ) {
    const numericValue =
      Math.max(
        0,
        Math.trunc(
          Number(value) ||
            0
        )
      )

    setSaved(false)

    setValues(
      (current) => ({
        ...current,

        [siteId]: {
          ...current[
            siteId
          ],

          [slotKey]: {
            ...current[
              siteId
            ]?.[
              slotKey
            ],

            [roleKey]:
              numericValue,
          },
        },
      })
    )
  }

  /*
   * =======================================================
   * AJOUT D'UN RÔLE
   * =======================================================
   */

 async function addRole(
  siteId: string,
  slotKey: PlanningSlotKey
) {
  const selectorKey =
    `${siteId}-${slotKey}`

  const selectedRole =
    roleToAdd[selectorKey] as
      | PlanningRequirementRoleKey
      | undefined

  if (!selectedRole) {
    return
  }

  setSaved(false)
  setErrorMessage("")

  /*
   * On lit l'état actuel AVANT le setValues.
   */
  const currentSlot =
    values[siteId]?.[slotKey] || {}

  const nonPreciseValue =
    Number(
      currentSlot.non_precise
    ) || 0

  const currentSelectedValue =
    Number(
      currentSlot[selectedRole]
    ) || 0

  const replacingNonPrecise =
    selectedRole !== "non_precise" &&
    nonPreciseValue > 0

  /*
   * Si on transforme un ancien besoin
   * "Non précisé" en vrai métier,
   * on supprime d'abord l'ancienne ligne
   * dans Supabase.
   */
  if (replacingNonPrecise) {
    try {
      await PlanningRequirementsService.deleteRequirement({
        siteId,
        slotKey,
        roleKey: "non_precise",
      })
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de remplacer le besoin non précisé."
      )

      return
    }
  }

  const newSelectedValue =
    currentSelectedValue > 0
      ? currentSelectedValue
      : replacingNonPrecise
        ? nonPreciseValue
        : 1

  /*
   * Ensuite seulement on met à jour
   * l'affichage React.
   */
  setValues((current) => {
    const previousSlot =
      current[siteId]?.[slotKey] || {}

    const nextSlot = {
      ...previousSlot,
    }

    if (replacingNonPrecise) {
      delete nextSlot.non_precise
    }

    nextSlot[selectedRole] =
      newSelectedValue

    return {
      ...current,

      [siteId]: {
        ...current[siteId],

        [slotKey]:
          nextSlot,
      },
    }
  })

  setRoleToAdd((current) => ({
    ...current,
    [selectorKey]: "",
  }))
}
  /*
   * =======================================================
   * SUPPRESSION VISUELLE D'UN RÔLE
   *
   * On conserve la valeur 0 dans le state.
   * Au prochain enregistrement, Supabase
   * recevra donc bien 0 pour cette combinaison.
   * =======================================================
   */

  async function removeRole(
  siteId: string,
  slotKey: PlanningSlotKey,
  roleKey: PlanningRequirementRoleKey
) {
  try {
    setSaved(false)
    setErrorMessage("")

    await PlanningRequirementsService.deleteRequirement({
      siteId,
      slotKey,
      roleKey,
    })

    setValues((current) => {
      const currentSlot =
        current[siteId]?.[slotKey] || {}

      const nextSlot = {
        ...currentSlot,
      }

      delete nextSlot[roleKey]

      return {
        ...current,
        [siteId]: {
          ...current[siteId],
          [slotKey]: nextSlot,
        },
      }
    })
  } catch (error: unknown) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible de supprimer ce besoin."
    )
  }
}
  /*
   * =======================================================
   * ENREGISTREMENT
   * =======================================================
   */

  async function saveAll() {
  try {
    setSaving(true)
    setSaved(false)
    setErrorMessage("")

    const payloads: Array<{
      siteId: string | number
      slotKey: PlanningSlotKey
      roleKey: PlanningRequirementRoleKey
      requiredAgents: number
    }> = []

    /*
     * On part DIRECTEMENT du state affiché.
     * On ne recrée plus toutes les combinaisons
     * site / créneau / rôle avec des zéros.
     */
    for (const [siteId, slotValues] of Object.entries(
      values
    )) {
      for (const [slotKey, roleValues] of Object.entries(
        slotValues
      )) {
        if (!roleValues) {
          continue
        }

        for (const [roleKey, rawValue] of Object.entries(
          roleValues
        )) {
          const requiredAgents = Math.max(
            0,
            Math.trunc(
              Number(rawValue) || 0
            )
          )

          /*
           * On n'envoie que les vrais besoins.
           */
          if (requiredAgents <= 0) {
            continue
          }

          payloads.push({
            siteId,
            slotKey:
              slotKey as PlanningSlotKey,
            roleKey:
              roleKey as PlanningRequirementRoleKey,
            requiredAgents,
          })
        }
      }
    }

    console.table(payloads)

    if (payloads.length === 0) {
      throw new Error(
        "Aucun besoin supérieur à zéro n’est présent dans le formulaire."
      )
    }

    await Promise.all(
      payloads.map((payload) =>
        PlanningRequirementsService.updateRequiredAgents(
          payload
        )
      )
    )

    setSaved(true)
  } catch (error: unknown) {
    console.error(
      "ERREUR ENREGISTREMENT BESOINS:",
      error
    )

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible d’enregistrer les besoins."
    )
  } finally {
    setSaving(false)
  }
}

  /*
   * =======================================================
   * AFFICHAGE
   * =======================================================
   */

  return (
    <section className="space-y-6">

      {/* ===============================================
          EN-TÊTE
      =============================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Planification
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Référentiel des besoins
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Définissez les effectifs nécessaires par
            site, créneau et rôle métier.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void saveAll()
          }
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving
            ? "Enregistrement…"
            : "Enregistrer"}
        </button>
      </div>

      {/* ===============================================
          MESSAGES
      =============================================== */}

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

      {/* ===============================================
          SITES
      =============================================== */}

      <div className="space-y-6">
        {sites.map(
          (site) => {
            const siteId =
              String(
                site.id
              )

            return (
              <article
                key={
                  site.id
                }
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                {/* ---------------------------------------
                    ENTÊTE SITE
                --------------------------------------- */}

                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <UsersRound className="h-5 w-5" />
                    </span>

                    <div>
                      <h3 className="font-bold text-slate-950">
                        {
                          site.nom
                        }
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Besoins en
                        effectifs par
                        créneau
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center">
                    <p className="text-xs font-semibold text-amber-700">
                      Total
                    </p>

                    <p className="text-xl font-bold text-amber-900">
                      {
                        totalsBySite[
                          siteId
                        ] ||
                        0
                      }
                    </p>
                  </div>
                </header>

                {/* ---------------------------------------
                    CRÉNEAUX
                --------------------------------------- */}

                <div className="grid gap-4 p-5 lg:grid-cols-2 2xl:grid-cols-3">
                  {planningSlots.map(
                    (slot) => {
                      const slotValues =
                        values[
                          siteId
                        ]?.[
                          slot.key
                        ] ||
                        {}

                      const visibleRoles =
                        planningRequirementRoles.filter(
                          (role) =>
                            (
                              slotValues[
                                role.key
                              ] ||
                              0
                            ) >
                            0
                        )

                      const slotTotal =
                        Object.values(
                          slotValues
                        ).reduce(
                          (
                            total,
                            value
                          ) =>
                            total +
                            (
                              Number(
                                value
                              ) ||
                              0
                            ),
                          0
                        )

                      const selectorKey =
                        `${siteId}-${slot.key}`

                      const availableRoles =
                        planningRequirementRoles.filter(
                          (role) =>
                            !visibleRoles.some(
                              (
                                visibleRole
                              ) =>
                                visibleRole.key ===
                                role.key
                            )
                        )

                      return (
                        <section
                          key={
                            slot.key
                          }
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                        >
                          {/* TITRE CRÉNEAU */}

                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900">
                                {
                                  slot.shortLabel
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  slot.label
                                }
                              </p>
                            </div>

                            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700">
                              {
                                slotTotal
                              }
                            </span>
                          </div>

                          {/* RÔLES EXISTANTS */}

                          <div className="mt-4 space-y-2">
                            {visibleRoles.length ===
                            0 ? (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-center text-xs text-slate-400">
                                Aucun rôle
                                défini
                              </div>
                            ) : (
                              visibleRoles.map(
                                (
                                  role
                                ) => (
                                  <div
                                    key={
                                      role.key
                                    }
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-slate-700">
                                        {
                                          role.label
                                        }
                                      </p>
                                    </div>

                                    <input
                                      type="number"
                                      min={
                                        0
                                      }
                                      step={
                                        1
                                      }
                                      value={
                                        slotValues[
                                          role
                                            .key
                                        ] ||
                                        0
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateValue(
                                          siteId,
                                          slot.key,
                                          role.key,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-sm font-bold text-slate-900 outline-none transition focus:border-amber-400"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeRole(
                                          siteId,
                                          slot.key,
                                          role.key
                                        )
                                      }
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                      title="Supprimer ce besoin"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )
                              )
                            )}
                          </div>

                          {/* AJOUT D'UN RÔLE */}

                          {availableRoles.length >
                            0 && (
                            <div className="mt-4 flex gap-2">
                              <select
                                value={
                                  roleToAdd[
                                    selectorKey
                                  ] ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  setRoleToAdd(
                                    (
                                      current
                                    ) => ({
                                      ...current,

                                      [selectorKey]:
                                        event
                                          .target
                                          .value,
                                    })
                                  )
                                }
                                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-amber-400"
                              >
                                <option value="">
                                  Ajouter un
                                  rôle…
                                </option>

                                {availableRoles.map(
                                  (
                                    role
                                  ) => (
                                    <option
                                      key={
                                        role.key
                                      }
                                      value={
                                        role.key
                                      }
                                    >
                                      {
                                        role.label
                                      }
                                    </option>
                                  )
                                )}
                              </select>

                              <button
                                type="button"
                                disabled={
                                  !roleToAdd[
                                    selectorKey
                                  ]
                                }
                                onClick={() =>
                                  addRole(
                                    siteId,
                                    slot.key
                                  )
                                }
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                                title="Ajouter le rôle"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </section>
                      )
                    }
                  )}
                </div>
              </article>
            )
          }
        )}
      </div>
    </section>
  )
}