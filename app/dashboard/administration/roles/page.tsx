"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react"

import RoleService, {
  type BaseRole,
  type ScopeType,
  type SecurityRoleRecord,
} from "@/lib/services/RoleService"

const baseRoleLabels: Record<
  BaseRole,
  string
> = {
  super_admin: "Super administrateur",
  admin_rh: "Administrateur RH",
  responsable_rh: "Responsable RH",
  responsable_site: "Responsable de site",
  chef_service: "Chef de service",
  agent: "Agent",
}

const scopeLabels: Record<
  ScopeType,
  string
> = {
  global: "Global",
  structure: "Structure",
  site: "Site",
  service: "Service",
  self: "Personnel",
}

function getErrorMessage(
  error: unknown
) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return "Une erreur inconnue est survenue."
}

export default function RolesAdministrationPage() {
  const [roles, setRoles] =
    useState<SecurityRoleRecord[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [openDialog, setOpenDialog] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [name, setName] =
    useState("")

  const [key, setKey] =
    useState("")

  const [description, setDescription] =
    useState("")

  const [baseRole, setBaseRole] =
    useState<BaseRole>(
      "responsable_site"
    )

  const [scopeType, setScopeType] =
    useState<ScopeType>("site")

  const loadRoles =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const data =
          await RoleService.list()

        setRoles(data)
      } catch (error: unknown) {
        setRoles([])

        setErrorMessage(
          getErrorMessage(error)
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  const stats = useMemo(() => {
    return {
      total: roles.length,

      system: roles.filter(
        (role) => role.is_system
      ).length,

      custom: roles.filter(
        (role) => !role.is_system
      ).length,

      active: roles.filter(
        (role) => role.active
      ).length,
    }
  }, [roles])

  function resetForm() {
    setName("")
    setKey("")
    setDescription("")
    setBaseRole(
      "responsable_site"
    )
    setScopeType("site")
  }

  async function handleCreate() {
    if (!name.trim()) {
      setErrorMessage(
        "Le nom du rôle est obligatoire."
      )
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")

      await RoleService.create({
        name,
        key,
        description,
        base_role: baseRole,
        scope_type: scopeType,
        active: true,
      })

      resetForm()
      setOpenDialog(false)

      await loadRoles()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(
    role: SecurityRoleRecord
  ) {
    if (role.is_system) {
      return
    }

    try {
      setErrorMessage("")

      await RoleService.setActive(
        role.id,
        !role.active
      )

      await loadRoles()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )
    }
  }

  async function deleteRole(
    role: SecurityRoleRecord
  ) {
    if (role.is_system) {
      return
    }

    const confirmed =
      window.confirm(
        `Supprimer le rôle « ${role.name} » ?`
      )

    if (!confirmed) {
      return
    }

    try {
      setErrorMessage("")

      await RoleService.delete(
        role.id
      )

      await loadRoles()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/administration"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50"
          >
            ← Centre d’administration
          </Link>

          <button
            type="button"
            onClick={() => {
              setErrorMessage("")
              resetForm()
              setOpenDialog(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Créer un rôle
          </button>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            AGENTIS · Administration
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            Rôles
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Gérez les rôles système et créez
            des rôles personnalisés sans
            modifier le socle RLS.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Rôles"
            value={stats.total}
          />

          <StatCard
            label="Système"
            value={stats.system}
          />

          <StatCard
            label="Personnalisés"
            value={stats.custom}
          />

          <StatCard
            label="Actifs"
            value={stats.active}
          />
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-extrabold">
              Rôles disponibles
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement des rôles…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-4">
                      Rôle
                    </th>

                    <th className="px-5 py-4">
                      Base
                    </th>

                    <th className="px-5 py-4">
                      Périmètre
                    </th>

                    <th className="px-5 py-4">
                      Type
                    </th>

                    <th className="px-5 py-4">
                      Statut
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {roles.map(
                    (role) => (
                      <tr
                        key={role.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold">
                            {role.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {role.key}
                          </div>

                          {role.description && (
                            <div className="mt-1 text-sm text-slate-500">
                              {role.description}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {
                            baseRoleLabels[
                              role.base_role
                            ]
                          }
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {
                            scopeLabels[
                              role.scope_type
                            ]
                          }
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              role.is_system
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {role.is_system
                              ? "Système"
                              : "Personnalisé"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              role.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            }`}
                          >
                            {role.active
                              ? "Actif"
                              : "Inactif"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">

                            {role.is_system ? (
                              <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                                <ShieldCheck className="h-4 w-4" />
                                Protégé
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void toggleActive(
                                      role
                                    )
                                  }
                                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                                >
                                  {role.active
                                    ? "Désactiver"
                                    : "Réactiver"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteRole(
                                      role
                                    )
                                  }
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}

                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-extrabold">
                  Créer un rôle
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Le rôle système parent conserve
                  la sécurité RLS.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpenDialog(false)
                }
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">

              <Field label="Nom du rôle">
                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Responsable périscolaire"
                />
              </Field>

              <Field label="Clé">
                <input
                  value={key}
                  onChange={(event) =>
                    setKey(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="responsable_periscolaire"
                />
              </Field>

              <Field label="Rôle système parent">
                <select
                  value={baseRole}
                  onChange={(event) =>
                    setBaseRole(
                      event.target
                        .value as BaseRole
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  {Object.entries(
                    baseRoleLabels
                  ).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Périmètre">
                <select
                  value={scopeType}
                  onChange={(event) =>
                    setScopeType(
                      event.target
                        .value as ScopeType
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  {Object.entries(
                    scopeLabels
                  ).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setOpenDialog(false)
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  !name.trim()
                }
                onClick={() =>
                  void handleCreate()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Créer le rôle
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
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
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-extrabold">
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
          <UserCog className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}