"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Une erreur inconnue est survenue."
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [checkingSession, setCheckingSession] =
    useState(true)

  const [sessionReady, setSessionReady] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [success, setSuccess] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  useEffect(() => {
    let mounted = true

    async function initializeRecovery() {
      try {
        setCheckingSession(true)
        setErrorMessage("")

        /*
         * Cas 1 :
         * Supabase a déjà créé la session
         * de récupération.
         */
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!mounted) {
          return
        }

        if (session) {
          setSessionReady(true)
          setCheckingSession(false)
          return
        }

        /*
         * Cas 2 :
         * on attend que Supabase traite
         * le lien reçu par email.
         */
        const {
          data: listener,
        } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            if (!mounted) {
              return
            }

            if (
              event === "PASSWORD_RECOVERY" ||
              newSession
            ) {
              setSessionReady(true)
              setCheckingSession(false)
            }
          }
        )

        window.setTimeout(() => {
          if (!mounted) {
            return
          }

          setCheckingSession(false)

          listener.subscription.unsubscribe()
        }, 3000)
      } catch (error: unknown) {
        if (!mounted) {
          return
        }

        setErrorMessage(
          getErrorMessage(error)
        )

        setCheckingSession(false)
      }
    }

    void initializeRecovery()

    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setErrorMessage("")

      if (password.length < 8) {
        throw new Error(
          "Le mot de passe doit contenir au moins 8 caractères."
        )
      }

      if (password !== confirmation) {
        throw new Error(
          "Les deux mots de passe ne correspondent pas."
        )
      }

      /*
       * Vérification supplémentaire :
       * une session de récupération doit
       * réellement exister.
       */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!session) {
        throw new Error(
          "Le lien de réinitialisation n’est plus valide. Demandez un nouveau lien."
        )
      }

      /*
       * Modification du mot de passe
       * du compte lié au lien reçu.
       */
      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        throw updateError
      }

      /*
       * On déconnecte la session temporaire
       * de récupération.
       */
      await supabase.auth.signOut()

      setSuccess(true)
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />

          <span className="text-sm font-semibold">
            Vérification du lien de réinitialisation…
          </span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center">

        <section className="w-full rounded-[2rem] border border-slate-800 bg-white p-7 text-slate-950 shadow-2xl sm:p-10">

          {success ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                AGENTIS · Sécurité
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Mot de passe modifié
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Votre nouveau mot de passe est
                maintenant enregistré. Vous pouvez
                vous connecter à votre espace AGENTIS.
              </p>

              <Link
                href="/login"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-amber-400"
              >
                Se connecter
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-amber-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>

              <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <KeyRound className="h-6 w-6" />
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                AGENTIS · Sécurité
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Nouveau mot de passe
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Choisissez un nouveau mot de passe
                pour votre compte AGENTIS.
              </p>

              {!sessionReady && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  Le lien de réinitialisation est
                  invalide ou a expiré. Demandez un
                  nouveau lien depuis la page de
                  connexion.
                </div>
              )}

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              {sessionReady && (
                <form
                  onSubmit={(event) =>
                    void handleSubmit(event)
                  }
                  className="mt-8 space-y-5"
                >
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Nouveau mot de passe
                    </span>

                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(event) =>
                          setPassword(
                            event.target.value
                          )
                        }
                        autoComplete="new-password"
                        minLength={8}
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-amber-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current
                          )
                        }
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-slate-700"
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Confirmer le mot de passe
                    </span>

                    <input
                      type="password"
                      value={confirmation}
                      onChange={(event) =>
                        setConfirmation(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                    />
                  </label>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />

                      <p className="text-xs leading-5 text-emerald-800">
                        Le nouveau mot de passe sera
                        appliqué uniquement au compte
                        associé au lien de
                        réinitialisation reçu par email.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {submitting
                      ? "Enregistrement…"
                      : "Enregistrer mon nouveau mot de passe"}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}