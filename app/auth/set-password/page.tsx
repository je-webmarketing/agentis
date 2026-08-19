"use client"

import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

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

export default function SetPasswordPage() {
  const [password, setPassword] =
    useState("")

  const [confirmation, setConfirmation] =
    useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const [loadingSession, setLoadingSession] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [sessionReady, setSessionReady] =
    useState(false)

  /*
   * Vérifie que le lien d'invitation
   * a bien ouvert une session Supabase.
   */
 useEffect(() => {
  let mounted = true

  async function initializeInvitationSession() {
    try {
      setLoadingSession(true)
      setSessionReady(false)
      setErrorMessage("")

      /*
       * Le lien d'invitation Supabase arrive
       * généralement sous cette forme :
       *
       * /auth/set-password
       * #access_token=...
       * &refresh_token=...
       * &type=invite
       */

      const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      )

      const accessToken =
        hash.get("access_token")

      const refreshToken =
        hash.get("refresh_token")

      const type =
        hash.get("type")

      if (
        !accessToken ||
        !refreshToken
      ) {
        throw new Error(
          "Le lien d’invitation ne contient pas de session valide."
        )
      }

      if (
        type &&
        type !== "invite"
      ) {
        throw new Error(
          "Ce lien n’est pas une invitation valide."
        )
      }

      /*
       * IMPORTANT :
       * on remplace explicitement toute session
       * déjà présente dans le navigateur par
       * celle contenue dans l'invitation.
       */

      await supabase.auth.signOut()

      const {
        data,
        error,
      } =
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

      if (error) {
        throw error
      }

      if (!mounted) {
        return
      }

      if (!data.session?.user) {
        throw new Error(
          "Impossible d’ouvrir la session de l’utilisateur invité."
        )
      }

      /*
       * On peut retirer les tokens visibles
       * de l'URL après avoir établi la session.
       */

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      )

      setSessionReady(true)
    } catch (error: unknown) {
      if (!mounted) {
        return
      }

      setSessionReady(false)
      setErrorMessage(
        getErrorMessage(error)
      )
    } finally {
      if (mounted) {
        setLoadingSession(false)
      }
    }
  }

  void initializeInvitationSession()

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

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!session) {
        throw new Error(
          "La session d’invitation n’est plus disponible. Demandez une nouvelle invitation."
        )
      }

      const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser()

if (userError) {
  throw userError
}

if (!user?.email) {
  throw new Error(
    "Impossible d’identifier l’utilisateur invité."
  )
}

console.log(
  "Compte dont le mot de passe va être modifié :",
  user.email
)

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password,
        })

      if (updateError) {
        throw updateError
      }

      /*
       * On termine la session d'invitation.
       * L'utilisateur se reconnectera ensuite
       * normalement avec son nouveau mot de passe.
       */
      await supabase.auth.signOut()

      window.location.replace(
        "/login?password-created=1"
      )
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )

      setSubmitting(false)
    }
  }

  if (loadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          Vérification de l’invitation…
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center">

        <section className="w-full rounded-[2rem] border border-slate-800 bg-white p-7 text-slate-950 shadow-2xl sm:p-10">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <KeyRound className="h-6 w-6" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            AGENTIS · Première connexion
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            Créez votre mot de passe
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Définissez le mot de passe qui vous
            permettra ensuite de vous connecter
            à votre espace AGENTIS.
          </p>

          {!sessionReady && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              Le lien d’invitation n’a pas ouvert
              de session valide. Le lien peut être
              expiré ou avoir déjà été utilisé.
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-amber-400"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                  required
                />
              </label>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />

                  <p className="text-xs leading-5 text-emerald-800">
                    Votre compte est déjà validé.
                    Cette étape définit uniquement
                    votre mot de passe personnel.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {submitting
                  ? "Enregistrement…"
                  : "Créer mon mot de passe"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}