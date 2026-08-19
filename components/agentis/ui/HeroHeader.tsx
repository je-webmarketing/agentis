import type { ReactNode } from "react"

type HeroHeaderProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function HeroHeader({
  title,
  subtitle,
  eyebrow = "AGENTIS · RH INTELLIGENCE",
  icon,
  actions,
  className = "",
}: HeroHeaderProps) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-600">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-600">
              {eyebrow}
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}