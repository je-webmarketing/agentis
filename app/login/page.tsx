"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  Network,
  ShieldCheck,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const supabase = createClient()

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Impossible de vous connecter."
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setErrorMessage("")

      const normalizedEmail = email
        .trim()
        .toLowerCase()

      if (!normalizedEmail) {
        throw new Error(
          "L’adresse email est obligatoire."
        )
      }

      if (!password) {
        throw new Error(
          "Le mot de passe est obligatoire."
        )
      }

      /*
       * IMPORTANT
       * On détruit d'abord une éventuelle ancienne
       * session afin d'éviter de conserver le compte
       * précédemment connecté.
       */
      await supabase.auth.signOut()

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error(
          "Aucun utilisateur n’a été retourné après la connexion."
        )
      }

      /*
       * Sécurité supplémentaire :
       * l'utilisateur Supabase retourné doit bien
       * correspondre à l'adresse saisie.
       */
      const authenticatedEmail =
        authData.user.email
          ?.trim()
          .toLowerCase() ?? ""

      if (
        authenticatedEmail !== normalizedEmail
      ) {
        await supabase.auth.signOut()

        throw new Error(
          "La session ouverte ne correspond pas au compte demandé."
        )
      }

      /*
       * On récupère le profil correspondant
       * STRICTEMENT à l'UID authentifié.
       */
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, email, role, actif, agent_id"
        )
        .eq("id", authData.user.id)
        .maybeSingle()

      if (profileError) {
        await supabase.auth.signOut()
        throw profileError
      }

      if (!profile) {
        await supabase.auth.signOut()

        throw new Error(
          "Aucun profil AGENTIS n’est associé à ce compte."
        )
      }

      if (profile.actif !== true) {
        await supabase.auth.signOut()

        throw new Error(
          "Ce compte est désactivé."
        )
      }

      /*
       * Vérification supplémentaire entre
       * l'adresse Auth et l'adresse du profil.
       */
      const profileEmail =
        profile.email
          ?.trim()
          .toLowerCase() ?? ""

      if (
        profileEmail &&
        profileEmail !== normalizedEmail
      ) {
        await supabase.auth.signOut()

        throw new Error(
          "Le profil AGENTIS ne correspond pas à l’adresse email connectée."
        )
      }

      /*
       * Mise à jour de la dernière connexion.
       * Une erreur ici ne doit pas empêcher
       * l'utilisateur d'accéder à AGENTIS.
       */
      const now = new Date().toISOString()

      const { error: updateError } =
        await supabase
          .from("profiles")
          .update({
            derniere_connexion: now,
            updated_at: now,
          })
          .eq("id", authData.user.id)

      if (updateError) {
        console.warn(
          "Impossible de mettre à jour la dernière connexion :",
          updateError.message
        )
      }

      /*
       * REDIRECTION SELON LE RÔLE
       */
      let destination = "/dashboard"

      if (profile.role === "agent") {
        destination =
          "/dashboard/mon-espace"
      }

      if (profile.role === "super_admin") {
        destination = "/dashboard"
      }

      /*
       * Navigation complète :
       * permet au serveur Next.js de repartir
       * avec la nouvelle session Supabase.
       */
      window.location.replace(destination)
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error)
      )

      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          {/* PARTIE GAUCHE */}
          <section className="hidden min-h-[680px] flex-col justify-between border-r border-slate-800 bg-slate-900/80 p-10 lg:flex">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <Network className="h-6 w-6" />
                </span>

                <div>
                  <p className="text-xl font-extrabold tracking-[0.18em] text-amber-300">
                    AGENTIS
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    RH Intelligence
                  </p>
                </div>
              </div>

              <div className="mt-20 max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
                  Espace sécurisé
                </p>

                <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white">
                  Pilotez vos équipes avec une
                  vision claire et sécurisée.
                </h1>

                <p className="mt-5 text-base leading-7 text-slate-400">
                  Accédez au planning, à la
                  supervision, aux dossiers RH et
                  au centre d’administration
                  depuis un espace unique.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                <div>
                  <p className="text-sm font-bold text-emerald-200">
                    Connexion protégée
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-100/70">
                    Votre rôle et votre profil
                    déterminent automatiquement
                    les modules accessibles.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PARTIE DROITE */}
          <section className="flex min-h-[680px] items-center bg-white p-6 text-slate-950 sm:p-10">
            <div className="mx-auto w-full max-w-md">
              {/* LOGO MOBILE */}
              <div className="lg:hidden">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                    <Network className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-lg font-extrabold tracking-[0.16em] text-amber-600">
                      AGENTIS
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      RH Intelligence
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 lg:mt-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                  Connexion
                </p>

                <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
                  Bienvenue
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Utilisez votre compte AGENTIS
                  pour accéder à votre espace.
                </p>
              </div>

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              <form
                onSubmit={(event) =>
                  void handleSubmit(event)
                }
                className="mt-8 space-y-5"
              >
                {/* EMAIL */}
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Mail className="h-4 w-4 text-amber-600" />
                    Adresse email
                  </span>

                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    disabled={submitting}
                    placeholder="vous@exemple.fr"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 disabled:cursor-wait disabled:bg-slate-100"
                  />
                </label>

                {/* MOT DE PASSE */}
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <LockKeyhole className="h-4 w-4 text-amber-600" />
                    Mot de passe
                  </span>

                 <div className="flex justify-end">
  <Link
    href="/auth/forgot-password"
    className="text-sm font-semibold text-amber-600 transition hover:text-amber-700"
  >
    Mot de passe oublié ?
  </Link>
</div> 

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      disabled={submitting}
                      placeholder="Votre mot de passe"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 disabled:cursor-wait disabled:bg-slate-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      disabled={submitting}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-amber-700 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                {/* CONNEXION */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}

                  {submitting
                    ? "Connexion…"
                    : "Se connecter"}
                </button>
              </form>

              <p className="mt-8 text-center text-xs leading-5 text-slate-500">
                Développé par{" "}
                <span className="font-bold text-amber-600">
                  JE-Webmarketing
                </span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}