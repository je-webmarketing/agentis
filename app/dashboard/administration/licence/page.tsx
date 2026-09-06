"use client"

import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react"

import Link from "next/link"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type Structure = {
  id: number
  nom: string
  type_structure: string | null
  actif: string | boolean | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  telephone: string | null
  email: string | null
  responsable: string | null
}

type LicenseStatus =
  | "active"
  | "suspended"
  | "expired"
  | "cancelled"

type License = {
  id: string
  structure_id: number | null
  organization_name: string
  license_key: string
  plan: string
  status: LicenseStatus
  starts_at: string
  expires_at: string | null
  max_users: number | null
  max_sites: number | null
  notes: string | null
  created_at: string
  updated_at: string
  structures?:
    | {
        id: number
        nom: string
        type_structure: string | null
        ville: string | null
        email: string | null
      }
    | null
}

type LicenseForm = {
  structure_id: string
  plan: string
  max_users: string
  max_sites: string
  expires_at: string
  notes: string
}

type EditForm = {
  plan: string
  max_users: string
  max_sites: string
  expires_at: string
  notes: string
}

const EMPTY_FORM: LicenseForm = {
  structure_id: "",
  plan: "standard",
  max_users: "",
  max_sites: "",
  expires_at: "",
  notes: "",
}

function statusLabel(
  status: LicenseStatus
) {
  const labels: Record<
    LicenseStatus,
    string
  > = {
    active: "Active",
    suspended: "Suspendue",
    expired: "Expirée",
    cancelled: "Annulée",
  }

  return labels[status]
}

function statusClass(
  status: LicenseStatus
) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (status === "suspended") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  return "border-red-200 bg-red-50 text-red-700"
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "short",
    }
  ).format(new Date(value))
}

function dateInputValue(
  value: string | null
) {
  if (!value) {
    return ""
  }

  return value.slice(0, 10)
}

export default function LicencePage() {
  const [
    structures,
    setStructures,
  ] = useState<Structure[]>([])

  const [
    licenses,
    setLicenses,
  ] = useState<License[]>([])

  const [
    form,
    setForm,
  ] = useState<LicenseForm>(
    EMPTY_FORM
  )

  const [
    editingLicense,
    setEditingLicense,
  ] = useState<License | null>(
    null
  )

  const [
    editForm,
    setEditForm,
  ] = useState<EditForm>({
    plan: "standard",
    max_users: "",
    max_sites: "",
    expires_at: "",
    notes: "",
  })

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    creating,
    setCreating,
  ] = useState(false)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    actionLicenseId,
    setActionLicenseId,
  ] = useState<string | null>(
    null
  )

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("")

  const getToken =
    useCallback(async () => {
      const {
        data: { session },
        error,
      } =
        await supabase.auth.getSession()

      if (error) {
        throw error
      }

      if (!session?.access_token) {
        throw new Error(
          "Session administrateur introuvable."
        )
      }

      return session.access_token
    }, [])

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const token =
          await getToken()

        const [
          structuresResponse,
          licensesResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/admin/structures",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
                cache: "no-store",
              }
            ),

            fetch(
              "/api/admin/licenses",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
                cache: "no-store",
              }
            ),
          ])

        const [
          structuresPayload,
          licensesPayload,
        ] =
          await Promise.all([
            structuresResponse.json(),
            licensesResponse.json(),
          ])

        if (
          !structuresResponse.ok ||
          structuresPayload?.ok !== true
        ) {
          throw new Error(
            structuresPayload?.error ||
              "Impossible de charger les structures."
          )
        }

        if (
          !licensesResponse.ok ||
          licensesPayload?.ok !== true
        ) {
          throw new Error(
            licensesPayload?.error ||
              "Impossible de charger les licences."
          )
        }

        setStructures(
          structuresPayload.data ?? []
        )

        setLicenses(
          licensesPayload.data ?? []
        )
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger le module Licence."
        )
      } finally {
        setLoading(false)
      }
    }, [getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleCreate() {
    if (
      creating ||
      !form.structure_id
    ) {
      return
    }

    try {
      setCreating(true)
      setErrorMessage("")
      setSuccessMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          "/api/admin/licenses",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                structure_id:
                  Number(
                    form.structure_id
                  ),

                plan:
                  form.plan,

                max_users:
                  form.max_users ||
                  null,

                max_sites:
                  form.max_sites ||
                  null,

                expires_at:
                  form.expires_at ||
                  null,

                notes:
                  form.notes ||
                  null,
              }),
          }
        )

      const payload =
        await response.json()

      if (
        !response.ok ||
        payload?.ok !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible de créer la licence."
        )
      }

      setSuccessMessage(
        "La licence AGENTIS a été créée."
      )

      setForm(EMPTY_FORM)

      await loadData()
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer la licence."
      )
    } finally {
      setCreating(false)
    }
  }

  function openEdit(
    license: License
  ) {
    setErrorMessage("")
    setSuccessMessage("")

    setEditingLicense(license)

    setEditForm({
      plan:
        license.plan,

      max_users:
        license.max_users === null
          ? ""
          : String(
              license.max_users
            ),

      max_sites:
        license.max_sites === null
          ? ""
          : String(
              license.max_sites
            ),

      expires_at:
        dateInputValue(
          license.expires_at
        ),

      notes:
        license.notes ?? "",
    })
  }

  function closeEdit() {
    if (saving) {
      return
    }

    setEditingLicense(null)
  }

  async function handleSave() {
    if (
      !editingLicense ||
      saving
    ) {
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")
      setSuccessMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          "/api/admin/licenses",
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  editingLicense.id,

                plan:
                  editForm.plan,

                max_users:
                  editForm.max_users ||
                  null,

                max_sites:
                  editForm.max_sites ||
                  null,

                expires_at:
                  editForm.expires_at ||
                  null,

                notes:
                  editForm.notes ||
                  null,
              }),
          }
        )

      const payload =
        await response.json()

      if (
        !response.ok ||
        payload?.ok !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible de modifier la licence."
        )
      }

      setEditingLicense(null)

      setSuccessMessage(
        "La licence a été mise à jour."
      )

      await loadData()
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier la licence."
      )
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(
    license: License
  ) {
    if (actionLicenseId) {
      return
    }

    const newStatus:
      | "active"
      | "suspended" =
      license.status === "active"
        ? "suspended"
        : "active"

    const confirmed =
      window.confirm(
        newStatus === "suspended"
          ? `Suspendre la licence de ${license.organization_name} ?`
          : `Réactiver la licence de ${license.organization_name} ?`
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLicenseId(
        license.id
      )

      setErrorMessage("")
      setSuccessMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          "/api/admin/licenses",
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  license.id,

                status:
                  newStatus,
              }),
          }
        )

      const payload =
        await response.json()

      if (
        !response.ok ||
        payload?.ok !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible de modifier le statut de la licence."
        )
      }

      setSuccessMessage(
        newStatus === "suspended"
          ? "La licence a été suspendue."
          : "La licence a été réactivée."
      )

      await loadData()
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le statut de la licence."
      )
    } finally {
      setActionLicenseId(null)
    }
  }

  const activeLicenses =
    useMemo(
      () =>
        licenses.filter(
          (license) =>
            license.status ===
            "active"
        ).length,
      [licenses]
    )

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard/administration"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            ← Centre d’administration
          </Link>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void loadData()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Actualiser
          </button>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
                AGENTIS · ADMINISTRATION
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Licences
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Gérez les droits d’utilisation
                d’AGENTIS pour chaque structure
                cliente.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Super administrateur
            </span>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Licences"
            value={licenses.length}
          />

          <StatCard
            label="Actives"
            value={activeLicenses}
          />

          <StatCard
            label="Structures"
            value={structures.length}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <Plus className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-lg font-extrabold">
                Créer une licence
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Une licence est actuellement
                rattachée à une seule structure.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold">
                Structure cliente
              </span>

              <select
                value={
                  form.structure_id
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      structure_id:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="">
                  Sélectionner une structure
                </option>

                {structures.map(
                  (structure) => (
                    <option
                      key={
                        structure.id
                      }
                      value={
                        structure.id
                      }
                    >
                      {structure.nom}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold">
                Offre
              </span>

              <select
                value={form.plan}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      plan:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="standard">
                  Standard
                </option>

                <option value="pro">
                  Pro
                </option>

                <option value="enterprise">
                  Enterprise
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold">
                Utilisateurs maximum
              </span>

              <input
                type="number"
                min="1"
                value={
                  form.max_users
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      max_users:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold">
                Sites maximum
              </span>

              <input
                type="number"
                min="1"
                value={
                  form.max_sites
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      max_sites:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold">
                Expiration
              </span>

              <input
                type="date"
                value={
                  form.expires_at
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      expires_at:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold">
                Notes internes
              </span>

              <input
                type="text"
                value={form.notes}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      notes:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={
                creating ||
                !form.structure_id
              }
              onClick={() =>
                void handleCreate()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}

              {creating
                ? "Création…"
                : "Créer la licence"}
            </button>
          </div>
        </section>

        {editingLicense && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-amber-600">
                  Modification
                </p>

                <h2 className="mt-2 text-xl font-extrabold">
                  {
                    editingLicense.organization_name
                  }
                </h2>

                <code className="mt-2 block text-xs font-bold text-slate-500">
                  {
                    editingLicense.license_key
                  }
                </code>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-xl border border-slate-300 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-bold">
                  Offre
                </span>

                <select
                  value={
                    editForm.plan
                  }
                  onChange={(event) =>
                    setEditForm(
                      (current) => ({
                        ...current,
                        plan:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="standard">
                    Standard
                  </option>

                  <option value="pro">
                    Pro
                  </option>

                  <option value="enterprise">
                    Enterprise
                  </option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold">
                  Expiration
                </span>

                <input
                  type="date"
                  value={
                    editForm.expires_at
                  }
                  onChange={(event) =>
                    setEditForm(
                      (current) => ({
                        ...current,
                        expires_at:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold">
                  Utilisateurs maximum
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    editForm.max_users
                  }
                  onChange={(event) =>
                    setEditForm(
                      (current) => ({
                        ...current,
                        max_users:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold">
                  Sites maximum
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    editForm.max_sites
                  }
                  onChange={(event) =>
                    setEditForm(
                      (current) => ({
                        ...current,
                        max_sites:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </label>

              <label className="lg:col-span-2">
                <span className="mb-2 block text-sm font-bold">
                  Notes internes
                </span>

                <textarea
                  rows={3}
                  value={
                    editForm.notes
                  }
                  onChange={(event) =>
                    setEditForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={closeEdit}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleSave()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Enregistrer
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-extrabold">
              Licences enregistrées
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {licenses.length} licence(s)
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement…
            </div>
          ) : licenses.length ===
            0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Aucune licence enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-6 py-4">
                      Structure
                    </th>

                    <th className="px-6 py-4">
                      Licence
                    </th>

                    <th className="px-6 py-4">
                      Offre
                    </th>

                    <th className="px-6 py-4">
                      Statut
                    </th>

                    <th className="px-6 py-4">
                      Limites
                    </th>

                    <th className="px-6 py-4">
                      Expiration
                    </th>

                    <th className="px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {licenses.map(
                    (license) => {
                      const changingStatus =
                        actionLicenseId ===
                        license.id

                      return (
                        <tr
                          key={
                            license.id
                          }
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold">
                              {
                                license.organization_name
                              }
                            </p>

                            {license.structures?.ville && (
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  license.structures.ville
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <code className="text-xs font-bold text-slate-700">
                              {
                                license.license_key
                              }
                            </code>
                          </td>

                          <td className="px-6 py-4 text-sm capitalize">
                            {license.plan}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                                license.status
                              )}`}
                            >
                              {statusLabel(
                                license.status
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {license.max_users ??
                              "∞"}{" "}
                            utilisateurs ·{" "}
                            {license.max_sites ??
                              "∞"}{" "}
                            sites
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(
                              license.expires_at
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex min-w-max flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    license
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Modifier
                              </button>

                              {(license.status ===
                                "active" ||
                                license.status ===
                                  "suspended") && (
                                <button
                                  type="button"
                                  disabled={
                                    changingStatus
                                  }
                                  onClick={() =>
                                    void changeStatus(
                                      license
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                                    license.status ===
                                    "active"
                                      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  }`}
                                >
                                  {changingStatus && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  )}

                                  {license.status ===
                                  "active"
                                    ? "Suspendre"
                                    : "Réactiver"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  )}
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
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-extrabold text-slate-950">
        {value}
      </p>
    </div>
  )
}