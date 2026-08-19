"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeft,
  MailPlus,
  ShieldCheck,
} from "lucide-react"

import UserForm, {
  type UserFormValues,
} from "@/components/administration/users/UserForm"
import AdminUsersApi from "@/lib/services/AdminUsersApi"

export default function NewUserPage() {
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(
    values: UserFormValues
  ) {
    try {
      setSubmitting(true)
      setErrorMessage("")

      await AdminUsersApi.create({
        ...values,
        redirectTo:
  typeof window !== "undefined"
    ? `${window.location.origin}/auth/set-password`
    : undefined,
      })

      router.push(
        "/dashboard/administration/utilisateurs"
      )
      router.refresh()
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer cet utilisateur."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/administration/utilisateurs"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux utilisateurs
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Invitation sécurisée
          </span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-t-4 border-amber-500 px-6 py-7 sm:px-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <MailPlus className="h-6 w-6" />
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                  AGENTIS · Administration
                </p>

                <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
                  Nouvel utilisateur
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Créez le compte, attribuez son rôle puis envoyez automatiquement
                  l’invitation de connexion par email.
                </p>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </section>
        )}

        <UserForm
          submitting={submitting}
          submitLabel="Envoyer l’invitation"
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  )
}