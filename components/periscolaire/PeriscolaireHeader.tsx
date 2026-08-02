"use client"

import {
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react"

type PeriscolaireHeaderProps = {
  loading?: boolean
  onRefresh: () => void | Promise<void>
  onCreate: () => void
}

export default function PeriscolaireHeader({
  loading = false,
  onRefresh,
  onCreate,
}: PeriscolaireHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
          Périscolaire
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Activités extérieures
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Planifiez les sorties, calculez automatiquement
          l’encadrement requis et affectez les accompagnants.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Actualiser
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          Nouvelle activité
        </button>
      </div>
    </header>
  )
}