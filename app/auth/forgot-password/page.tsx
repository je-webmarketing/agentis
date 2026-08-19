"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Mail,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setErrorMessage("")
      setSuccessMessage("")

      const normalizedEmail =
        email.trim().toLowerCase()

      if (!normalizedEmail) {
        throw new Error(
          "L’adresse email est obligatoire."
        )
      }

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo:
              `${window.location.origin}/auth/reset-password`,
          }
        )

      if (error) {
        throw error
      }

      setSuccessMessage(
        "Si ce compte existe, un email de réinitialisation vient d’être envoyé."
      )
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer l’email."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <section className="w-full max-w-lg rounded-[2rem] bg-white p-8 text-slate-950 shadow-2xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>

        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <Mail className="h-5 w-5" />
          </div>

          <h1 className="mt-5 text-3xl font-extrabold">
            Mot de passe oublié
          </h1>

         <Link
  href="/auth/forgot-password"
  className="block text-right text-sm font-semibold text-amber-600 hover:text-amber-700"
>
  Mot de passe oublié ?
</Link> 

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Indiquez votre adresse email AGENTIS.
            Vous recevrez un lien permettant de
            choisir un nouveau mot de passe.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <form
          onSubmit={(event) =>
            void handleSubmit(event)
          }
          className="mt-8 space-y-5"
        >
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="vous@exemple.fr"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-400"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-extrabold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Envoyer le lien
          </button>
        </form>
      </section>
    </main>
  )
}