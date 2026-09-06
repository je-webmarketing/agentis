"use client"

import {
  ArrowLeft,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import Link from "next/link"

import {
  useEffect,
  useState,
} from "react"

import {
  useParams,
} from "next/navigation"

type LegalDocument = {
  id: string
  document_key: string
  title: string
  document_type: string
  content: string
  version: string
  effective_date: string | null
  updated_at: string
}

const DOCUMENT_KEYS: Record<
  string,
  string
> = {
  "mentions-legales":
    "mentions_legales",

  confidentialite:
    "politique_confidentialite",

  cookies:
    "politique_cookies",

  cgu:
    "cgu",

  rgpd:
    "rgpd",
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
      dateStyle: "long",
    }
  ).format(
    new Date(value)
  )
}

export default function LegalDocumentPage() {
  const params =
    useParams<{
      slug: string
    }>()

  const slug =
    params.slug

  const [
    document,
    setDocument,
  ] = useState<LegalDocument | null>(
    null
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true)
        setErrorMessage("")

        const documentKey =
          DOCUMENT_KEYS[slug]

        if (!documentKey) {
          throw new Error(
            "Document légal introuvable."
          )
        }

        const response =
          await fetch(
            "/api/legal-documents",
            {
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
              "Impossible de charger le document."
          )
        }

        const documents:
          LegalDocument[] =
            payload.data ?? []

        const currentDocument =
          documents.find(
            (item) =>
              item.document_key ===
              documentKey
          )

        if (!currentDocument) {
          throw new Error(
            "Ce document n’est pas actuellement publié."
          )
        }

        setDocument(
          currentDocument
        )
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadDocument()
  }, [slug])

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">

        <div className="mb-6">
          <Link
            href="/dashboard/legal"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4" />

            Informations légales
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">

            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />

            Chargement…
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">

            <FileText className="mx-auto h-8 w-8 text-red-300" />

            <p className="mt-4 font-extrabold text-red-700">
              Document indisponible
            </p>

            <p className="mt-2 text-sm text-red-600">
              {errorMessage}
            </p>
          </div>
        ) : document ? (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

              <div className="flex flex-wrap items-start justify-between gap-5">

                <div className="flex items-start gap-4">

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="h-6 w-6" />
                  </span>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
                      AGENTIS
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold">
                      {document.title}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-slate-600">
                    Version{" "}
                    {document.version}
                  </span>

                  {document.effective_date && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
                      Applicable le{" "}
                      {formatDate(
                        document.effective_date
                      )}
                    </span>
                  )}

                </div>
              </div>
            </section>

            <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">

              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {document.content}
              </div>

            </article>
          </>
        ) : null}
      </div>
    </main>
  )
}