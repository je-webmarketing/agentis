import type { ReactNode } from "react"

type Props = {
  title?: string
  children: ReactNode
  className?: string
}

export default function FilterBar({
  title = "Filtres",
  children,
  className = "",
}: Props) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {title && (
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Recherche
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {title}
            </h2>
          </div>

          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </section>
  )
}