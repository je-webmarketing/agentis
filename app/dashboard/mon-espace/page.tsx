import { redirect } from "next/navigation"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

type AgentDocument = {
  id: number
  agent_id: number | null
  categorie: string | null
  nom: string | null
  fichier_url: string | null
  date_document: string | null
  date_expiration: string | null
  commentaire: string | null
  created_at: string | null
}

type AgentDocumentWithUrl =
  AgentDocument & {
    signedUrl: string | null
  }

export default async function MonEspacePage() {
  const supabase =
    await createServerSupabaseClient()

  /*
   * =========================================================
   * AUTHENTIFICATION
   * =========================================================
   */

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role, agent_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    redirect("/login")
  }

  if (profile.role !== "agent") {
    redirect("/dashboard")
  }

  if (!profile.agent_id) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-slate-950">
          Mon espace
        </h1>

        <p className="mt-4 text-slate-600">
          Aucun dossier agent n&apos;est rattaché
          à votre compte.
        </p>
      </main>
    )
  }

  /*
   * =========================================================
   * PROFIL AGENT
   * =========================================================
   */

  const { data: agent } =
    await supabase
      .from("agents")
      .select(
        "id, nom, service, statut, temps"
      )
      .eq(
        "id",
        profile.agent_id
      )
      .single()

  /*
   * =========================================================
   * FORMATIONS
   * =========================================================
   */

  const {
    data: formations,
    error: formationsError,
  } = await supabase
    .from("agent_formations")
    .select(`
      id,
      agent_id,
      formation,
      organisme,
      date_formation,
      date_expiration
    `)
    .eq(
      "agent_id",
      profile.agent_id
    )
    .order(
      "date_formation",
      {
        ascending: false,
      }
    )

  /*
   * =========================================================
   * PLANNING
   * =========================================================
   */

  const {
    data: planning,
    error: planningError,
  } = await supabase
    .from("planning_journalier")
    .select(`
      id,
      date,
      agent_id,
      heure_debut,
      heure_fin,
      statut,
      service,
      commentaire,
      site_id,
      sites:site_id (
        nom
      )
    `)
    .eq(
      "agent_id",
      profile.agent_id
    )
    .order(
      "date",
      {
        ascending: false,
      }
    )
    .order(
      "heure_debut",
      {
        ascending: true,
      }
    )
    .limit(10)

     const {
    data: absences,
    error: absencesError,
  } = await supabase
    .from("absences")
    .select(`
      id,
      agent_id,
      type,
      date_debut,
      date_fin,
      statut_validation,
      commentaire
    `)
    .eq("agent_id", profile.agent_id)
    .order("date_debut", {
      ascending: false,
    }) 

  /*
   * =========================================================
   * DOCUMENTS RH
   * =========================================================
   */

  const {
    data: documentsData,
    error: documentsError,
  } = await supabase
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
      profile.agent_id
    )
    .order(
      "date_document",
      {
        ascending: false,
      }
    )

  const documents: AgentDocumentWithUrl[] =
    await Promise.all(
      (
        (documentsData || []) as AgentDocument[]
      ).map(
        async (
          document
        ): Promise<AgentDocumentWithUrl> => {
          if (
            !document.fichier_url
          ) {
            return {
              ...document,
              signedUrl: null,
            }
          }

          const filePath =
            resolveDocumentPath(
              document.fichier_url,
              profile.agent_id
            )

          const {
            data,
            error,
          } =
            await supabase.storage
              .from(
                "documents-rh"
              )
              .createSignedUrl(
                filePath,
                60 * 10
              )

          if (
            error ||
            !data?.signedUrl
          ) {
            console.error(
              "[MON ESPACE] URL document impossible",
              {
                documentId:
                  document.id,
                filePath,
                error:
                  error?.message,
              }
            )

            return {
              ...document,
              signedUrl: null,
            }
          }

          return {
            ...document,
            signedUrl:
              data.signedUrl,
          }
        }
      )
    )

  /*
   * =========================================================
   * AFFICHAGE
   * =========================================================
   */

  return (
    <main className="p-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
        Espace personnel
      </p>

      <h1 className="mt-2 text-3xl font-bold text-slate-950">
        {agent?.nom ?? "Agent"}
      </h1>

      {/* PROFIL */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <p>
          <strong>
            Agent ID :
          </strong>{" "}
          {profile.agent_id}
        </p>

        <p className="mt-2">
          <strong>
            Service :
          </strong>{" "}
          {agent?.service ??
            "Non renseigné"}
        </p>

        <p className="mt-2">
          <strong>
            Statut :
          </strong>{" "}
          {agent?.statut ??
            "Non renseigné"}
        </p>

        <p className="mt-2">
          <strong>
            Temps :
          </strong>{" "}
          {agent?.temps ??
            "Non renseigné"}
        </p>
      </div>

      {/* =====================================================
          MON PLANNING
          ===================================================== */}

      <section
        id="planning"
        className="mt-8 scroll-mt-6"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
          Mon activité
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Mon planning
        </h2>

        {planningError ? (
          <p className="mt-4 text-red-600">
            Impossible de charger
            votre planning.
          </p>
        ) : planning &&
          planning.length > 0 ? (
          <div className="mt-4 space-y-3">
            {planning.map(
              (item) => {
                const site =
                  Array.isArray(
                    item.sites
                  )
                    ? item.sites[0]
                    : item.sites

                return (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-950">
                          {
                            item.date
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {item.heure_debut ??
                            "Horaire non renseigné"}

                          {" → "}

                          {item.heure_fin ??
                            "Non renseigné"}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Site :{" "}
                          {site?.nom ??
                            "Non renseigné"}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Service :{" "}
                          {item.service ??
                            "Non renseigné"}
                        </p>
                      </div>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item.statut ??
                          "Non renseigné"}
                      </span>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        ) : (
          <p className="mt-4 text-slate-600">
            Aucun planning
            enregistré.
          </p>
        )}
      </section>

      {/* =====================================================
          MES FORMATIONS
          ===================================================== */}

      <section
        id="formations"
        className="mt-8 scroll-mt-6"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
          Mon dossier RH
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Mes formations
        </h2>

        {formationsError ? (
          <p className="mt-4 text-red-600">
            Impossible de charger
            les formations.
          </p>
        ) : formations &&
          formations.length > 0 ? (
          <div className="mt-4 space-y-4">
            {formations.map(
              (formation) => (
                <div
                  key={
                    formation.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="font-bold text-slate-950">
                    {
                      formation.formation
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Organisme :{" "}
                    {formation.organisme ??
                      "Non renseigné"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Date :{" "}
                    {formation.date_formation ??
                      "Non renseignée"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Expiration :{" "}
                    {formation.date_expiration ??
                      "Non renseignée"}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="mt-4 text-slate-600">
            Aucune formation
            enregistrée.
          </p>
        )}
      </section>

      {/* =====================================================
          MES DOCUMENTS
          ===================================================== */}

      <section
        id="documents"
        className="mt-8 scroll-mt-6"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
          Mon dossier RH
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Mes documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consultez les
              documents disponibles
              dans votre dossier RH.
            </p>
          </div>

          {!documentsError && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {documents.length}{" "}
              document
              {documents.length > 1
                ? "s"
                : ""}
            </span>
          )}
        </div>

        {documentsError ? (
          <p className="mt-4 text-red-600">
            Impossible de charger
            vos documents.
          </p>
        ) : documents.length >
          0 ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {documents.map(
              (document) => (
                <article
                  key={
                    document.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                        {document.categorie ??
                          "Document"}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-slate-950">
                        {document.nom ??
                          "Sans nom"}
                      </h3>
                    </div>

                    {document.date_expiration && (
                      <ExpirationBadge
                        date={
                          document.date_expiration
                        }
                      />
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>
                      <strong>
                        Date du document :
                      </strong>{" "}
                      {formatDate(
                        document.date_document
                      )}
                    </p>

                    <p>
                      <strong>
                        Expiration :
                      </strong>{" "}
                      {document.date_expiration
                        ? formatDate(
                            document.date_expiration
                          )
                        : "Sans échéance"}
                    </p>

                    {document.commentaire && (
                      <p className="rounded-xl bg-slate-50 px-3 py-2">
                        {
                          document.commentaire
                        }
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    {document.signedUrl ? (
                      <a
                        href={
                          document.signedUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        Ouvrir le document
                      </a>
                    ) : (
                      <span className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
                        Fichier indisponible
                      </span>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <p className="mt-4 text-slate-600">
            Aucun document
            disponible.
          </p>
        )}
      </section>
            <section
        id="absences"
        className="mt-8 scroll-mt-6"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
          Mon dossier RH
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Mes absences
        </h2>

        {absencesError ? (
          <p className="mt-4 text-red-600">
            Impossible de charger vos absences.
          </p>
        ) : absences && absences.length > 0 ? (
          <div className="mt-4 space-y-4">
            {absences.map((absence) => (
              <div
                key={absence.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-950">
                      {absence.type ?? "Absence"}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Du {absence.date_debut ?? "Non renseigné"}
                      {" au "}
                      {absence.date_fin ?? "Non renseigné"}
                    </p>

                    {absence.commentaire && (
                      <p className="mt-2 text-sm text-slate-600">
                        {absence.commentaire}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {absence.statut_validation ?? "Non renseigné"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-slate-600">
            Aucune absence enregistrée.
          </p>
        )}
      </section>
    </main>
  )
}

/*
 * =========================================================
 * DOCUMENTS
 * =========================================================
 */

function resolveDocumentPath(
  fileValue: string,
  agentId: number
) {
  const value =
    fileValue.trim()

  /*
   * Si une ancienne URL publique
   * a été enregistrée, on récupère
   * uniquement son chemin.
   */
  const marker =
    "/storage/v1/object/public/documents-rh/"

  const markerIndex =
    value.indexOf(marker)

  if (markerIndex !== -1) {
    return decodeURIComponent(
      value.slice(
        markerIndex +
          marker.length
      )
    )
  }

  /*
   * Nouveau format :
   * 8/nom-fichier.pdf
   */
  if (value.includes("/")) {
    return value.replace(
      /^\/+/,
      ""
    )
  }

  /*
   * Anciennes données :
   * seul le nom du fichier
   * était enregistré.
   */
  return `${agentId}/${value}`
}

/*
 * =========================================================
 * DATES
 * =========================================================
 */

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

function ExpirationBadge({
  date,
}: {
  date: string
}) {
  const expiration =
    new Date(
      `${date}T12:00:00`
    )

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
    Number.isNaN(
      daysRemaining
    )
  ) {
    return null
  }

  if (daysRemaining < 0) {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        Expiré
      </span>
    )
  }

  if (daysRemaining <= 30) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        {daysRemaining} j restant
        {daysRemaining > 1
          ? "s"
          : ""}
      </span>
    )
  }

  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      Valide
    </span>
  )
}