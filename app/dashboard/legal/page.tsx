"use client"

import {
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import Link from "next/link"

import {
  useEffect,
  useState,
} from "react"

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

function documentSlug(
  documentKey: string
) {
  const slugs: Record<
    string,
    string
  > = {
    mentions_legales:
      "mentions-legales",

    politique_confidentialite:
      "confidentialite",

    politique_cookies:
      "cookies",

    cgu:
      "cgu",

    rgpd:
      "rgpd",
  }

  return (
    slugs[documentKey] ??
    documentKey.replaceAll("_", "-")
  )
}

export default function LegalCenterPage() {
  const [
    documents,
    setDocuments,
  ] = useState<LegalDocument[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true)
        setErrorMessage("")

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
            : "Une erreur est survenue."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadDocuments()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-6 w-6" />
            </span>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
                AGENTIS
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Informations légales
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Consultez les documents juridiques
                et informations officielles
                applicables à l’utilisation
                d’AGENTIS.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-6 flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />

            Chargement…
          </div>
        ) : documents.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">

            <FileText className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-4 font-bold text-slate-700">
              Aucun document publié
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Les documents légaux publiés
              apparaîtront ici.
            </p>
          </div>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2">

            {documents.map(
              (document) => (
                <Link
                  key={document.id}
                  href={`/dashboard/legal/${documentSlug(
                    document.document_key
                  )}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">

                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                      <FileText className="h-5 w-5" />
                    </span>

                    <div>
                      <h2 className="font-extrabold text-slate-900 transition group-hover:text-amber-700">
                        {document.title}
                      </h2>

                      <p className="mt-2 text-xs text-slate-500">
                        Version{" "}
                        {document.version}
                      </p>

                      <p className="mt-4 text-sm font-bold text-amber-700">
                        Consulter →
                      </p>
                    </div>
                  </div>
                </Link>
              )
            )}

          </section>
        )}
      </div>
    </main>
  )
}