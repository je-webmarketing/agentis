"use client"

import { useEffect, useState } from "react"
import AddDocumentDialog from "./AddDocumentDialog"
import { DocumentService } from "@/lib/services/DocumentService"
import { PermissionService } from "@/lib/security/PermissionService"
import { getRolePermissions } from "@/lib/security/RolePermissions"
import type { SecurityUser } from "@/lib/security/types"
import { supabase } from "@/lib/supabase"

type AgentReference = {
  id: string | number
  nom: string | null
}

type DocumentRow = {
  id: string | number
  agent_id: string | number
  categorie: string | null
  nom: string | null
  fichier_url: string | null
  date_document: string | null
  date_expiration: string | null
  commentaire: string | null
  agent?: AgentReference | null
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
  initialDocuments: DocumentRow[]
}

function formatDate(value?: string | null) {
  if (!value) return "—"

  return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR")
}

export default function DocumentsClient({
  initialDocuments,
}: Props) {
  const [documents, setDocuments] =
    useState<DocumentRow[]>(initialDocuments)

  const [openDialog, setOpenDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [securityUser, setSecurityUser] =
    useState<SecurityUser | null>(null)

  const [securityLoading, setSecurityLoading] = useState(true)

  /*
   * ============================================================
   * CHARGEMENT DES DROITS
   * ============================================================
   */

  useEffect(() => {
    let mounted = true

    async function loadSecurityUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || !mounted) {
          return
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select(`
            role,
            structure_id,
            site_id,
            service_id,
            agent_id
          `)
          .eq("id", user.id)
          .single()

        if (error) {
          console.error(
            "Erreur chargement profil sécurité :",
            error
          )
          return
        }

        if (!profile || !mounted) {
          return
        }

        const role = profile.role

        const permissions = getRolePermissions(role)

        let scope: SecurityUser["scope"]

        switch (role) {
          case "super_admin":
          case "admin_rh":
            scope = {
              type: "global",
            }
            break

          case "responsable_rh":
            scope = {
              type: "structure",
              structureIds:
                profile.structure_id !== null
                  ? [profile.structure_id]
                  : [],
            }
            break

          case "responsable_site":
            scope = {
              type: "site",
              siteIds:
                profile.site_id !== null
                  ? [profile.site_id]
                  : [],
            }
            break

          case "chef_service":
            scope = {
              type: "service",
              serviceIds:
                profile.service_id !== null
                  ? [profile.service_id]
                  : [],
            }
            break

          case "agent":
            scope = {
              type: "self",
              agentId: profile.agent_id,
            }
            break

          default:
            scope = {
              type: "self",
              agentId: profile.agent_id,
            }
        }

        const currentSecurityUser: SecurityUser = {
          id: user.id,
          role,
          active: true,
          permissions,
          scope,
        }

        setSecurityUser(currentSecurityUser)
      } catch (error) {
        console.error(
          "Erreur initialisation sécurité documents :",
          error
        )
      } finally {
        if (mounted) {
          setSecurityLoading(false)
        }
      }
    }

    loadSecurityUser()

    return () => {
      mounted = false
    }
  }, [])

  /*
   * ============================================================
   * PERMISSIONS
   * ============================================================
   */

  const canCreate =
    PermissionService.has(
      securityUser,
      "documents.create"
    )

  const canView =
    PermissionService.has(
      securityUser,
      "documents.view"
    )

  const canDelete =
    PermissionService.has(
      securityUser,
      "documents.delete"
    )

  /*
   * ============================================================
   * RECHARGEMENT
   * ============================================================
   */

  async function reloadDocuments() {
    const data = await DocumentService.list()

    setDocuments(data as DocumentRow[])
  }

  /*
   * ============================================================
   * AJOUT
   * ============================================================
   */

  async function handleSave(form: DocumentFormData) {
    if (!canCreate) {
      setErrorMessage(
        "Vous n’avez pas l’autorisation d’ajouter un document."
      )
      return
    }

    if (
      !form.agent_id ||
      !form.categorie ||
      !form.nom ||
      !form.date_document ||
      !form.fichier
    ) {
      setErrorMessage(
        "Agent, catégorie, nom, date et fichier PDF sont obligatoires."
      )
      return
    }

    try {
      setSaving(true)
      setErrorMessage("")

      const filePath = await DocumentService.upload(
        form.fichier,
        form.agent_id
      )

      await DocumentService.create({
        agent_id: form.agent_id,
        categorie: form.categorie,
        nom: form.nom,
        fichier_url: filePath,
        date_document: form.date_document,
        date_expiration:
          form.date_expiration || null,
        commentaire:
          form.commentaire || null,
      })

      await reloadDocuments()

      setOpenDialog(false)
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

  /*
   * ============================================================
   * OUVERTURE
   * ============================================================
   */

  async function handleOpen(document: DocumentRow) {
    if (!canView) {
      setErrorMessage(
        "Vous n’avez pas l’autorisation de consulter ce document."
      )
      return
    }

    if (!document.fichier_url) {
      setErrorMessage(
        "Aucun fichier n’est associé à ce document."
      )
      return
    }

    try {
      setErrorMessage("")

      const signedUrl =
        await DocumentService.createSignedUrl(
          document.fichier_url
        )

      window.open(
        signedUrl,
        "_blank",
        "noopener,noreferrer"
      )
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’ouvrir le document."
      )
    }
  }

  /*
   * ============================================================
   * SUPPRESSION
   * ============================================================
   */

  async function handleDelete(document: DocumentRow) {
    if (!canDelete) {
      setErrorMessage(
        "Vous n’avez pas l’autorisation de supprimer ce document."
      )
      return
    }

    const confirmation = window.confirm(
      `Supprimer définitivement le document « ${
        document.nom || "Sans nom"
      } » ?`
    )

    if (!confirmation) return

    try {
      setErrorMessage("")

      if (document.fichier_url) {
        await DocumentService.deleteFile(
          document.fichier_url
        )
      }

      await DocumentService.delete(document.id)

      await reloadDocuments()
    } catch (error: unknown) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le document."
      )
    }
  }

  /*
   * ============================================================
   * AFFICHAGE
   * ============================================================
   */

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
            AGENTIS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Documents RH
          </h1>

          <p className="mt-2 text-slate-400">
            Gestion documentaire sécurisée des agents.
          </p>
        </div>

        {!securityLoading && canCreate && (
          <button
            type="button"
            onClick={() => {
              setErrorMessage("")
              setOpenDialog(true)
            }}
            className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
          >
            + Nouveau document
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a]">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full">
            <thead className="bg-[#111827] text-sm text-slate-300">
              <tr>
                <th className="p-4 text-left">
                  Agent
                </th>

                <th className="p-4 text-left">
                  Catégorie
                </th>

                <th className="p-4 text-left">
                  Document
                </th>

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Expiration
                </th>

                <th className="p-4 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-slate-400"
                  >
                    Aucun document enregistré.
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr
                    key={document.id}
                    className="border-t border-slate-800 text-sm transition hover:bg-white/[0.02]"
                  >
                    <td className="p-4 font-medium text-slate-100">
                      {document.agent?.nom ||
                        "Agent non renseigné"}
                    </td>

                    <td className="p-4">
                      <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        {document.categorie ||
                          "Autre"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300">
                      {document.nom ||
                        "Sans nom"}
                    </td>

                    <td className="p-4 text-slate-400">
                      {formatDate(
                        document.date_document
                      )}
                    </td>

                    <td className="p-4 text-slate-400">
                      {formatDate(
                        document.date_expiration
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {!securityLoading &&
                          canView && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpen(document)
                              }
                              className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                            >
                              Voir
                            </button>
                          )}

                        {!securityLoading &&
                          canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(document)
                              }
                              className="rounded-lg border border-red-500/40 px-3 py-2 text-red-300 transition hover:bg-red-500/10"
                            >
                              Supprimer
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canCreate && (
        <AddDocumentDialog
          open={openDialog}
          onClose={() => {
            if (!saving) {
              setOpenDialog(false)
            }
          }}
          onSave={handleSave}
        />
      )}

      {saving && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-yellow-500/30 bg-[#111827] px-5 py-3 text-sm text-yellow-300 shadow-2xl">
          Téléversement et enregistrement…
        </div>
      )}
    </>
  )
}