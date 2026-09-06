"use client"

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import Link from "next/link"

import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"

type LegalDocument = {
  id: string
  title: string
  version: string
  effective_date: string | null
}

type LegalStatus = {
  required: boolean
  accepted: boolean
  document: LegalDocument | null
}

export default function LegalAcceptanceGuard({
  children,
}: {
  children: ReactNode
}) {

const pathname = usePathname()

const isLegalRoute =
  pathname.startsWith("/dashboard/legal")

  const supabase = createClient()

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    accepting,
    setAccepting,
  ] = useState(false)

  const [
    status,
    setStatus,
  ] = useState<LegalStatus | null>(
    null
  )

  const [
    checked,
    setChecked,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
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
          "Session utilisateur introuvable."
        )
      }

      return session.access_token
    }, [supabase])

  const checkAcceptance =
    useCallback(async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const token =
          await getToken()

        const response =
          await fetch(
            "/api/legal-acceptances",
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: "no-store",
            }
          )

        const responseText =
  await response.text()

let payload: {
  ok?: boolean
  required?: boolean
  accepted?: boolean
  error?: string

  document?: {
    id: string
    title: string
    version: string
    effective_date: string | null
  } | null
} = {}

if (responseText) {
  try {
    payload =
      JSON.parse(responseText)
  } catch {
    throw new Error(
      "Le serveur a retourné une réponse invalide."
    )
  }
}


        if (
          !response.ok ||
          payload?.ok !== true
        ) {
          throw new Error(
            payload?.error ||
              "Impossible de vérifier les CGU."
          )
        }

        setStatus({
          required:
            payload.required === true,

          accepted:
            payload.accepted === true,

          document:
            payload.document ?? null,
        })
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de vérifier les CGU."
        )
      } finally {
        setLoading(false)
      }
    }, [getToken])

  useEffect(() => {
  if (isLegalRoute) {
    return
  }

  void checkAcceptance()
}, [
  checkAcceptance,
  isLegalRoute,
])

  async function acceptCGU() {
    if (!checked) {
      return
    }

    try {
      setAccepting(true)
      setErrorMessage("")

      const token =
        await getToken()

      const response =
        await fetch(
          "/api/legal-acceptances",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      const payload =
        await response.json()

      if (
        !response.ok ||
        payload?.ok !== true ||
        payload?.accepted !== true
      ) {
        throw new Error(
          payload?.error ||
            "Impossible d’enregistrer votre acceptation."
        )
      }

      setStatus(
        (current) => ({
          required:
            current?.required ??
            true,

          accepted: true,

          document:
            current?.document ??
            null,
        })
      )
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer votre acceptation."
      )
    } finally {
      setAccepting(false)
    }
  }

  if (isLegalRoute) {
  return <>{children}</>
}

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />

          Vérification des conditions
          d’utilisation…
        </div>
      </div>
    )
  }

  /*
   * Important :
   * si la vérification échoue,
   * on ne laisse pas passer silencieusement.
   */
  if (errorMessage && !status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-5 text-xl font-extrabold text-slate-900">
            Vérification impossible
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void checkAcceptance()
            }
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Réessayer
          </button>

        </div>
      </div>
    )
  }

  /*
   * Aucune acceptation nécessaire
   * ou version déjà acceptée.
   */
  if (
    !status?.required ||
    status.accepted
  ) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">

      <div className="mx-auto max-w-2xl">

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">

          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-7 w-7" />
            </span>
          </div>

          <div className="mt-6 text-center">

            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
              AGENTIS
            </p>

            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
              Conditions Générales
              d’Utilisation
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Avant de continuer,
              veuillez prendre connaissance
              des Conditions Générales
              d’Utilisation d’AGENTIS.
            </p>

          </div>

          {status.document && (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center gap-3">

                <FileText className="h-5 w-5 text-amber-600" />

                <div>
                  <p className="font-bold text-slate-900">
                    {status.document.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Version{" "}
                    {status.document.version}
                  </p>
                </div>

              </div>

              <Link
                href="/dashboard/legal/cgu"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-bold text-amber-700 hover:text-amber-800"
              >
                Lire les CGU →
              </Link>

            </div>
          )}

          <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">

            <input
              type="checkbox"
              checked={checked}
              onChange={(event) =>
                setChecked(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4 accent-amber-600"
            />

            <span className="text-sm leading-6 text-slate-700">
              J’ai lu et j’accepte
              les Conditions Générales
              d’Utilisation d’AGENTIS,
              version{" "}
              <strong>
                {status.document?.version}
              </strong>.
            </span>

          </label>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            disabled={
              !checked ||
              accepting
            }
            onClick={() =>
              void acceptCGU()
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Accepter et continuer
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}