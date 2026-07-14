"use client"

import { useEffect, useState } from "react"
import { AgentService } from "@/lib/services/AgentService"

type Agent = {
  id: number | string
  nom: string
}

type DocumentFormData = {
  agent_id: string
  categorie: string
  nom: string
  date_document: string
  date_expiration: string
  commentaire: string
  fichier: File | null
}

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: DocumentFormData) => Promise<void>
}

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 outline-none transition focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"

function getInitialForm(): DocumentFormData {
  return {
    agent_id: "",
    categorie: "",
    nom: "",
    date_document: new Date().toISOString().slice(0, 10),
    date_expiration: "",
    commentaire: "",
    fichier: null,
  }
}

export default function AddDocumentDialog({
  open,
  onClose,
  onSave,
}: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [form, setForm] = useState<DocumentFormData>(getInitialForm())
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!open) return

    let active = true

    async function loadAgents() {
      try {
        setLoadingAgents(true)
        setErrorMessage("")

        const list = await AgentService.list()

        if (active) {
          setAgents(
            (list as Agent[]).filter(
              (agent) => agent.id !== undefined && Boolean(agent.nom)
            )
          )
        }
      } catch (error: unknown) {
        console.error(error)

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger la liste des agents."
          )
        }
      } finally {
        if (active) {
          setLoadingAgents(false)
        }
      }
    }

    setForm(getInitialForm())
    void loadAgents()

    return () => {
      active = false
    }
  }, [open])

  if (!open) return null

  function updateField<K extends keyof DocumentFormData>(
    field: K,
    value: DocumentFormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit() {
    if (!form.agent_id) {
      setErrorMessage("Veuillez sélectionner un agent.")
      return
    }

    if (!form.categorie) {
      setErrorMessage("Veuillez sélectionner une catégorie.")
      return
    }

    if (!form.nom.trim()) {
      setErrorMessage("Veuillez renseigner le nom du document.")
      return
    }

    if (!form.date_document) {
      setErrorMessage("Veuillez renseigner la date du document.")
      return
    }

    if (!form.fichier) {
      setErrorMessage("Veuillez sélectionner un fichier PDF.")
      return
    }

    if (form.fichier.type !== "application/pdf") {
      setErrorMessage("Seuls les fichiers PDF sont acceptés.")
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")

      await onSave({
        ...form,
        nom: form.nom.trim(),
        commentaire: form.commentaire.trim(),
      })

      setForm(getInitialForm())
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer le document."
      )
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (saving) return

    setErrorMessage("")
    setForm(getInitialForm())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-document-title"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-yellow-500/20 bg-[#0f172a] shadow-2xl">
        <div className="border-b border-slate-800 px-8 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Documents RH
          </p>

          <h2
            id="add-document-title"
            className="mt-2 text-2xl font-bold text-white"
          >
            Nouveau document
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Ajoutez un document sécurisé au dossier d’un agent.
          </p>
        </div>

        {errorMessage && (
          <div className="mx-8 mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-5 p-8 md:grid-cols-2">
          <Field label="Agent" required>
            <select
              className={inputClass}
              value={form.agent_id}
              disabled={loadingAgents || saving}
              onChange={(event) =>
                updateField("agent_id", event.target.value)
              }
            >
              <option value="">
                {loadingAgents
                  ? "Chargement des agents..."
                  : "Sélectionner un agent"}
              </option>

              {agents.map((agent) => (
                <option key={agent.id} value={String(agent.id)}>
                  {agent.nom}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Catégorie" required>
            <select
              className={inputClass}
              value={form.categorie}
              disabled={saving}
              onChange={(event) =>
                updateField("categorie", event.target.value)
              }
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="Contrat">Contrat</option>
              <option value="Pièce d’identité">Pièce d’identité</option>
              <option value="Visite médicale">Visite médicale</option>
              <option value="Habilitation">Habilitation</option>
              <option value="Formation">Formation</option>
              <option value="Diplôme">Diplôme</option>
              <option value="Permis">Permis</option>
              <option value="Attestation">Attestation</option>
              <option value="Autre">Autre</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Nom du document" required>
              <input
                type="text"
                className={inputClass}
                value={form.nom}
                disabled={saving}
                placeholder="Ex. Contrat CDI 2026"
                onChange={(event) =>
                  updateField("nom", event.target.value)
                }
              />
            </Field>
          </div>

          <Field label="Date du document" required>
            <input
              type="date"
              className={inputClass}
              value={form.date_document}
              disabled={saving}
              onChange={(event) =>
                updateField("date_document", event.target.value)
              }
            />
          </Field>

          <Field label="Date d’expiration">
            <input
              type="date"
              className={inputClass}
              value={form.date_expiration}
              disabled={saving}
              onChange={(event) =>
                updateField("date_expiration", event.target.value)
              }
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Commentaire">
              <textarea
                rows={4}
                className={inputClass}
                value={form.commentaire}
                disabled={saving}
                placeholder="Informations complémentaires..."
                onChange={(event) =>
                  updateField("commentaire", event.target.value)
                }
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Fichier PDF" required>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-[#020817]/60 px-6 py-8 text-center transition hover:border-yellow-400/50 hover:bg-yellow-400/5">
                <span className="text-sm font-medium text-slate-200">
                  {form.fichier
                    ? form.fichier.name
                    : "Choisir un fichier PDF"}
                </span>

                <span className="mt-2 text-xs text-slate-500">
                  Format accepté : PDF
                </span>

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  disabled={saving}
                  onChange={(event) =>
                    updateField(
                      "fichier",
                      event.target.files?.[0] || null
                    )
                  }
                />
              </label>
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 px-8 py-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-60"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loadingAgents}
            className="rounded-xl bg-yellow-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-400">
        {label}
        {required && (
          <span className="ml-1 text-red-400">*</span>
        )}
      </label>

      {children}
    </div>
  )
}