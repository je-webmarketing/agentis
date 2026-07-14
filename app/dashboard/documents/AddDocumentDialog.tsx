"use client"

import { useEffect, useState } from "react"
import { AgentService } from "@/lib/services/AgentService"

type Agent = {
  id: number | string
  nom: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: {
    agent_id: string
    categorie: string
    nom: string
    date_document: string
    date_expiration: string
    commentaire: string
    fichier: File | null
  }) => Promise<void>
}

const input =
  "w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 text-slate-100 focus:border-yellow-400 focus:outline-none"

export default function AddDocumentDialog({
  open,
  onClose,
  onSave,
}: Props) {
  const [agents, setAgents] = useState<Agent[]>([])

  const [form, setForm] = useState({
    agent_id: "",
    categorie: "",
    nom: "",
    date_document: "",
    date_expiration: "",
    commentaire: "",
    fichier: null as File | null,
  })

  useEffect(() => {
    if (!open) return

    AgentService.list().then((list: any) => {
      setAgents(list)
    })
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-yellow-500/20 bg-[#0f172a] shadow-2xl">

        <div className="border-b border-slate-800 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">
            Nouveau document RH
          </h2>
        </div>

        <div className="grid gap-5 p-8 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Agent
            </label>

            <select
              className={input}
              value={form.agent_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  agent_id: e.target.value,
                })
              }
            >
              <option value="">Choisir...</option>

              {agents.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Catégorie
            </label>

            <select
              className={input}
              value={form.categorie}
              onChange={(e) =>
                setForm({
                  ...form,
                  categorie: e.target.value,
                })
              }
            >
              <option value="">Choisir...</option>
              <option>Contrat</option>
              <option>Visite médicale</option>
              <option>Habilitation</option>
              <option>Formation</option>
              <option>Diplôme</option>
              <option>Permis</option>
              <option>Autre</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-400">
              Nom du document
            </label>

            <input
              className={input}
              value={form.nom}
              onChange={(e) =>
                setForm({
                  ...form,
                  nom: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Date
            </label>

            <input
              type="date"
              className={input}
              value={form.date_document}
              onChange={(e) =>
                setForm({
                  ...form,
                  date_document: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Expiration
            </label>

            <input
              type="date"
              className={input}
              value={form.date_expiration}
              onChange={(e) =>
                setForm({
                  ...form,
                  date_expiration: e.target.value,
                })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-400">
              Commentaire
            </label>

            <textarea
              rows={4}
              className={input}
              value={form.commentaire}
              onChange={(e) =>
                setForm({
                  ...form,
                  commentaire: e.target.value,
                })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-400">
              PDF
            </label>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) =>
                setForm({
                  ...form,
                  fichier: e.target.files?.[0] || null,
                })
              }
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 px-8 py-6">

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-2"
          >
            Annuler
          </button>

          <button
            onClick={() => onSave(form)}
            className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-slate-950"
          >
            Enregistrer
          </button>

        </div>

      </div>
    </div>
  )
}