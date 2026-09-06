"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Check,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react"

import RoleService, {
  type SecurityRoleRecord,
} from "@/lib/services/RoleService"

import RolePermissionService from "@/lib/services/RolePermissionService"

import {
  ALL_PERMISSIONS,
  getRolePermissions,
} from "@/lib/security/RolePermissions"

import type {
  PermissionKey,
} from "@/lib/security/types"

function getErrorMessage(error: unknown) {
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

function getModule(permission: PermissionKey) {
  if (permission === "*") {
    return "global"
  }

  return permission.split(".")[0]
}

function getAction(permission: PermissionKey) {
  if (permission === "*") {
    return "*"
  }

  return permission.split(".")[1]
}

export default function PermissionsPage() {
  const [roles, setRoles] =
    useState<SecurityRoleRecord[]>([])

  const [selectedRoleId, setSelectedRoleId] =
    useState<number | null>(null)

  const [selectedPermissions, setSelectedPermissions] =
    useState<PermissionKey[]>([])

  const [isInherited, setIsInherited] =
  useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage("")

     const data =
  await RoleService.list()

const customRoles =
  data.filter(
    (role) =>
      role.is_system === false
  )

setRoles(customRoles)

if (
  customRoles.length > 0 &&
  selectedRoleId === null
) {
  setSelectedRoleId(
    customRoles[0].id
  )
}
    } catch (error: unknown) {
      setRoles([])
      setErrorMessage(
        getErrorMessage(error)
      )
    } finally {
      setLoading(false)
    }
  }, [selectedRoleId])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  useEffect(() => {
    async function loadPermissions() {
     if (selectedRoleId === null) {
  setSelectedPermissions([])
  setIsInherited(false)
  return
}

      try {
        setErrorMessage("")
        setSuccessMessage("")

        const permissions =
  await RolePermissionService.listByRole(
    selectedRoleId
  )

if (permissions.length > 0) {
  setSelectedPermissions(
    permissions
  )
  setIsInherited(false)
  return
}

const selectedRole =
  roles.find(
    (role) =>
      role.id === selectedRoleId
  )

if (!selectedRole) {
  setSelectedPermissions([])
  setIsInherited(false)
  return
}

const inheritedPermissions =
  getRolePermissions(
    selectedRole.base_role
  )

setSelectedPermissions(
  inheritedPermissions
)

setIsInherited(true)

      } catch (error: unknown) {
        setSelectedPermissions([])
        setErrorMessage(
          getErrorMessage(error)
        )
        setIsInherited(false)
      }
    }

    void loadPermissions()
  }, [
  selectedRoleId,
  roles,
])

  const groupedPermissions = useMemo(() => {
    const groups = new Map<
      string,
      PermissionKey[]
    >()

    for (const permission of ALL_PERMISSIONS) {
      const module = getModule(permission)

      const current =
        groups.get(module) || []

      current.push(permission)

      groups.set(module, current)
    }

    return Array.from(groups.entries())
  }, [])

  function togglePermission(
  permission: PermissionKey
) {
  setIsInherited(false)

  setSelectedPermissions((current) =>
    current.includes(permission)
      ? current.filter(
          (item) => item !== permission
        )
      : [...current, permission]
  )
}

  async function handleSave() {
    if (selectedRoleId === null) {
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")
      setSuccessMessage("")

      await RolePermissionService.replaceForRole(
        selectedRoleId,
        selectedPermissions
      )

      setSuccessMessage(
        "Permissions enregistrées."
      )
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )
    } finally {
      setSaving(false)
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
            disabled={
              saving ||
              selectedRoleId === null
            }
            onClick={() =>
              void handleSave()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Enregistrer
          </button>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            AGENTIS · Administration
          </p>

          {isInherited && selectedRoleId !== null && (
  <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
    <p className="font-bold">
      Permissions héritées
    </p>

    <p className="mt-1">
      Ce rôle utilise actuellement les permissions
      de son rôle système parent. Toute modification
      puis sauvegarde créera une configuration
      personnalisée pour ce rôle.
    </p>
  </section>
)}

          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">
                Permissions
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Configurez les droits applicatifs
                des rôles personnalisés.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              RLS conservée par le rôle système parent
            </span>
          </div>
        </section>

        {errorMessage && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </section>
        )}

        {successMessage && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Rôle 
            </span>

            <select
              value={
                selectedRoleId ?? ""
              }
              onChange={(event) =>
                setSelectedRoleId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                )
              }
              className="w-full max-w-xl rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
            >
              {roles.length === 0 && (
                <option value="">
                  Aucun rôle disponible
                </option>
              )}

              {roles.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {loading ? (
          <section className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white text-slate-600 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            Chargement…
          </section>
        ) : roles.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-extrabold">
              Aucun rôle personnalisé
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Créez d’abord un rôle dans le module Rôles.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {groupedPermissions.map(
              ([module, permissions]) => (
                <article
                  key={module}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-lg font-extrabold capitalize">
                    {module.replaceAll(
                      "_",
                      " "
                    )}
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {permissions.map(
                      (permission) => {
                        const checked =
                          selectedPermissions.includes(
                            permission
                          )

                        return (
                          <button
                            key={permission}
                            type="button"
                            onClick={() =>
                              togglePermission(
                                permission
                              )
                            }
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                              checked
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300"
                            }`}
                          >
                            <span className="capitalize">
                              {getAction(
                                permission
                              )}
                            </span>

                            {checked && (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        )
                      }
                    )}
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </div>
    </main>
  )
}