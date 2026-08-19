import type { ReactNode } from "react"

type Props = {
  title: string
  description?: string
  badge?: string
  actions?: ReactNode
}

export default function ReportHeader({
  title,
  description,
  badge = "AGENTIS",
  actions,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-amber-50 p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-600">
            {badge}
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}