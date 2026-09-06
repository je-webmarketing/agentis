"use client"

import {
  CalendarCog,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Wrench,
} from "lucide-react"

import Link from "next/link"

import {
  useCallback,
  useEffect,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type SettingValue = {
  [key: string]: string | boolean | number | null
}

type SystemSetting = {
  id: string
  setting_key: string
  setting_value: SettingValue
  category: string
  label: string | null
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

type IdentityForm = {
  application_name: string
  version: string
}

type RegionalForm = {
  language: string
  timezone: string
  date_format: string
  time_format: string
}

type MaintenanceForm = {
  enabled: boolean
  message: string
}

export default function ParametresPage() {
  const [
    settings,
    setSettings,
  ] = useState<SystemSetting[]>([])

  const [
    identity,
    setIdentity,
  ] = useState<IdentityForm>({
    application_name: "AGENTIS",
    version: "1.0",
  })

  const [
    regional,
    setRegional,
  ] = useState<RegionalForm>({
    language: "fr",
    timezone: "Europe/Paris",
    date_format: "dd/MM/yyyy",
    time_format: "HH:mm",
  })

  const [
    maintenance,
    setMaintenance,
  ] = useState<MaintenanceForm>({
    enabled: false,
    message: "",
  })

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    savingKey,
    setSavingKey,
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

  const loadSettings =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const token =
          await getToken()

        const response =
          await fetch(
            "/api/admin/settings",
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
              "Impossible de charger les paramètres."
          )
        }

        const data: SystemSetting[] =
          payload.data ?? []

        setSettings(data)

        const identitySetting =
          data.find(
            (setting) =>
              setting.setting_key ===
              "app_identity"
          )

        if (identitySetting) {
          setIdentity({
            application_name:
              String(
                identitySetting
                  .setting_value
                  .application_name ??
                  "AGENTIS"
              ),

            version:
              String(
                identitySetting
                  .setting_value
                  .version ??
                  "1.0"
              ),
          })
        }

        const regionalSetting =
          data.find(
            (setting) =>
              setting.setting_key ===
              "regional"
          )

        if (regionalSetting) {
          setRegional({
            language:
              String(
                regionalSetting
                  .setting_value
                  .language ??
                  "fr"
              ),

            timezone:
              String(
                regionalSetting
                  .setting_value
                  .timezone ??
                  "Europe/Paris"
              ),

            date_format:
              String(
                regionalSetting
                  .setting_value
                  .date_format ??
                  "dd/MM/yyyy"
              ),

            time_format:
              String(
                regionalSetting
                  .setting_value
                  .time_format ??
                  "HH:mm"
              ),
          })
        }

        const maintenanceSetting =
          data.find(
            (setting) =>
              setting.setting_key ===
              "maintenance"
          )

        if (maintenanceSetting) {
          setMaintenance({
            enabled:
              maintenanceSetting
                .setting_value
                .enabled === true,

            message:
              String(
                maintenanceSetting
                  .setting_value
                  .message ??
                  ""
              ),
          })
        }
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les paramètres."
        )
      } finally {
        setLoading(false)
      }
    }, [getToken])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  async function saveSetting(
    settingKey: string,
    settingValue: SettingValue,
    success: string
  ) {
    if (savingKey) {
      return
    }

    try {
      setSavingKey(settingKey)
      setErrorMessage("")
      setSuccessMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          "/api/admin/settings",
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
                setting_key:
                  settingKey,

                setting_value:
                  settingValue,
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
            "Impossible d’enregistrer le paramètre."
        )
      }

      setSuccessMessage(success)

      await loadSettings()
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer le paramètre."
      )
    } finally {
      setSavingKey(null)
    }
  }

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
              void loadSettings()
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
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <Settings className="h-6 w-6" />
              </span>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
                  AGENTIS · ADMINISTRATION
                </p>

                <h1 className="mt-2 text-3xl font-extrabold">
                  Paramètres
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  Configurez les réglages
                  généraux et système
                  d’AGENTIS.
                </p>
              </div>
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

        {loading ? (
          <div className="mt-6 flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            Chargement…
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
<Link
  href="/dashboard/administration/parametres/planning"
  className="group rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md xl:col-span-2"
>
  <div className="flex items-center gap-4">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-white text-amber-700">
      <CalendarCog className="h-6 w-6" />
    </span>

    <div className="flex-1">
      <h2 className="text-lg font-extrabold text-slate-950">
        Configuration du planning
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        Configurer les colonnes, leur visibilité, leur ordre et leurs horaires.
      </p>
    </div>

    <span className="text-sm font-extrabold text-amber-700">
      Configurer →
    </span>
  </div>
</Link>
            <SettingCard
              icon={
                <Settings className="h-5 w-5" />
              }
              title="Identité de l’application"
              description="Informations générales affichées pour AGENTIS."
            >
              <div className="grid gap-4">
                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Nom de l’application
                  </span>

                  <input
                    type="text"
                    value={
                      identity.application_name
                    }
                    onChange={(event) =>
                      setIdentity(
                        (current) => ({
                          ...current,
                          application_name:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Version
                  </span>

                  <input
                    type="text"
                    value={
                      identity.version
                    }
                    onChange={(event) =>
                      setIdentity(
                        (current) => ({
                          ...current,
                          version:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <SaveButton
                saving={
                  savingKey ===
                  "app_identity"
                }
                disabled={
                  Boolean(savingKey)
                }
                onClick={() =>
                  void saveSetting(
                    "app_identity",
                    identity,
                    "L’identité d’AGENTIS a été mise à jour."
                  )
                }
              />
            </SettingCard>

            <SettingCard
              icon={
                <Clock3 className="h-5 w-5" />
              }
              title="Paramètres régionaux"
              description="Langue, fuseau horaire et formats d’affichage."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Langue
                  </span>

                  <select
                    value={
                      regional.language
                    }
                    onChange={(event) =>
                      setRegional(
                        (current) => ({
                          ...current,
                          language:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="fr">
                      Français
                    </option>

                    <option value="en">
                      English
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Fuseau horaire
                  </span>

                  <select
                    value={
                      regional.timezone
                    }
                    onChange={(event) =>
                      setRegional(
                        (current) => ({
                          ...current,
                          timezone:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="Europe/Paris">
                      Europe / Paris
                    </option>

                    <option value="Europe/Zurich">
                      Europe / Zurich
                    </option>

                    <option value="UTC">
                      UTC
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Format de date
                  </span>

                  <select
                    value={
                      regional.date_format
                    }
                    onChange={(event) =>
                      setRegional(
                        (current) => ({
                          ...current,
                          date_format:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="dd/MM/yyyy">
                      JJ/MM/AAAA
                    </option>

                    <option value="yyyy-MM-dd">
                      AAAA-MM-JJ
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Format de l’heure
                  </span>

                  <select
                    value={
                      regional.time_format
                    }
                    onChange={(event) =>
                      setRegional(
                        (current) => ({
                          ...current,
                          time_format:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="HH:mm">
                      24 heures
                    </option>

                    <option value="hh:mm a">
                      12 heures
                    </option>
                  </select>
                </label>
              </div>

              <SaveButton
                saving={
                  savingKey ===
                  "regional"
                }
                disabled={
                  Boolean(savingKey)
                }
                onClick={() =>
                  void saveSetting(
                    "regional",
                    regional,
                    "Les paramètres régionaux ont été mis à jour."
                  )
                }
              />
            </SettingCard>

            <SettingCard
              icon={
                <Wrench className="h-5 w-5" />
              }
              title="Mode maintenance"
              description="Prépare le comportement d’AGENTIS lors d’une intervention technique."
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold">
                      Activer le mode maintenance
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Le contrôle d’accès
                      correspondant sera branché
                      séparément.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      maintenance.enabled
                    }
                    onChange={(event) =>
                      setMaintenance(
                        (current) => ({
                          ...current,
                          enabled:
                            event.target.checked,
                        })
                      )
                    }
                    className="h-5 w-5 accent-amber-500"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold">
                  Message de maintenance
                </span>

                <textarea
                  rows={4}
                  value={
                    maintenance.message
                  }
                  onChange={(event) =>
                    setMaintenance(
                      (current) => ({
                        ...current,
                        message:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="AGENTIS est temporairement indisponible pour maintenance."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </label>

              <SaveButton
                saving={
                  savingKey ===
                  "maintenance"
                }
                disabled={
                  Boolean(savingKey)
                }
                onClick={() =>
                  void saveSetting(
                    "maintenance",
                    maintenance,
                    "Le paramètre de maintenance a été mis à jour."
                  )
                }
              />
            </SettingCard>

            <section className="rounded-3xl border border-slate-200 bg-slate-100/70 p-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                État du module
              </p>

              <h2 className="mt-3 text-xl font-extrabold">
                Paramètres système
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {settings.length} bloc(s) de
                paramètres sont actuellement
                enregistrés dans AGENTIS.
              </p>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Les réglages juridiques,
                licences et paramètres de
                sécurité restent gérés dans
                leurs modules respectifs.
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
          {icon}
        </span>

        <div>
          <h2 className="text-lg font-extrabold">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  )
}

function SaveButton({
  saving,
  disabled,
  onClick,
}: {
  saving: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <div className="mt-5 flex justify-end">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
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
  )
}