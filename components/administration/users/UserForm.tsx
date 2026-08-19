"use client"

import {
  BriefcaseBusiness,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import type {
  ProfileRole,
} from "@/lib/services/ProfileService"

import RoleService, {
  type SecurityRoleRecord,
} from "@/lib/services/RoleService"

import UserScopeFields, {
  type UserScopeValues,
} from "@/components/administration/users/UserScopeFields"

import type {
  UserCreatePayload,
} from "@/lib/types/UserCreatePayload"

/*
 * On étend le payload existant pour que le formulaire
 * sache gérer le rôle personnalisé.
 *
 * Cela reste compatible avec les utilisateurs
 * qui n'ont aucun rôle personnalisé.
 */
export type UserFormValues =
  UserCreatePayload & {
    custom_role_id?: number | null
  }

type UserFormProps = {
  initialValues?: Partial<UserFormValues>
  submitting?: boolean
  submitLabel?: string

  onSubmit?: (
    values: UserFormValues
  ) => void | Promise<void>
}

const roleOptions: Array<{
  value: ProfileRole
  label: string
}> = [
  {
    value: "super_admin",
    label: "Super administrateur",
  },
  {
    value: "admin_rh",
    label: "Administrateur RH",
  },
  {
    value: "responsable_rh",
    label: "Responsable RH",
  },
  {
    value: "responsable_site",
    label: "Responsable de site",
  },
  {
    value: "chef_service",
    label: "Chef de service",
  },
  {
    value: "agent",
    label: "Agent",
  },
]

const scopeLabels: Record<
  SecurityRoleRecord["scope_type"],
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

export default function UserForm({
  initialValues = {},
  submitting = false,
  submitLabel = "Enregistrer",
  onSubmit,
}: UserFormProps) {
  const [
    values,
    setValues,
  ] = useState<UserFormValues>({
    nom:
      initialValues.nom || "",

    prenom:
      initialValues.prenom || "",

    email:
      initialValues.email || "",

    telephone:
      initialValues.telephone || "",

    fonction:
      initialValues.fonction || "",

    role:
      initialValues.role || "agent",

    custom_role_id:
      initialValues.custom_role_id ??
      null,

    actif:
      initialValues.actif ?? true,

    structure_id:
      initialValues.structure_id || "",

    site_id:
      initialValues.site_id || "",

    service_id:
      initialValues.service_id || "",
  })

  const [
    customRoles,
    setCustomRoles,
  ] = useState<SecurityRoleRecord[]>([])

  const [
    loadingRoles,
    setLoadingRoles,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  /*
   * =======================================================
   * CHARGEMENT DES RÔLES PERSONNALISÉS
   * =======================================================
   */

  useEffect(() => {
    let active = true

    async function loadCustomRoles() {
      try {
        setLoadingRoles(true)

        const roles =
          await RoleService.list()

        if (!active) {
          return
        }

        setCustomRoles(
          roles.filter(
            (role) =>
              !role.is_system &&
              role.active
          )
        )
      } catch (error: unknown) {
        if (!active) {
          return
        }

        console.error(
          "Impossible de charger les rôles personnalisés :",
          error
        )

        setErrorMessage(
          getErrorMessage(error)
        )

        setCustomRoles([])
      } finally {
        if (active) {
          setLoadingRoles(false)
        }
      }
    }

    void loadCustomRoles()

    return () => {
      active = false
    }
  }, [])

  /*
   * =======================================================
   * CHAMPS
   * =======================================================
   */

  function updateField<
    K extends keyof UserFormValues
  >(
    key: K,
    value: UserFormValues[K]
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateScope(
    scope: UserScopeValues
  ) {
    setValues((current) => ({
      ...current,
      ...scope,
    }))
  }

  /*
   * =======================================================
   * RÔLE SYSTÈME
   *
   * Si on modifie manuellement le rôle système,
   * on retire automatiquement le rôle personnalisé.
   * Cela évite une incohérence entre les deux.
   * =======================================================
   */

  function handleSystemRoleChange(
    role: ProfileRole
  ) {
    setValues((current) => ({
      ...current,
      role,
      custom_role_id: null,
    }))
  }

  /*
   * =======================================================
   * RÔLE PERSONNALISÉ
   *
   * Le rôle personnalisé conserve son rôle système parent
   * pour la sécurité RLS.
   *
   * Exemple :
   *
   * Responsable périscolaire
   *       ↓
   * base_role = responsable_site
   *       ↓
   * profiles.role = responsable_site
   * profiles.custom_role_id = 8
   * =======================================================
   */

  function handleCustomRoleChange(
    value: string
  ) {
    if (!value) {
      setValues((current) => ({
        ...current,
        custom_role_id: null,
      }))

      return
    }

    const roleId =
      Number(value)

    const customRole =
      customRoles.find(
        (role) =>
          role.id === roleId
      )

    if (!customRole) {
      return
    }

    setValues((current) => ({
      ...current,

      custom_role_id:
        customRole.id,

      role:
        customRole.base_role,
    }))
  }

  /*
   * =======================================================
   * VALIDATION / ENREGISTREMENT
   * =======================================================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setErrorMessage("")

    if (!values.email.trim()) {
      setErrorMessage(
        "L’adresse email est obligatoire."
      )
      return
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        values.email.trim()
      )
    ) {
      setErrorMessage(
        "L’adresse email n’est pas valide."
      )
      return
    }

    await onSubmit?.({
      ...values,

      nom:
        values.nom.trim(),

      prenom:
        values.prenom.trim(),

      email:
        values.email
          .trim()
          .toLowerCase(),

      telephone:
        values.telephone.trim(),

      fonction:
        values.fonction.trim(),

      custom_role_id:
        values.custom_role_id ??
        null,
    })
  }

  const selectedCustomRole =
    customRoles.find(
      (role) =>
        role.id ===
        values.custom_role_id
    ) ?? null

  return (
    <form
      onSubmit={(event) =>
        void handleSubmit(event)
      }
      className="space-y-6"
    >
      {/* ERREUR */}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {/* ===================================================
          IDENTITÉ
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <UserRound className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Identité
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Informations principales de
              l’utilisateur.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="Nom"
            icon={
              <UserRound className="h-4 w-4" />
            }
          >
            <input
              type="text"
              value={values.nom}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "nom",
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="JARRY"
            />
          </Field>

          <Field
            label="Prénom"
            icon={
              <UserRound className="h-4 w-4" />
            }
          >
            <input
              type="text"
              value={values.prenom}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "prenom",
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Eric"
            />
          </Field>

          <Field
            label="Email"
            required
            icon={
              <Mail className="h-4 w-4" />
            }
          >
            <input
              type="email"
              value={values.email}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="utilisateur@exemple.fr"
              required
            />
          </Field>

          <Field
            label="Téléphone"
            icon={
              <Phone className="h-4 w-4" />
            }
          >
            <input
              type="tel"
              value={values.telephone}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "telephone",
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="+33 6 00 00 00 00"
            />
          </Field>

          <Field
            label="Fonction"
            icon={
              <BriefcaseBusiness className="h-4 w-4" />
            }
          >
            <input
              type="text"
              value={values.fonction}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "fonction",
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Responsable RH"
            />
          </Field>
        </div>
      </section>

      {/* ===================================================
          ACCÈS
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldCheck className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Accès
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Rôle système, rôle personnalisé
              et état du compte.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">

          {/* RÔLE SYSTÈME */}

          <Field
            label="Rôle système"
            required
            icon={
              <ShieldCheck className="h-4 w-4" />
            }
          >
            <select
              value={values.role}
              onChange={(event) =>
                handleSystemRoleChange(
                  event.target
                    .value as ProfileRole
                )
              }
              className={inputClass}
              disabled={submitting}
            >
              {roleOptions.map(
                (role) => (
                  <option
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                )
              )}
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Ce rôle détermine le socle de
              sécurité et le périmètre RLS.
            </p>
          </Field>

          {/* RÔLE PERSONNALISÉ */}

          <Field
            label="Rôle personnalisé"
            icon={
              loadingRoles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )
            }
          >
            <select
              value={
                values.custom_role_id ??
                ""
              }
              onChange={(event) =>
                handleCustomRoleChange(
                  event.target.value
                )
              }
              className={inputClass}
              disabled={
                submitting ||
                loadingRoles
              }
            >
              <option value="">
                Aucun rôle personnalisé
              </option>

              {customRoles.map(
                (role) => (
                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </option>
                )
              )}
            </select>

            {selectedCustomRole ? (
              <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700">
                <div className="font-bold">
                  {
                    selectedCustomRole.name
                  }
                </div>

                <div className="mt-1">
                  Base sécurité :{" "}
                  {
                    roleOptions.find(
                      (role) =>
                        role.value ===
                        selectedCustomRole.base_role
                    )?.label
                  }
                </div>

                <div className="mt-1">
                  Périmètre configuré :{" "}
                  {
                    scopeLabels[
                      selectedCustomRole
                        .scope_type
                    ]
                  }
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Optionnel. Les permissions
                personnalisées remplacent les
                permissions standards du rôle.
              </p>
            )}
          </Field>

          {/* COMPTE ACTIF */}

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Compte actif
              </p>

              <p className="mt-1 text-xs text-slate-500">
                L’utilisateur pourra accéder à
                AGENTIS.
              </p>
            </div>

            <input
              type="checkbox"
              checked={values.actif}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "actif",
                  event.target.checked
                )
              }
              className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
          </label>
        </div>
      </section>

      {/* ===================================================
          PÉRIMÈTRE
      =================================================== */}

      <UserScopeFields
        values={{
          structure_id:
            values.structure_id,

          site_id:
            values.site_id,

          service_id:
            values.service_id,
        }}
        disabled={submitting}
        onChange={updateScope}
      />

      {/* ===================================================
          ACTION
      =================================================== */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          {submitting
            ? "Enregistrement…"
            : submitLabel}
        </button>
      </div>
    </form>
  )
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-slate-100"

function Field({
  label,
  icon,
  required = false,
  children,
}: {
  label: string
  icon: React.ReactNode
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
        <span className="text-amber-600">
          {icon}
        </span>

        {label}

        {required && (
          <span className="text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  )
}