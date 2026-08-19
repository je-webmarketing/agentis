"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"

type Agent = {
  id: string | number
  nom: string | null
}

export default function NewAbsencePage() {
  const router = useRouter()

  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [form, setForm] = useState({
    agent_id: "",
    type: "Congé",
    date_debut: "",
    date_fin: "",
    statut_validation: "En attente",
  })

  useEffect(() => {
    let isMounted = true

    async function loadAgents() {
      const { data, error } = await supabase
        .from("agents")
        .select("id, nom")
        .order("nom")

      if (!isMounted) return

      if (error) {
        setErrorMessage(error.message)
        setLoadingAgents(false)
        return
      }

      setAgents(data ?? [])
      setLoadingAgents(false)
    }

    loadAgents()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!form.agent_id) {
      setErrorMessage(
        "Veuillez sélectionner un agent."
      )
      return
    }

    if (!form.type.trim()) {
      setErrorMessage(
        "Le type d’absence est obligatoire."
      )
      return
    }

    if (!form.date_debut) {
      setErrorMessage(
        "La date de début est obligatoire."
      )
      return
    }

    if (!form.date_fin) {
      setErrorMessage(
        "La date de fin est obligatoire."
      )
      return
    }

    if (form.date_fin < form.date_debut) {
      setErrorMessage(
        "La date de fin ne peut pas être antérieure à la date de début."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")

    const { error } = await supabase
      .from("absences")
      .insert({
        agent_id: form.agent_id,
        type: form.type.trim(),
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        statut_validation:
          form.statut_validation,
      })

    setSaving(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.push("/dashboard/cockpit")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard/cockpit"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            ← Retour au Cockpit
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="border-b border-slate-200 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Ressources humaines
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              🏖️ Nouvelle absence
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enregistrez une absence pour un agent.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Agent
                <select
                  value={form.agent_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      agent_id:
                        event.target.value,
                    })
                  }
                  disabled={loadingAgents}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <option value="">
                    {loadingAgents
                      ? "Chargement..."
                      : "Sélectionner un agent"}
                  </option>

                  {agents.map((agent) => (
                    <option
                      key={agent.id}
                      value={agent.id}
                    >
                      {agent.nom ||
                        `Agent ${agent.id}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Type d’absence
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <option value="Congé">
                    Congé
                  </option>

                  <option value="Maladie">
                    Maladie
                  </option>

                  <option value="Formation">
                    Formation
                  </option>

                  <option value="Accident de travail">
                    Accident de travail
                  </option>

                  <option value="Autorisation d'absence">
                    Autorisation d&apos;absence
                  </option>

                  <option value="Autre">
                    Autre
                  </option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Date de début
                <input
                  type="date"
                  value={form.date_debut}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date_debut:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Date de fin
                <input
                  type="date"
                  value={form.date_fin}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date_fin:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Statut de validation
                <select
                  value={form.statut_validation}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      statut_validation:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <option value="En attente">
                    En attente
                  </option>

                  <option value="Validée">
                    Validée
                  </option>

                  <option value="Refusée">
                    Refusée
                  </option>
                </select>
              </label>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Une absence validée pourra ensuite être prise en compte par AGENTIS pour la disponibilité de l’agent et la synchronisation du planning.
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href="/dashboard/cockpit"
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Annuler
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer l’absence"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}