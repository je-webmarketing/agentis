"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Filter,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  UsersRound,
  XCircle,
} from "lucide-react"

import type {
  ProfileRecord,
  ProfileRole,
} from "@/lib/services/ProfileService"

import AdminUsersApi from "@/lib/services/AdminUsersApi"

import RoleService, {
  type SecurityRoleRecord,
} from "@/lib/services/RoleService"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const roleLabels: Record<ProfileRole, string> = {
  super_admin: "Super administrateur",
  admin_rh: "Administrateur RH",
  responsable_rh: "Responsable RH",
  responsable_site: "Responsable de site",
  chef_service: "Chef de service",
  agent: "Agent",
}


function getRelationName(
  relation:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null
    | undefined
) {
  if (Array.isArray(relation)) {
    return relation[0]?.nom?.trim() || "—"
  }

  return relation?.nom?.trim() || "—"
}

function getDisplayName(profile: ProfileRecord) {
  const fullName = [
    profile.prenom?.trim(),
    profile.nom?.trim(),
  ]
    .filter(Boolean)
    .join(" ")

  return fullName || profile.email
}

function formatDate(value: string | null) {
  if (!value) return "Jamais"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Une erreur inconnue est survenue."
}


export default function UsersAdministrationPage() {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [customRoles, setCustomRoles] =
  useState<SecurityRoleRecord[]>([])

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | ProfileRole>(
    "all"
  )
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all")
  const [resettingPasswordId, setResettingPasswordId] =
  useState<string | null>(null)

const [successMessage, setSuccessMessage] =
  useState("")

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage("")

      const [users, roles] = await Promise.all([
  AdminUsersApi.list(),
  RoleService.list(),
])

setProfiles(users)

setCustomRoles(
  roles.filter(
    (role) =>
      !role.is_system &&
      role.active
  )
)
    } catch (error: unknown) {
      setProfiles([])
      setErrorMessage(
        getErrorMessage(error) ||
          "Impossible de charger les utilisateurs."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  const visibleProfiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return profiles.filter((profile) => {
      const matchesSearch =
        !normalizedSearch ||
        getDisplayName(profile)
          .toLowerCase()
          .includes(normalizedSearch) ||
        profile.email
          .toLowerCase()
          .includes(normalizedSearch) ||
        (profile.fonction || "")
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesRole =
        roleFilter === "all" ||
        profile.role === roleFilter

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? profile.actif
          : !profile.actif)

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      )
    })
  }, [profiles, roleFilter, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: profiles.length,
      active: profiles.filter((profile) => profile.actif).length,
      inactive: profiles.filter((profile) => !profile.actif).length,
      admins: profiles.filter((profile) =>
        ["super_admin", "admin_rh"].includes(profile.role)
      ).length,
    }),
    [profiles]
  )

  async function toggleActive(profile: ProfileRecord) {
    const nextState = !profile.actif

    const confirmed = window.confirm(
      nextState
        ? `Réactiver le compte de ${getDisplayName(profile)} ?`
        : `Désactiver le compte de ${getDisplayName(profile)} ?`
    )

    if (!confirmed) return

    try {
      setUpdatingId(profile.id)
      setErrorMessage("")

      const updated = await AdminUsersApi.update({
  id: profile.id,
  actif: nextState,
})

      setProfiles((current) =>
        current.map((item) =>
          item.id === profile.id
            ? updated
            : item
        )
      )
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error) ||
          "Impossible de modifier l’état du compte."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteProfile(
  profile: ProfileRecord
) {
  const confirmed = window.confirm(
    `Supprimer définitivement le compte de ${getDisplayName(profile)} ?\n\nCette action supprimera également son compte de connexion.`
  )

  if (!confirmed) {
    return
  }

  try {
    setUpdatingId(profile.id)
    setErrorMessage("")

    await AdminUsersApi.delete(profile.id)

    setProfiles((current) =>
      current.filter(
        (item) =>
          item.id !== profile.id
      )
    )
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error) ||
        "Impossible de supprimer cet utilisateur."
    )
  } finally {
    setUpdatingId(null)
  }
}

  function getProfileRoleLabel(
  profile: ProfileRecord
) {
  if (profile.custom_role_id) {
    const customRole =
      customRoles.find(
        (role) =>
          role.id ===
          profile.custom_role_id
      )

    if (customRole) {
      return customRole.name
    }
  }

  return roleLabels[profile.role]
}

async function resetPassword(
  profile: ProfileRecord
) {
  const confirmed = window.confirm(
    `Envoyer un email de réinitialisation du mot de passe à ${profile.email} ?`
  )

  if (!confirmed) {
    return
  }

  try {
    setResettingPasswordId(profile.id)
    setErrorMessage("")
    setSuccessMessage("")

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        profile.email,
        {
          redirectTo:
            `${window.location.origin}/auth/reset-password`,
        }
      )

    if (error) {
      throw error
    }

    setSuccessMessage(
      `Email de réinitialisation envoyé à ${profile.email}.`
    )
  } catch (error: unknown) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible d’envoyer l’email de réinitialisation."
    )
  } finally {
    setResettingPasswordId(null)
  }
}

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/administration"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            ← Centre d’administration
          </Link>

          <Link
            href="/dashboard/administration/utilisateurs/nouveau"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            <UserPlus className="h-4 w-4" />
            Nouvel utilisateur
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            AGENTIS · Administration
          </p>

          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950">
                Utilisateurs
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Gérez les comptes, les rôles, l’état d’activation et le périmètre d’accès des utilisateurs AGENTIS.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Connecté à la table profiles
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Utilisateurs"
            value={stats.total}
            icon={<UsersRound className="h-5 w-5" />}
          />

          <StatCard
            label="Actifs"
            value={stats.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <StatCard
            label="Inactifs"
            value={stats.inactive}
            icon={<XCircle className="h-5 w-5" />}
          />

          <StatCard
            label="Administrateurs"
            value={stats.admins}
            icon={<UserCog className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_220px_220px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher par nom, email ou fonction..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400"
              />
            </label>

            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value as
                      | "all"
                      | ProfileRole
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400"
              >
                <option value="all">Tous les rôles</option>

                {(
                  Object.entries(roleLabels) as Array<
                    [ProfileRole, string]
                  >
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "active"
                    | "inactive"
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </section>

       {errorMessage && (
  <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {errorMessage}
  </section>
)}

{successMessage && (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
    {successMessage}
  </div>
)}

<section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
    <div>
      <h2 className="text-lg font-extrabold text-slate-950">
        Comptes utilisateurs
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        {visibleProfiles.length} résultat
        {visibleProfiles.length > 1 ? "s" : ""}
      </p>
    </div>

            <button
              type="button"
              onClick={() => void loadProfiles()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
            >
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement des utilisateurs…
            </div>
          ) : visibleProfiles.length === 0 ? (
            <div className="p-10 text-center">
              <UsersRound className="mx-auto h-10 w-10 text-slate-400" />

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Aucun utilisateur trouvé
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                La table profiles est vide ou aucun profil ne correspond aux filtres.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-4">
                      Utilisateur
                    </th>
                    <th className="px-5 py-4">
                      Rôle
                    </th>
                    <th className="px-5 py-4">
                      Périmètre
                    </th>
                    <th className="px-5 py-4">
                      Dernière connexion
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
                  {visibleProfiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-950">
                          {getDisplayName(profile)}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {profile.email}
                        </div>

                        {profile.fonction && (
                          <div className="mt-1 text-xs text-slate-400">
                            {profile.fonction}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                          {getProfileRoleLabel(profile)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div>
                          Structure :{" "}
                          <span className="font-semibold text-slate-900">
                            {getRelationName(
                              profile.structure
                            )}
                          </span>
                        </div>

                        <div className="mt-1">
                          Site :{" "}
                          <span className="font-semibold text-slate-900">
                            {getRelationName(profile.site)}
                          </span>
                        </div>

                        <div className="mt-1">
                          Service :{" "}
                          <span className="font-semibold text-slate-900">
                            {getRelationName(
                              profile.service
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          profile.derniere_connexion
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                            profile.actif
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {profile.actif
                            ? "Actif"
                            : "Inactif"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/administration/utilisateurs/${profile.id}`}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                          >
                            Modifier
                          </Link>

                          <button
  type="button"
  disabled={
    resettingPasswordId === profile.id
  }
  onClick={() =>
    void resetPassword(profile)
  }
  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:border-amber-500 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-50"
>
  {resettingPasswordId === profile.id ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <KeyRound className="h-3.5 w-3.5" />
  )}

  {resettingPasswordId === profile.id
    ? "Envoi…"
    : "Réinitialiser MDP"}
</button>

                          <button
                            type="button"
                            disabled={
                              updatingId === profile.id
                            }
                            onClick={() =>
                              void toggleActive(profile)
                            }
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${
                              profile.actif
                                ? "border-red-200 bg-red-50 text-red-700 hover:border-red-400"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                            }`}
                          >
                            {updatingId === profile.id
                              ? "Mise à jour…"
                              : profile.actif
                                ? "Désactiver"
                                : "Réactiver"}
                          </button>

                          <button
  type="button"
  disabled={
    updatingId === profile.id
  }
  onClick={() =>
    void deleteProfile(profile)
  }
  className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
>
  <Trash2 className="h-3.5 w-3.5" />

  Supprimer
</button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-950">
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
          {icon}
        </span>
      </div>
    </article>
  )
}