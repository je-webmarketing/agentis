"use client"

import {
  useEffect,
  useState,
} from "react"

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
  onSave: (
    data: DocumentFormData
  ) => Promise<void>
}

const input =
  "w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 focus:border-yellow-400 focus:outline-none"

const initialForm: DocumentFormData = {
  agent_id: "",
  categorie: "",
  nom: "",
  date_document: "",
  date_expiration: "",
  commentaire: "",
  fichier: null,
}

export default function AddDocumentDialog({
  open,
  onClose,
  onSave,
}: Props) {
  const [
    agents,
    setAgents,
  ] = useState<Agent[]>([])

  const [
    form,
    setForm,
  ] = useState<DocumentFormData>(
    initialForm
  )

  const [
    loadingAgents,
    setLoadingAgents,
  ] = useState(false)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  /*
   * =======================================================
   * CHARGEMENT DES AGENTS
   *
   * Important :
   * AgentService.list() passe par Supabase.
   *
   * Les RLS de public.agents filtrent déjà :
   *
   * super_admin       -> tous
   * admin_rh          -> tous
   * responsable_rh    -> structure
   * responsable_site  -> site
   * chef_service      -> service
   * agent             -> lui-même
   *
   * L'agent n'ouvrira de toute façon pas cette fenêtre,
   * car documents.create lui est interdit.
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return
    }

    let mounted = true

    async function loadAgents() {
      try {
        setLoadingAgents(true)
        setErrorMessage("")

        const list =
          await AgentService.list()

        if (!mounted) {
          return
        }

        const scopedAgents =
          (list || [])
            .filter(
              (agent) =>
                Boolean(agent.nom)
            )
            .map(
              (agent) => ({
                id: agent.id,
                nom:
                  agent.nom ||
                  "Agent sans nom",
              })
            )

        setAgents(scopedAgents)
      } catch (error: unknown) {
        console.error(
          "Impossible de charger les agents :",
          error
        )

        if (!mounted) {
          return
        }

        setAgents([])

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les agents autorisés."
        )
      } finally {
        if (mounted) {
          setLoadingAgents(false)
        }
      }
    }

    void loadAgents()

    return () => {
      mounted = false
    }
  }, [open])

  /*
   * =======================================================
   * OUVERTURE / FERMETURE
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setErrorMessage("")
      setAgents([])
      setSaving(false)
    }
  }, [open])

  function handleClose() {
    if (saving) {
      return
    }

    setForm(initialForm)
    setErrorMessage("")
    onClose()
  }

  /*
   * =======================================================
   * ENREGISTREMENT
   * =======================================================
   */

  async function handleSubmit() {
    if (saving) {
      return
    }

    if (!form.agent_id) {
      setErrorMessage(
        "Sélectionnez un agent."
      )
      return
    }

    if (!form.categorie) {
      setErrorMessage(
        "Sélectionnez une catégorie."
      )
      return
    }

    if (!form.nom.trim()) {
      setErrorMessage(
        "Le nom du document est obligatoire."
      )
      return
    }

    if (!form.date_document) {
      setErrorMessage(
        "La date du document est obligatoire."
      )
      return
    }

    if (!form.fichier) {
      setErrorMessage(
        "Sélectionnez un fichier PDF."
      )
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")

      await onSave({
        ...form,
        nom: form.nom.trim(),
        commentaire:
          form.commentaire.trim(),
      })

      setForm(initialForm)
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

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-yellow-500/20 bg-[#0f172a] shadow-2xl">
        {/* HEADER */}

        <div className="border-b border-slate-800 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">
            Nouveau document RH
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Seuls les agents de votre
            périmètre sont proposés.
          </p>
        </div>

        {/* ERREUR */}

        {errorMessage && (
          <div className="mx-8 mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {/* FORMULAIRE */}

        <div className="grid gap-5 p-8 md:grid-cols-2">
          {/* AGENT */}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Agent
            </label>

            <select
              className={input}
              value={form.agent_id}
              disabled={
                loadingAgents ||
                saving
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    agent_id:
                      event.target.value,
                  })
                )
              }
            >
              <option value="">
                {loadingAgents
                  ? "Chargement..."
                  : "Choisir..."}
              </option>

              {agents.map(
                (agent) => (
                  <option
                    key={agent.id}
                    value={String(
                      agent.id
                    )}
                  >
                    {agent.nom}
                  </option>
                )
              )}
            </select>

            {!loadingAgents &&
              agents.length === 0 && (
                <p className="mt-2 text-xs text-amber-300">
                  Aucun agent disponible
                  dans votre périmètre.
                </p>
              )}
          </div>

          {/* CATÉGORIE */}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Catégorie
            </label>

            <select
              className={input}
              value={
                form.categorie
              }
              disabled={saving}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    categorie:
                      event.target
                        .value,
                  })
                )
              }
            >
              <option value="">
                Choisir...
              </option>

              <option value="Contrat">
                Contrat
              </option>

              <option value="Visite médicale">
                Visite médicale
              </option>

              <option value="Habilitation">
                Habilitation
              </option>

              <option value="Formation">
                Formation
              </option>

              <option value="Diplôme">
                Diplôme
              </option>

              <option value="Permis">
                Permis
              </option>

              <option value="Autre">
                Autre
              </option>
            </select>
          </div>

          {/* NOM */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-400">
              Nom du document
            </label>

            <input
              className={input}
              value={form.nom}
              disabled={saving}
              placeholder="Ex. Contrat titulaire"
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    nom:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>

          {/* DATE */}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Date
            </label>

            <input
              type="date"
              className={input}
              value={
                form.date_document
              }
              disabled={saving}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    date_document:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>

          {/* EXPIRATION */}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Expiration
            </label>

            <input
              type="date"
              className={input}
              value={
                form.date_expiration
              }
              disabled={saving}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    date_expiration:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>

          {/* COMMENTAIRE */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-400">
              Commentaire
            </label>

            <textarea
              rows={4}
              className={input}
              value={
                form.commentaire
              }
              disabled={saving}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    commentaire:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>

          {/* FICHIER */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-400">
              PDF
            </label>

            <div className="rounded-xl border border-dashed border-slate-700 bg-[#020817] p-4">
              <input
                type="file"
                accept=".pdf,application/pdf"
                disabled={saving}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      fichier:
                        event.target
                          .files?.[0] ||
                        null,
                    })
                  )
                }
                className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-yellow-500 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-yellow-400"
              />

              {form.fichier && (
                <p className="mt-3 text-sm text-slate-400">
                  Fichier :{" "}
                  <span className="font-medium text-slate-200">
                    {
                      form.fichier
                        .name
                    }
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex justify-end gap-3 border-t border-slate-800 px-8 py-6">
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={saving}
            className="rounded-xl border border-slate-700 px-5 py-2 text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() =>
              void handleSubmit()
            }
            disabled={
              saving ||
              loadingAgents ||
              agents.length === 0
            }
            className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  )
}