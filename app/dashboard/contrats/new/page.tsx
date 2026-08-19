"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"

type Agent = {
  id: string | number
  nom: string | null
}

export default function NewContractPage() {
  const router = useRouter()

  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [form, setForm] = useState({
    agent_id: "",
    type_contrat: "CDD",
    statut: "Actif",
    grade: "",
    cadre_emploi: "",
    date_debut: "",
    date_fin: "",
    temps_travail: "35h",
    indice: "",
    echelon: "",
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

    if (!form.type_contrat.trim()) {
      setErrorMessage(
        "Le type de contrat est obligatoire."
      )
      return
    }

    if (!form.date_debut) {
      setErrorMessage(
        "La date de début est obligatoire."
      )
      return
    }

    setSaving(true)
    setErrorMessage("")

    const { error } = await supabase
      .from("agent_contrats")
      .insert({
        agent_id: form.agent_id,
        type_contrat:
          form.type_contrat.trim(),
        statut:
          form.statut.trim() || null,
        grade:
          form.grade.trim() || null,
        cadre_emploi:
          form.cadre_emploi.trim() || null,
        date_debut:
          form.date_debut,
        date_fin:
          form.date_fin || null,
        temps_travail:
          form.temps_travail.trim() || null,
        indice:
          form.indice.trim() || null,
        echelon:
          form.echelon.trim() || null,
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              Ressources humaines
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              📄 Nouveau contrat
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enregistrez un nouveau contrat pour un agent.
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
                Type de contrat
                <select
                  value={form.type_contrat}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type_contrat:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <option value="CDD">CDD</option>
                  <option value="CDI">CDI</option>
                  <option value="Vacataire">
                    Vacataire
                  </option>
                  <option value="Titulaire">
                    Titulaire
                  </option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Statut
                <select
                  value={form.statut}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      statut:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <option value="Actif">Actif</option>
                  <option value="En cours">
                    En cours
                  </option>
                  <option value="Terminé">
                    Terminé
                  </option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Temps de travail
                <input
                  type="text"
                  value={form.temps_travail}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      temps_travail:
                        event.target.value,
                    })
                  }
                  placeholder="35h"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
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
                Grade
                <input
                  type="text"
                  value={form.grade}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      grade:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Cadre d’emploi
                <input
                  type="text"
                  value={form.cadre_emploi}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      cadre_emploi:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Indice
                <input
                  type="text"
                  value={form.indice}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      indice:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Échelon
                <input
                  type="text"
                  value={form.echelon}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      echelon:
                        event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>
            </div>

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
                className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer le contrat"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}