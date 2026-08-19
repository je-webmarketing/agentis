"use client"

import {
  CalendarDays,
  Download,
  File,
  FileArchive,
  FileBadge,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { supabase } from "@/lib/supabase"
import { addHistory } from "@/lib/services/rh-history"

type Props = {
  agentId: string
}

type AgentDocument = {
  id: number
  agent_id: number
  categorie: string | null
  nom: string | null
  fichier_url: string | null
  date_document: string | null
  date_expiration: string | null
  commentaire: string | null
  created_at: string | null
}

type DocumentForm = {
  categorie: string
  nom: string
  dateDocument: string
  dateExpiration: string
  commentaire: string
}

const STORAGE_BUCKET = "documents-rh"

const LEGACY_STORAGE_BUCKET = "agent-documents"

const categories = [
  "Contrat",
  "Avenant",
  "Diplôme",
  "Habilitation",
  "Visite médicale",
  "Permis",
  "Arrêt de travail",
  "Formation",
  "Pièce d’identité",
  "Autre",
]

const initialForm: DocumentForm = {
  categorie: "Contrat",
  nom: "",
  dateDocument: "",
  dateExpiration: "",
  commentaire: "",
}

export default function DocumentsTab({
  agentId,
}: Props) {
  const [documents, setDocuments] =
    useState<AgentDocument[]>([])

  const [form, setForm] =
    useState<DocumentForm>(initialForm)

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [uploading, setUploading] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [openingId, setOpeningId] =
    useState<number | null>(null)

  const [showForm, setShowForm] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const loadDocuments =
    useCallback(async () => {
      setLoading(true)
      setErrorMessage("")

      const { data, error } =
        await supabase
          .from("agent_documents")
          .select(`
            id,
            agent_id,
            categorie,
            nom,
            fichier_url,
            date_document,
            date_expiration,
            commentaire,
            created_at
          `)
          .eq(
            "agent_id",
            Number(agentId)
          )
          .order("created_at", {
            ascending: false,
          })

      if (error) {
        setErrorMessage(error.message)
        setDocuments([])
        setLoading(false)
        return
      }

      setDocuments(
        (data || []) as AgentDocument[]
      )

      setLoading(false)
    }, [agentId])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const expiringDocuments =
    useMemo(
      () =>
        documents.filter(
          (document) =>
            isExpiringSoon(
              document.date_expiration
            )
        ).length,
      [documents]
    )

  function updateForm<
    K extends keyof DocumentForm
  >(
    key: K,
    value: DocumentForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null

    setSelectedFile(file)

    if (
      file &&
      !form.nom.trim()
    ) {
      updateForm(
        "nom",
        removeExtension(file.name)
      )
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (uploading) return

    if (!selectedFile) {
      setErrorMessage(
        "Sélectionnez un fichier à ajouter."
      )
      return
    }

    if (!form.nom.trim()) {
      setErrorMessage(
        "Le nom du document est obligatoire."
      )
      return
    }

    setUploading(true)
    setErrorMessage("")
    setSuccessMessage("")

    const storagePath =
      createStoragePath(
        agentId,
        selectedFile.name
      )

    const {
      error: storageError,
    } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(
          storagePath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
          }
        )

    if (storageError) {
      setErrorMessage(
        `Impossible d’envoyer le fichier : ${storageError.message}`
      )

      setUploading(false)
      return
    }

    /*
     * On stocke uniquement le chemin Storage.
     *
     * Exemple :
     * 8/1786947244107-certificat.pdf
     *
     * On ne stocke plus d'URL publique.
     */
    const filePath = storagePath

    const {
      error: insertError,
    } = await supabase
      .from("agent_documents")
      .insert({
        agent_id:
          Number(agentId),

        categorie:
          form.categorie,

        nom:
          form.nom.trim(),

        fichier_url:
          filePath,

        date_document:
          toNullable(
            form.dateDocument
          ),

        date_expiration:
          toNullable(
            form.dateExpiration
          ),

        commentaire:
          toNullable(
            form.commentaire
          ),
      })

    if (insertError) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])

      setErrorMessage(
        `Le fichier a été envoyé, mais le document n’a pas pu être enregistré : ${insertError.message}`
      )

      setUploading(false)
      return
    }

    await addHistory({
      agentId,
      type: "DOCUMENT_AJOUT",
      description:
        `Ajout du document « ${form.nom.trim()} »`,
      utilisateur:
        "Administrateur",
    })

    setForm(initialForm)
    setSelectedFile(null)
    setShowForm(false)

    setSuccessMessage(
      "Le document a été ajouté."
    )

    await loadDocuments()

    setUploading(false)
  }

  async function openDocument(
    document: AgentDocument
  ) {
    if (!document.fichier_url) {
      setErrorMessage(
        "Aucun fichier n’est associé à ce document."
      )
      return
    }

    setOpeningId(document.id)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const location =
        getStorageLocation(
          document.fichier_url,
          document.agent_id
        )

      /*
       * Ancien fichier stocké dans
       * agent-documents (bucket public).
       */
      if (
        location.bucket ===
        LEGACY_STORAGE_BUCKET
      ) {
        const { data } =
          supabase.storage
            .from(
              LEGACY_STORAGE_BUCKET
            )
            .getPublicUrl(
              location.path
            )

        if (!data.publicUrl) {
          throw new Error(
            "Impossible de générer l’URL du document."
          )
        }

        window.open(
          data.publicUrl,
          "_blank",
          "noopener,noreferrer"
        )

        return
      }

      /*
       * Nouveau système :
       * bucket privé documents-rh.
       *
       * L'URL n'est valable que 10 min.
       */
      const {
        data,
        error,
      } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(
            location.path,
            60 * 10
          )

      if (error) {
        throw error
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Impossible de générer l’accès temporaire au document."
        )
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur inconnue."

      setErrorMessage(
        `Impossible d’ouvrir le document : ${message}`
      )
    } finally {
      setOpeningId(null)
    }
  }

  async function deleteDocument(
    document: AgentDocument
  ) {
    const confirmed =
      window.confirm(
        `Supprimer le document « ${
          document.nom ||
          "Sans nom"
        } » ?`
      )

    if (!confirmed) return

    setDeletingId(document.id)
    setErrorMessage("")
    setSuccessMessage("")

    const {
      error: deleteError,
    } =
      await supabase
        .from("agent_documents")
        .delete()
        .eq(
          "id",
          document.id
        )

    if (deleteError) {
      setErrorMessage(
        deleteError.message
      )

      setDeletingId(null)
      return
    }

    await addHistory({
      agentId,
      type:
        "DOCUMENT_SUPPRESSION",
      description:
        `Suppression du document « ${
          document.nom ||
          "Sans nom"
        } »`,
      utilisateur:
        "Administrateur",
    })

    if (document.fichier_url) {
      const location =
        getStorageLocation(
          document.fichier_url,
          document.agent_id
        )

      const {
        error:
          storageDeleteError,
      } =
        await supabase.storage
          .from(
            location.bucket
          )
          .remove([
            location.path,
          ])

      if (
        storageDeleteError
      ) {
        console.error(
          "Suppression Storage impossible :",
          storageDeleteError
        )
      }
    }

    setDocuments(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            document.id
        )
    )

    setSuccessMessage(
      "Le document a été supprimé."
    )

    setDeletingId(null)
  }

  function closeForm() {
    if (uploading) return

    setForm(initialForm)
    setSelectedFile(null)
    setShowForm(false)
    setErrorMessage("")
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Documents RH
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {documents.length} document
            {documents.length > 1
              ? "s"
              : ""}{" "}
            enregistré
            {documents.length > 1
              ? "s"
              : ""}
            {expiringDocuments > 0
              ? ` · ${expiringDocuments} à renouveler bientôt`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowForm(
              (current) =>
                !current
            )
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          {showForm ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}

          {showForm
            ? "Fermer"
            : "Ajouter un document"}
        </button>
      </header>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Catégorie
              </span>

              <select
                value={
                  form.categorie
                }
                onChange={(
                  event
                ) =>
                  updateForm(
                    "categorie",
                    event.target
                      .value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                {categories.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {
                        category
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <FormField
              label="Nom du document"
              value={form.nom}
              onChange={(
                value
              ) =>
                updateForm(
                  "nom",
                  value
                )
              }
              placeholder="Ex. Contrat titulaire"
              required
            />

            <FormField
              label="Date du document"
              type="date"
              value={
                form.dateDocument
              }
              onChange={(
                value
              ) =>
                updateForm(
                  "dateDocument",
                  value
                )
              }
            />

            <FormField
              label="Date d’expiration"
              type="date"
              value={
                form.dateExpiration
              }
              onChange={(
                value
              ) =>
                updateForm(
                  "dateExpiration",
                  value
                )
              }
            />

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Commentaire
              </span>

              <textarea
                value={
                  form.commentaire
                }
                onChange={(
                  event
                ) =>
                  updateForm(
                    "commentaire",
                    event.target
                      .value
                  )
                }
                rows={3}
                placeholder="Information complémentaire…"
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Fichier
              </span>

              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={
                    handleFileChange
                  }
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />

                <p className="mt-2 text-xs text-slate-500">
                  PDF, Word ou
                  image.
                </p>

                {selectedFile && (
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    {
                      selectedFile.name
                    }
                  </p>
                )}
              </div>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={
                closeForm
              }
              disabled={
                uploading
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                uploading ||
                !selectedFile ||
                !form.nom.trim()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}

              {uploading
                ? "Envoi en cours…"
                : "Ajouter le document"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : documents.length ===
        0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <FileText className="h-10 w-10 text-slate-300" />

          <p className="mt-4 font-semibold text-slate-700">
            Aucun document
          </p>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Ajoutez le premier
            document RH de cet
            agent.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {documents.map(
            (document) => (
              <DocumentCard
                key={
                  document.id
                }
                document={
                  document
                }
                deleting={
                  deletingId ===
                  document.id
                }
                opening={
                  openingId ===
                  document.id
                }
                onOpen={() =>
                  void openDocument(
                    document
                  )
                }
                onDelete={() =>
                  void deleteDocument(
                    document
                  )
                }
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

function DocumentCard({
  document,
  deleting,
  opening,
  onOpen,
  onDelete,
}: {
  document: AgentDocument
  deleting: boolean
  opening: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const expirationState =
    getExpirationState(
      document.date_expiration
    )

  const Icon =
    getCategoryIcon(
      document.categorie
    )

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                {document.categorie ||
                  "Document"}
              </p>

              <h4 className="mt-1 font-bold text-slate-900">
                {document.nom ||
                  "Sans nom"}
              </h4>
            </div>

            {expirationState && (
              <span
                className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${expirationState.className}`}
              >
                {
                  expirationState.label
                }
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />

              Document :{" "}
              {formatDate(
                document.date_document
              )}
            </p>

            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />

              Expiration :{" "}
              {document.date_expiration
                ? formatDate(
                    document.date_expiration
                  )
                : "Sans échéance"}
            </p>
          </div>

          {document.commentaire && (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {
                document.commentaire
              }
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {document.fichier_url && (
              <button
                type="button"
                onClick={onOpen}
                disabled={opening}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-wait disabled:opacity-50"
              >
                {opening ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}

                {opening
                  ? "Ouverture…"
                  : "Ouvrir"}
              </button>
            )}

            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              Supprimer
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (
    value: string
  ) => void
  type?: "text" | "date"
  placeholder?: string
  required?: boolean
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
      />
    </label>
  )
}

function getCategoryIcon(
  category?: string | null
) {
  const normalized =
    String(category || "")
      .toLowerCase()

  if (
    normalized.includes(
      "contrat"
    ) ||
    normalized.includes(
      "avenant"
    )
  ) {
    return FileBadge
  }

  if (
    normalized.includes(
      "diplôme"
    ) ||
    normalized.includes(
      "formation"
    ) ||
    normalized.includes(
      "habilitation"
    )
  ) {
    return FileCheck2
  }

  if (
    normalized.includes(
      "arrêt"
    ) ||
    normalized.includes(
      "médicale"
    )
  ) {
    return FileArchive
  }

  return File
}

function getExpirationState(
  value?: string | null
) {
  if (!value) return null

  const expiration =
    new Date(
      `${value}T12:00:00`
    )

  if (
    Number.isNaN(
      expiration.getTime()
    )
  ) {
    return null
  }

  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0
  )

  const daysRemaining =
    Math.ceil(
      (
        expiration.getTime() -
        today.getTime()
      ) /
        86_400_000
    )

  if (
    daysRemaining < 0
  ) {
    return {
      label: "Expiré",
      className:
        "border-red-200 bg-red-50 text-red-700",
    }
  }

  if (
    daysRemaining <= 30
  ) {
    return {
      label:
        `${daysRemaining} j restant${
          daysRemaining > 1
            ? "s"
            : ""
        }`,
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    label: "Valide",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}

function isExpiringSoon(
  value?: string | null
) {
  if (!value) {
    return false
  }

  const expiration =
    new Date(
      `${value}T12:00:00`
    )

  if (
    Number.isNaN(
      expiration.getTime()
    )
  ) {
    return false
  }

  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0
  )

  const daysRemaining =
    Math.ceil(
      (
        expiration.getTime() -
        today.getTime()
      ) /
        86_400_000
    )

  return (
    daysRemaining >= 0 &&
    daysRemaining <= 30
  )
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Non renseignée"
  }

  const date =
    new Date(
      `${value}T12:00:00`
    )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    "fr-FR"
  ).format(date)
}

function createStoragePath(
  agentId: string,
  originalName: string
) {
  const safeName =
    originalName
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      )
      .toLowerCase()

  return `${agentId}/${Date.now()}-${safeName}`
}

/*
 * Compatibilité ancien / nouveau système.
 *
 * Nouveau :
 *   8/xxx.pdf
 *
 * Ancien :
 *   xxx.pdf
 *
 * Ancienne URL publique :
 *   https://.../storage/v1/object/public/agent-documents/8/xxx.pdf
 */
function getStorageLocation(
  fileValue: string,
  agentId: number
): {
  bucket: string
  path: string
} {
  const value =
    fileValue.trim()

  /*
   * Ancienne URL publique
   * agent-documents.
   */
  const legacyMarker =
    `/storage/v1/object/public/${LEGACY_STORAGE_BUCKET}/`

  const legacyIndex =
    value.indexOf(
      legacyMarker
    )

  if (
    legacyIndex !== -1
  ) {
    return {
      bucket:
        LEGACY_STORAGE_BUCKET,

      path:
        decodeURIComponent(
          value.slice(
            legacyIndex +
              legacyMarker.length
          )
        ),
    }
  }

  /*
   * Ancienne URL publique
   * documents-rh éventuelle.
   */
  const currentPublicMarker =
    `/storage/v1/object/public/${STORAGE_BUCKET}/`

  const currentPublicIndex =
    value.indexOf(
      currentPublicMarker
    )

  if (
    currentPublicIndex !==
    -1
  ) {
    return {
      bucket:
        STORAGE_BUCKET,

      path:
        decodeURIComponent(
          value.slice(
            currentPublicIndex +
              currentPublicMarker.length
          )
        ),
    }
  }

  /*
   * Valeur déjà enregistrée
   * comme chemin :
   *
   * 8/xxx.pdf
   */
  if (
    value.includes("/")
  ) {
    return {
      bucket:
        STORAGE_BUCKET,

      path:
        value.replace(
          /^\/+/,
          ""
        ),
    }
  }

  /*
   * Anciennes données où seul
   * le nom du fichier était
   * enregistré.
   *
   * On reconstruit :
   * 8/xxx.pdf
   */
  return {
    bucket:
      STORAGE_BUCKET,

    path:
      `${agentId}/${value}`,
  }
}

function removeExtension(
  filename: string
) {
  return filename.replace(
    /\.[^/.]+$/,
    ""
  )
}

function toNullable(
  value: string
) {
  const trimmedValue =
    value.trim()

  return (
    trimmedValue ||
    null
  )
}