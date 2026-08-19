"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"

type Agent = {
  id: string | number
  nom: string | null
}

export default function NewFormationPage() {
  const router = useRouter()

  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [form, setForm] = useState({
    agent_id: "",
    formation: "",
    organisme: "",
    date_formation: "",
    date_expiration: "",
    commentaire: "",
  })

  useEffect(() => {
    let isMounted = true

    async function loadAgents() {
      setLoadingAgents(true)

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

    if (!form.formation.trim()) {
      setErrorMessage(
        "Le nom de la formation est obligatoire."
      )
      return
    }

    if (!form.date_formation) {
      setErrorMessage(
        "La date de formation est obligatoire."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")

    const { error } = await supabase
      .from("agent_formations")
      .insert({
        agent_id: form.agent_id,
        formation: form.formation.trim(),
        organisme:
          form.organisme.trim() || null,
        date_formation:
          form.date_formation,
        date_expiration:
          form.date_expiration || null,
        commentaire:
          form.commentaire.trim() || null,
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Ressources humaines
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              🎓 Nouvelle formation
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enregistrez une formation et sa date d’expiration éventuelle.
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
                Formation
                <input
                  type="text"
                  value={form.formation}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      formation:
                        event.target.value,
                    })
                  }
                  placeholder="Ex. SST"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Organisme
                <input
                  type="text"
                  value={form.organisme}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      organisme:
                        event.target.value,
                    })
                  }
                  placeholder="Nom de l’organisme"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Date de formation
                <input
                  type="date"
                  value={form.date_formation}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date_formation:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Date d’expiration
                <input
                  type="date"
                  value={form.date_expiration}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date_expiration:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Commentaire
              <textarea
                value={form.commentaire}
                onChange={(event) =>
                  setForm({
                    ...form,
                    commentaire:
                      event.target.value,
                  })
                }
                rows={4}
                placeholder="Informations complémentaires..."
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

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
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer la formation"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}