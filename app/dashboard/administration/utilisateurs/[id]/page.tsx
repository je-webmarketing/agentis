"use client"

import Link from "next/link"
import {
  useParams,
  useRouter,
} from "next/navigation"
import {
  useEffect,
  useState,
} from "react"
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  UserCog,
} from "lucide-react"

import UserForm, {
  type UserFormValues,
} from "@/components/administration/users/UserForm"

import type {
  ProfileRecord,
} from "@/lib/services/ProfileService"
import AdminUsersApi from "@/lib/services/AdminUsersApi"

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

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()

  const userId = String(params.id ?? "")

  const [profile, setProfile] =
    useState<ProfileRecord | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  /*
   * ==========================================
   * CHARGEMENT UTILISATEUR
   * ==========================================
   */

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        setLoading(true)
        setErrorMessage("")

        if (!userId) {
          throw new Error(
            "Identifiant utilisateur manquant."
          )
        }

        const users =
  await AdminUsersApi.list()

const data =
  users.find(
    (user) => user.id === userId
  ) ?? null

  const additionalSitesResponse =
  await fetch(
    `/api/admin/users/${userId}/sites`,
    {
      cache: "no-store",
    }
  )

        if (!active) {
          return
        }

        if (!data) {
          throw new Error(
            "Utilisateur introuvable."
          )
        }

        setProfile(data)
      } catch (error: unknown) {
        if (!active) {
          return
        }

        setErrorMessage(
          getErrorMessage(error)
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [userId])

  

  /*
   * ==========================================
   * ENREGISTREMENT
   * ==========================================
   */

  async function handleSubmit(
    values: UserFormValues
  ) {
    if (!profile) {
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage("")

     console.log("UPDATE USER PAYLOAD", {
  id: profile.id,
  email: values.email,
  login_identifier: values.login_identifier,
}) 

      await AdminUsersApi.update({
  id: profile.id,

  
  contact_email:
  values.contact_email || null,
 login_identifier:
  values.login_identifier || null, 
  nom: values.nom || null,
  prenom: values.prenom || null,
  telephone: values.telephone || null,
  fonction: values.fonction || null,

  role: values.role,

  custom_role_id:
    values.custom_role_id ?? null,

  structure_id:
    values.structure_id || null,

  site_id:
    values.site_id || null,

  service_id:
    values.service_id || null,

  additional_site_ids:
  values.additional_site_ids ?? [],

  actif: values.actif,
})

      router.push(
        "/dashboard/administration/utilisateurs"
      )

      router.refresh()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )
    } finally {
      setSubmitting(false)
    }
  }

  /*
   * ==========================================
   * CHARGEMENT
   * ==========================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />

            <span className="text-sm font-semibold">
              Chargement de l’utilisateur…
            </span>
          </div>
        </div>
      </main>
    )
  }

  /*
   * ==========================================
   * ERREUR DE CHARGEMENT
   * ==========================================
   */

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <Link
            href="/dashboard/administration/utilisateurs"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux utilisateurs
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {errorMessage ||
              "Utilisateur introuvable."}
          </div>
        </div>
      </main>
    )
  }

  /*
   * ==========================================
   * PAGE
   * ==========================================
   */

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/administration/utilisateurs"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux utilisateurs
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Gestion sécurisée
          </span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-t-4 border-amber-500 px-6 py-7 sm:px-8">
            <div className="flex items-start gap-4">

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <UserCog className="h-6 w-6" />
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                  AGENTIS · Administration
                </p>

                <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
                  Modifier l’utilisateur
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {profile.prenom}{" "}
                  {profile.nom}
                  {" · "}
                  {profile.email}
                </p>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </section>
        )}

        <UserForm
  key={profile.id}
  initialValues={{
    nom: profile.nom ?? "",
    prenom: profile.prenom ?? "",
    email: profile.email,

    contact_email:
      profile.contact_email ?? "",

    telephone:
      profile.telephone ?? "",

    fonction:
      profile.fonction ?? "",

    role:
      profile.role,

    custom_role_id:
      profile.custom_role_id,

    actif:
      profile.actif,

    structure_id:
      profile.structure_id !== null
        ? String(profile.structure_id)
        : "",

    site_id:
      profile.site_id !== null
        ? String(profile.site_id)
        : "",

    service_id:
      profile.service_id !== null
        ? String(profile.service_id)
        : "",

    additional_site_ids:
      (
        profile.responsable_site_affectations ??
        []
      )
        .filter(
          (affectation) =>
            affectation.actif === true &&
            affectation.principal !== true
        )
        .map(
          (affectation) =>
            String(
              affectation.site_id
            )
        ),
  }}
  submitting={submitting}
  submitLabel="Enregistrer les modifications"
  onSubmit={handleSubmit}
/>
      </div>
    </main>
  )
}