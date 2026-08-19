"use client"

type UncoveredPost = {
  id: string | number
  site?: {
    nom?: string | null
  } | null
  structure?: {
    nom?: string | null
  } | null
  service?: string | null
  heure_debut?: string | null
  heure_fin?: string | null
}

type UncoveredPostsPanelProps = {
  posts: UncoveredPost[]
  loading?: boolean
  onReplace?: (post: UncoveredPost) => void
}

export default function UncoveredPostsPanel({
  posts,
  loading = false,
  onReplace,
}: UncoveredPostsPanelProps) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Chargement des postes non couverts...
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Postes non couverts
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            {posts.length} poste
            {posts.length > 1 ? "s" : ""} nécessitant une
            affectation.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            posts.length > 0
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {posts.length}
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">
            Tous les postes sont couverts.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {posts.map((post) => {
            const structureName =
              post.structure?.nom ??
              post.site?.nom ??
              "Structure non renseignée"

            const serviceName =
              post.service?.trim() ||
              "Service non renseigné"

            const timeLabel =
              post.heure_debut && post.heure_fin
                ? `${post.heure_debut} - ${post.heure_fin}`
                : "Créneau non renseigné"

            return (
              <article
                key={String(post.id)}
                className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-900">
                    {structureName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-700">
                    {serviceName}
                  </p>

                  <p className="mt-1 text-sm font-medium text-red-700">
                    {timeLabel}
                  </p>
                </div>

                {onReplace ? (
                  <button
                    type="button"
                    onClick={() => onReplace(post)}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Remplacer
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}