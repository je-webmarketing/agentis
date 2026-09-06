"use client"

import {
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Scale,
  ShieldCheck,
  ShieldOff,
  Upload,
  X,
} from "lucide-react"

import Link from "next/link"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import LegalSettingsForm from "@/components/administration/LegalSettingsForm"

import {
  generateLegalDocument,
  type LegalSettings,
} from "@/lib/legal-document-templates"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type LegalDocumentType =
  | "mentions_legales"
  | "confidentialite"
  | "cookies"
  | "cgu"
  | "rgpd"
  | "autre"

type LegalDocument = {
  id: string
  document_key: string
  title: string
  document_type: string
  content: string
  published: boolean
  version: string
  effective_date: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

type LegalForm = {
  document_key: string
  title: string
  document_type: LegalDocumentType
  content: string
  published: boolean
  version: string
  effective_date: string
}

const EMPTY_FORM: LegalForm = {
  document_key: "mentions_legales",
  title: "Mentions légales",
  document_type: "mentions_legales",
  content: "",
  published: false,
  version: "1.0",
  effective_date: "",
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    mentions_legales: "Mentions légales",
    confidentialite: "Confidentialité",
    cookies: "Cookies",
    cgu: "CGU",
    rgpd: "RGPD",
    autre: "Autre",
  }

  return labels[type] ?? type
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

export default function DocumentsLegauxPage() {
  const [
    documents,
    setDocuments,
  ] = useState<LegalDocument[]>([])

  const [
    form,
    setForm,
  ] = useState<LegalForm>(
    EMPTY_FORM
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    creating,
    setCreating,
  ] = useState(false)

  const [
    editingDocument,
    setEditingDocument,
  ] = useState<LegalDocument | null>(
    null
  )

  const [
    previewDocument,
    setPreviewDocument,
  ] = useState<LegalDocument | null>(
    null
  )

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false)

  const [
    publishingId,
    setPublishingId,
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

  const [
    legalSettings,
    setLegalSettings,
  ] = useState<LegalSettings | null>(
    null
  )

 const [
  publicationIssues,
  setPublicationIssues,
] = useState<string[]>([]) 

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

  const loadDocuments =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const token =
          await getToken()

        const response =
          await fetch(
            "/api/admin/legal-documents",
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
              "Impossible de charger les documents légaux."
          )
        }

        setDocuments(
          payload.data ?? []
        )
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les documents légaux."
        )
      } finally {
        setLoading(false)
      }
    }, [getToken])

  const loadLegalSettings =
    useCallback(async () => {
      try {
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
              "Impossible de charger les informations légales AGENTIS."
          )
        }

        setLegalSettings(
          payload.data ?? null
        )
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les informations légales AGENTIS."
        )
      }
    }, [getToken])

  useEffect(() => {
    void loadDocuments()
    void loadLegalSettings()
  }, [
    loadDocuments,
    loadLegalSettings,
  ])

  function applyDocumentType(
    type: LegalDocumentType
  ) {
    const presets: Record<
      LegalDocumentType,
      {
        key: string
        title: string
      }
    > = {
      mentions_legales: {
        key: "mentions_legales",
        title:
          "Mentions légales",
      },

      confidentialite: {
        key:
          "politique_confidentialite",
        title:
          "Politique de confidentialité",
      },

      cookies: {
        key:
          "politique_cookies",
        title:
          "Politique relative aux cookies",
      },

      cgu: {
        key: "cgu",
        title:
          "Conditions générales d’utilisation",
      },

      rgpd: {
        key: "rgpd",
        title:
          "Protection des données personnelles",
      },

      autre: {
        key: "autre",
        title:
          "Autre document",
      },
    }

    const preset =
      presets[type]

    setForm(
      (current) => ({
        ...current,

        document_type:
          type,

        document_key:
          preset.key,

        title:
          preset.title,
      })
    )
  }

  function handleGenerateTemplate() {
    if (!legalSettings) {
      setErrorMessage(
        "Renseignez d’abord les informations légales AGENTIS."
      )
      return
    }

    if (
      form.document_type ===
      "autre"
    ) {
      setErrorMessage(
        "Aucun modèle automatique n’est prévu pour le type « Autre »."
      )
      return
    }

    const generated =
      generateLegalDocument(
        form.document_type,
        legalSettings
      )

    if (!generated) {
      setErrorMessage(
        "Impossible de générer ce modèle."
      )
      return
    }

    setForm(
      (current) => ({
        ...current,

        document_key:
          generated.key,

        title:
          generated.title,

        version:
          generated.version,

        content:
          generated.content,

        published:
          false,
      })
    )

    setErrorMessage("")

    setSuccessMessage(
      "Le modèle AGENTIS a été généré en brouillon."
    )
  }

  async function handleCreate() {
    if (creating) {
      return
    }

    if (
      !form.document_key.trim()
    ) {
      setErrorMessage(
        "La clé du document est obligatoire."
      )
      return
    }

    if (!form.title.trim()) {
      setErrorMessage(
        "Le titre est obligatoire."
      )
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
          "/api/admin/legal-documents",
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
                document_key:
                  form.document_key.trim(),

                title:
                  form.title.trim(),

                document_type:
                  form.document_type,

                content:
                  form.content,

                published:
                  false,

                version:
                  form.version.trim() ||
                  "1.0",

                effective_date:
                  form.effective_date ||
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
            "Impossible de créer le document."
        )
      }

      setSuccessMessage(
        "Le document légal a été créé en brouillon."
      )

      setForm(EMPTY_FORM)

      await loadDocuments()
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer le document."
      )
    } finally {
      setCreating(false)
    }
  }

  function startEditing(
    document: LegalDocument
  ) {
    setEditingDocument(
      document
    )

    setForm({
      document_key:
        document.document_key,

      title:
        document.title,

      document_type:
        document.document_type as LegalDocumentType,

      content:
        document.content,

      published:
        document.published,

      version:
        document.version,

      effective_date:
        document.effective_date ??
        "",
    })

    setErrorMessage("")
    setSuccessMessage("")

    window.setTimeout(
      () => {
        documentEditorElement()
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
      },
      0
    )
  }

  function cancelEditing() {
    setEditingDocument(null)
    setForm(EMPTY_FORM)

    setErrorMessage("")
    setSuccessMessage("")
  }

  async function handleUpdate() {
    if (
      !editingDocument ||
      savingEdit
    ) {
      return
    }

    if (
      !form.document_key.trim()
    ) {
      setErrorMessage(
        "La clé du document est obligatoire."
      )
      return
    }

    if (!form.title.trim()) {
      setErrorMessage(
        "Le titre est obligatoire."
      )
      return
    }

    try {
      setSavingEdit(true)

      setErrorMessage("")
      setSuccessMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          `/api/admin/legal-documents/${editingDocument.id}`,
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
                document_key:
                  form.document_key.trim(),

                title:
                  form.title.trim(),

                document_type:
                  form.document_type,

                content:
                  form.content,

                published:
                  editingDocument.published,

                version:
                  form.version.trim() ||
                  "1.0",

                effective_date:
                  form.effective_date ||
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
            "Impossible de modifier le document."
        )
      }

      setSuccessMessage(
        "Le document a été modifié."
      )

      setEditingDocument(null)
      setForm(EMPTY_FORM)

      await loadDocuments()
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le document."
      )
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleTogglePublication(
    
    document: LegalDocument
  ) {
    if (publishingId) {
      return
    }

    try {
  setPublishingId(
    document.id
  )

  setErrorMessage("")
  setSuccessMessage("")
  setPublicationIssues([])

  const token =
    await getToken()

      const nextPublished =
        !document.published

      const response =
        await fetch(
          `/api/admin/legal-documents/${document.id}`,
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
                document_key:
                  document.document_key,

                title:
                  document.title,

                document_type:
                  document.document_type,

                content:
                  document.content,

                published:
                  nextPublished,

                version:
                  document.version,

                effective_date:
                  document.effective_date,
              }),
          }
        )

      const payload =
        await response.json()

if (response.status === 422) {
  const details =
    Array.isArray(payload?.details)
      ? payload.details
      : []

  setPublicationIssues(details)

  setErrorMessage(
    "Publication impossible — document incomplet."
  )

  return
}
      if (
        !response.ok ||
        payload?.ok !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible de modifier l’état de publication."
        )
      }

      setSuccessMessage(
        nextPublished
          ? "Le document a été publié."
          : "Le document a été dépublié."
      )

      if (
        previewDocument?.id ===
        document.id
      ) {
        setPreviewDocument(
          payload.data
        )
      }

      await loadDocuments()
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier l’état de publication."
      )
    } finally {
      setPublishingId(null)
    }
  }

  const publishedCount =
    useMemo(
      () =>
        documents.filter(
          (document) =>
            document.published
        ).length,
      [documents]
    )

  const draftCount =
    documents.length -
    publishedCount

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
            onClick={() => {
              void loadDocuments()
              void loadLegalSettings()
            }}
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

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Documents légaux
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Centralisez les mentions légales,
                informations RGPD, politique de
                confidentialité, cookies et CGU.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />

              Accès Super administrateur
            </span>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold leading-6 text-red-700">
            {errorMessage}
          </div>
        )}

        {publicationIssues.length > 0 && (
  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
    <h3 className="font-extrabold text-red-800">
      Éléments à compléter avant publication
    </h3>

    <ul className="mt-3 space-y-2 text-sm text-red-700">
      {publicationIssues.map(
        (issue, index) => (
          <li
            key={`${issue}-${index}`}
            className="flex gap-2"
          >
            <span>•</span>
            <span>{issue}</span>
          </li>
        )
      )}
    </ul>
  </div>
)}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="mt-6">
          <LegalSettingsForm />
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <StatCard
            label="Documents"
            value={
              documents.length
            }
            icon={
              <FileText className="h-5 w-5" />
            }
          />

          <StatCard
            label="Publiés"
            value={
              publishedCount
            }
            icon={
              <Scale className="h-5 w-5" />
            }
          />

          <StatCard
            label="Brouillons"
            value={
              draftCount
            }
            icon={
              <FileText className="h-5 w-5" />
            }
          />
        </section>

        <section
          id="legal-document-editor"
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-start gap-3">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              {editingDocument ? (
                <Pencil className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </span>

            <div>
              <h2 className="text-lg font-extrabold">
                {editingDocument
                  ? "Modifier le document"
                  : "Ajouter un document"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingDocument
                  ? `Modification de « ${editingDocument.title} ».`
                  : "Les nouveaux documents sont toujours enregistrés en brouillon avant publication."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Clé
              </span>

              <input
                type="text"
                value={
                  form.document_key
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      document_key:
                        event.target.value,
                    })
                  )
                }
                placeholder="mentions_legales"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Titre
              </span>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      title:
                        event.target.value,
                    })
                  )
                }
                placeholder="Mentions légales"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type
              </span>

              <select
                value={
                  form.document_type
                }
                onChange={(event) =>
                  applyDocumentType(
                    event.target
                      .value as LegalDocumentType
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
              >
                <option value="mentions_legales">
                  Mentions légales
                </option>

                <option value="confidentialite">
                  Confidentialité
                </option>

                <option value="cookies">
                  Cookies
                </option>

                <option value="cgu">
                  CGU
                </option>

                <option value="rgpd">
                  RGPD
                </option>

                <option value="autre">
                  Autre
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Version
              </span>

              <input
                type="text"
                value={form.version}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      version:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Date d’effet
              </span>

              <input
                type="date"
                value={
                  form.effective_date
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      effective_date:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
              />
            </label>

            <div className="flex items-center pt-8">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                {editingDocument?.published
                  ? "Publié"
                  : "Brouillon"}
              </span>
            </div>

            <div className="lg:col-span-2">

              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-700">
                  Contenu
                </span>

                <button
                  type="button"
                  onClick={
                    handleGenerateTemplate
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                >
                  Générer le modèle AGENTIS
                </button>
              </div>

              <textarea
                value={
                  form.content
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      content:
                        event.target.value,
                    })
                  )
                }
                rows={18}
                placeholder="Rédigez ici le contenu du document..."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">

            {editingDocument && (
              <button
                type="button"
                disabled={
                  savingEdit
                }
                onClick={
                  cancelEditing
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            )}

            <button
              type="button"
              disabled={
                editingDocument
                  ? savingEdit
                  : creating
              }
              onClick={() =>
                editingDocument
                  ? void handleUpdate()
                  : void handleCreate()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {editingDocument ? (
                savingEdit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )
              ) : creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              {editingDocument
                ? savingEdit
                  ? "Enregistrement…"
                  : "Enregistrer les modifications"
                : creating
                  ? "Création…"
                  : "Créer le document"}
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-extrabold">
              Documents enregistrés
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {documents.length} document(s)
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Chargement…
            </div>
          ) : documents.length ===
            0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              Aucun document légal enregistré.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">

                    <th className="px-6 py-4">
                      Document
                    </th>

                    <th className="px-6 py-4">
                      Type
                    </th>

                    <th className="px-6 py-4">
                      Version
                    </th>

                    <th className="px-6 py-4">
                      État
                    </th>

                    <th className="px-6 py-4">
                      Date d’effet
                    </th>

                    <th className="px-6 py-4">
                      Mise à jour
                    </th>

                    <th className="px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {documents.map(
                    (document) => (
                      <tr
                        key={
                          document.id
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">
                            {document.title}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {
                              document.document_key
                            }
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {typeLabel(
                            document.document_type
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          {
                            document.version
                          }
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                              document.published
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {document.published
                              ? "Publié"
                              : "Brouillon"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(
                            document.effective_date
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(
                            document.updated_at
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDocument(
                                  document
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                            >
                              <Eye className="h-4 w-4" />
                              Prévisualiser
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  document
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </button>

                            <button
                              type="button"
                              disabled={
                                publishingId !==
                                null
                              }
                              onClick={() =>
                                void handleTogglePublication(
                                  document
                                )
                              }
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                                document.published
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {publishingId ===
                              document.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : document.published ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}

                              {publishingId ===
                              document.id
                                ? document.published
                                  ? "Dépublication…"
                                  : "Publication…"
                                : document.published
                                  ? "Dépublier"
                                  : "Publier"}
                            </button>

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

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600">
                  Prévisualisation
                </p>

                <h2 className="mt-1 text-xl font-extrabold">
                  {
                    previewDocument.title
                  }
                </h2>
              </div>

              <button
                type="button"
                aria-label="Fermer la prévisualisation"
                onClick={() =>
                  setPreviewDocument(
                    null
                  )
                }
                className="rounded-xl border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-8 py-6">

              <div className="mb-5 flex flex-wrap gap-3 text-xs">

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold">
                  Version{" "}
                  {
                    previewDocument.version
                  }
                </span>

                <span
                  className={`rounded-full border px-3 py-1.5 font-bold ${
                    previewDocument.published
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {previewDocument.published
                    ? "Publié"
                    : "Brouillon"}
                </span>

                {previewDocument.effective_date && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold">
                    Effet le{" "}
                    {formatDate(
                      previewDocument.effective_date
                    )}
                  </span>
                )}
              </div>

              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {previewDocument.content ||
                  "Ce document ne contient aucun contenu."}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function documentEditorElement() {
  if (
    typeof document ===
    "undefined"
  ) {
    return null
  }

  return document.getElementById(
    "legal-document-editor"
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
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
    </div>
  )
}