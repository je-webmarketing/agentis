"use client"

import {
  Loader2,
  LogOut,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react"

import { useState } from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type SecurityUserRow = {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  role: string
  custom_role_id: number | null
  actif: boolean

  custom_role:
    | {
        id: number
        name: string
      }
    | {
        id: number
        name: string
      }[]
    | null
}

type Props = {
  users: SecurityUserRow[]
  currentUserId: string
}

function getDisplayName(
  user: SecurityUserRow
) {
  const fullName = [
    user.prenom,
    user.nom,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return fullName || user.email
}

function getRoleLabel(
  user: SecurityUserRow
) {
  if (
    user.custom_role &&
    !Array.isArray(user.custom_role)
  ) {
    return user.custom_role.name
  }

  if (
    Array.isArray(user.custom_role) &&
    user.custom_role.length > 0
  ) {
    return user.custom_role[0].name
  }

  const labels: Record<string, string> = {
    super_admin: "Super administrateur",
    admin_rh: "Administrateur RH",
    responsable_rh: "Responsable RH",
    responsable_site: "Responsable de site",
    chef_service: "Chef de service",
    agent: "Agent",
  }

  return labels[user.role] ?? user.role
}

function getErrorMessage(
  error: unknown
) {
  if (error instanceof Error) {
    return error.message
  }

  return "Une erreur inconnue est survenue."
}

export default function SecurityUsersClient({
  users,
  currentUserId,
}: Props) {
  const [workingId, setWorkingId] =
    useState<string | null>(null)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  async function revokeSessions(
    user: SecurityUserRow
  ) {
    const confirmed =
      window.confirm(
        `Déconnecter toutes les sessions de ${getDisplayName(user)} ?`
      )

    if (!confirmed) {
      return
    }

    try {
      setWorkingId(user.id)
      setErrorMessage("")
      setSuccessMessage("")

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!session?.access_token) {
        throw new Error(
          "Session administrateur introuvable."
        )
      }

      const response = await fetch(
        "/api/admin/users/revoke-sessions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            id: user.id,
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
            "Impossible de révoquer les sessions."
        )
      }

      setSuccessMessage(
        `Toutes les sessions de ${getDisplayName(user)} ont été révoquées.`
      )
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )
    } finally {
      setWorkingId(null)
    }
  }

  async function changeActiveStatus(
  user: SecurityUserRow
) {
  const newStatus = !user.actif

  const action =
    newStatus
      ? "réactiver"
      : "désactiver"

  const confirmed =
    window.confirm(
      `Voulez-vous ${action} le compte de ${getDisplayName(user)} ?`
    )

  if (!confirmed) {
    return
  }

  try {
    setWorkingId(user.id)
    setErrorMessage("")
    setSuccessMessage("")

    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    if (!session?.access_token) {
      throw new Error(
        "Session administrateur introuvable."
      )
    }

    const response = await fetch(
      "/api/admin/users/active-status",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({
          id: user.id,
          actif: newStatus,
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
          "Impossible de modifier le statut du compte."
      )
    }

    setSuccessMessage(
      newStatus
        ? `Le compte de ${getDisplayName(user)} a été réactivé.`
        : `Le compte de ${getDisplayName(user)} a été désactivé et ses sessions ont été révoquées.`
    )

    window.location.reload()
  } catch (error: unknown) {
    setErrorMessage(
      getErrorMessage(error)
    )
  } finally {
    setWorkingId(null)
  }
}

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-extrabold">
          Sessions utilisateurs
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Révoquez immédiatement les sessions
          actives d’un utilisateur.
        </p>
      </div>

      {errorMessage && (
        <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="m-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

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
                Statut
              </th>

              <th className="px-5 py-4 text-right">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isCurrentUser =
                user.id === currentUserId

              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold">
                      {getDisplayName(user)}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {user.email}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-700">
                    {getRoleLabel(user)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        user.actif
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {user.actif
                        ? "Actif"
                        : "Inactif"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {isCurrentUser ? (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                          <ShieldAlert className="h-4 w-4" />
                          Session actuelle protégée
                        </span>
                      ) : (
                        <>
                        <button
                          type="button"
                          disabled={
                            workingId ===
                            user.id
                          }
                          onClick={() =>
                            void revokeSessions(
                              user
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100 disabled:opacity-50"
                        >
                          {workingId ===
                          user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}

                          Déconnecter les sessions
                        </button>

                        <button
  type="button"
  disabled={
    workingId === user.id
  }
  onClick={() =>
    void changeActiveStatus(user)
  }
  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
    user.actif
      ? "border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100"
  }`}
>
  {workingId === user.id ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : user.actif ? (
    <UserX className="h-4 w-4" />
  ) : (
    <UserCheck className="h-4 w-4" />
  )}

  {user.actif
    ? "Désactiver"
    : "Réactiver"}
</button>
</>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}