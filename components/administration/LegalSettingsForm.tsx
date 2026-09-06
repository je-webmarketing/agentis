"use client"

import {
  Building2,
  Loader2,
  Save,
  Server,
  ShieldCheck,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type LegalSettingsFormState = {
  company_name: string
  legal_form: string
  share_capital: string

  siren: string
  siret: string
  rcs: string

  registered_address: string
  postal_code: string
  city: string
  country: string

  contact_email: string
  contact_phone: string

  publication_director: string

  host_name: string
  host_address: string
  host_postal_code: string
  host_city: string
  host_country: string
  host_phone: string

  privacy_contact_email: string

  dpo_name: string
  dpo_email: string

  website_url: string
}

const EMPTY_FORM: LegalSettingsFormState = {
  company_name: "",
  legal_form: "",
  share_capital: "",

  siren: "",
  siret: "",
  rcs: "",

  registered_address: "",
  postal_code: "",
  city: "",
  country: "France",

  contact_email: "",
  contact_phone: "",

  publication_director: "",

  host_name: "",
  host_address: "",
  host_postal_code: "",
  host_city: "",
  host_country: "France",
  host_phone: "",

  privacy_contact_email: "",

  dpo_name: "",
  dpo_email: "",

  website_url: "",
}

export default function LegalSettingsForm() {
  const [form, setForm] =
    useState<LegalSettingsFormState>(
      EMPTY_FORM
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const getToken = useCallback(async () => {
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

  const loadSettings =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const token =
          await getToken()

        const response =
          await fetch(
            "/api/admin/legal-settings",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
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
              "Impossible de charger les informations légales."
          )
        }

        const data =
          payload.data

        if (!data) {
          setForm(EMPTY_FORM)
          return
        }

        setForm({
          company_name:
            data.company_name ?? "",

          legal_form:
            data.legal_form ?? "",

          share_capital:
            data.share_capital ?? "",

          siren:
            data.siren ?? "",

          siret:
            data.siret ?? "",

          rcs:
            data.rcs ?? "",

          registered_address:
            data.registered_address ?? "",

          postal_code:
            data.postal_code ?? "",

          city:
            data.city ?? "",

          country:
            data.country ?? "France",

          contact_email:
            data.contact_email ?? "",

          contact_phone:
            data.contact_phone ?? "",

          publication_director:
            data.publication_director ?? "",

          host_name:
            data.host_name ?? "",

          host_address:
            data.host_address ?? "",

          host_postal_code:
            data.host_postal_code ?? "",

          host_city:
            data.host_city ?? "",

          host_country:
            data.host_country ?? "France",

          host_phone:
            data.host_phone ?? "",

          privacy_contact_email:
            data.privacy_contact_email ?? "",

          dpo_name:
            data.dpo_name ?? "",

          dpo_email:
            data.dpo_email ?? "",

          website_url:
            data.website_url ?? "",
        })
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue."
        )
      } finally {
        setLoading(false)
      }
    }, [getToken])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  async function handleSave() {
    if (saving) return

    try {
      setSaving(true)
      setErrorMessage("")
      setSuccessMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          "/api/admin/legal-settings",
          {
            method: "PUT",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              form
            ),
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
            "Impossible d’enregistrer les informations légales."
        )
      }

      setSuccessMessage(
        "Les informations légales AGENTIS ont été enregistrées."
      )
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer les informations légales."
      )
    } finally {
      setSaving(false)
    }
  }

  function updateField(
    key: keyof LegalSettingsFormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Chargement des informations légales…
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <Building2 className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Informations légales AGENTIS
            </h2>

            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Ces informations globales serviront à préremplir les documents légaux officiels d’AGENTIS.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Global AGENTIS
        </span>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="mt-6 space-y-8">

        <FieldGroup
          title="Éditeur d’AGENTIS"
          icon={
            <Building2 className="h-5 w-5" />
          }
        >
          <Field
            label="Raison sociale"
            value={form.company_name}
            onChange={(value) =>
              updateField(
                "company_name",
                value
              )
            }
            placeholder="Nom de la société éditrice"
          />

          <Field
            label="Forme juridique"
            value={form.legal_form}
            onChange={(value) =>
              updateField(
                "legal_form",
                value
              )
            }
            placeholder="SAS, SARL, EI..."
          />

          <Field
            label="Capital social"
            value={form.share_capital}
            onChange={(value) =>
              updateField(
                "share_capital",
                value
              )
            }
            placeholder="Ex. 10 000 €"
          />

          <Field
            label="SIREN"
            value={form.siren}
            onChange={(value) =>
              updateField(
                "siren",
                value
              )
            }
            placeholder="9 chiffres"
          />

          <Field
            label="SIRET"
            value={form.siret}
            onChange={(value) =>
              updateField(
                "siret",
                value
              )
            }
            placeholder="14 chiffres"
          />

          <Field
            label="RCS"
            value={form.rcs}
            onChange={(value) =>
              updateField(
                "rcs",
                value
              )
            }
            placeholder="Ex. RCS Paris 123 456 789"
          />

          <Field
            label="Adresse du siège"
            value={
              form.registered_address
            }
            onChange={(value) =>
              updateField(
                "registered_address",
                value
              )
            }
            placeholder="Numéro et voie"
            className="lg:col-span-2"
          />

          <Field
            label="Code postal"
            value={form.postal_code}
            onChange={(value) =>
              updateField(
                "postal_code",
                value
              )
            }
          />

          <Field
            label="Ville"
            value={form.city}
            onChange={(value) =>
              updateField(
                "city",
                value
              )
            }
          />

          <Field
            label="Pays"
            value={form.country}
            onChange={(value) =>
              updateField(
                "country",
                value
              )
            }
          />
        </FieldGroup>

        <FieldGroup
          title="Contact et publication"
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
        >
          <Field
            label="E-mail de contact"
            type="email"
            value={form.contact_email}
            onChange={(value) =>
              updateField(
                "contact_email",
                value
              )
            }
          />

          <Field
            label="Téléphone"
            value={form.contact_phone}
            onChange={(value) =>
              updateField(
                "contact_phone",
                value
              )
            }
          />

          <Field
            label="Directeur de publication"
            value={
              form.publication_director
            }
            onChange={(value) =>
              updateField(
                "publication_director",
                value
              )
            }
          />

          <Field
            label="Site officiel"
            type="url"
            value={form.website_url}
            onChange={(value) =>
              updateField(
                "website_url",
                value
              )
            }
            placeholder="https://..."
          />
        </FieldGroup>

        <FieldGroup
          title="Hébergement"
          icon={
            <Server className="h-5 w-5" />
          }
        >
          <Field
            label="Hébergeur"
            value={form.host_name}
            onChange={(value) =>
              updateField(
                "host_name",
                value
              )
            }
          />

          <Field
            label="Adresse"
            value={form.host_address}
            onChange={(value) =>
              updateField(
                "host_address",
                value
              )
            }
            className="lg:col-span-2"
          />

          <Field
            label="Code postal"
            value={
              form.host_postal_code
            }
            onChange={(value) =>
              updateField(
                "host_postal_code",
                value
              )
            }
          />

          <Field
            label="Ville"
            value={form.host_city}
            onChange={(value) =>
              updateField(
                "host_city",
                value
              )
            }
          />

          <Field
            label="Pays"
            value={form.host_country}
            onChange={(value) =>
              updateField(
                "host_country",
                value
              )
            }
          />

          <Field
            label="Téléphone hébergeur"
            value={form.host_phone}
            onChange={(value) =>
              updateField(
                "host_phone",
                value
              )
            }
          />
        </FieldGroup>

        <FieldGroup
          title="Confidentialité et RGPD"
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
        >
          <Field
            label="E-mail confidentialité"
            type="email"
            value={
              form.privacy_contact_email
            }
            onChange={(value) =>
              updateField(
                "privacy_contact_email",
                value
              )
            }
          />

          <Field
            label="Nom du DPO"
            value={form.dpo_name}
            onChange={(value) =>
              updateField(
                "dpo_name",
                value
              )
            }
            placeholder="Optionnel"
          />

          <Field
            label="E-mail du DPO"
            type="email"
            value={form.dpo_email}
            onChange={(value) =>
              updateField(
                "dpo_email",
                value
              )
            }
            placeholder="Optionnel"
          />
        </FieldGroup>

      </div>

      <div className="mt-7 flex justify-end border-t border-slate-200 pt-5">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            void handleSave()
          }
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving
            ? "Enregistrement…"
            : "Enregistrer les informations"}
        </button>
      </div>
    </section>
  )
}

function FieldGroup({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-amber-700">
        {icon}

        <h3 className="font-extrabold text-slate-900">
          {title}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "url"
  placeholder?: string
  className?: string
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
      />
    </label>
  )
}