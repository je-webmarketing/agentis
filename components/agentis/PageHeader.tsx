import Link from "next/link"

type PageHeaderProps = {
  title: string
  subtitle?: string
  badge?: string
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  backHref,
  backLabel = "Retour",
  action,
}: PageHeaderProps) {
  return (
    <>
      {backHref && (
        <Link
          href={backHref}
          className="inline-block mb-4 px-4 py-2 rounded-xl border border-slate-700 bg-[#111827] hover:bg-slate-800 transition"
        >
          ← {backLabel}
        </Link>
      )}

      <div className="mb-8 border-b border-slate-800 pb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-yellow-400 mb-1">
            AGENTIS
          </p>

          <h1 className="text-3xl font-bold">
            {title}
          </h1>

          {subtitle && (
            <p className="text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {badge && (
            <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm">
              {badge}
            </span>
          )}

          {action}
        </div>
      </div>
    </>
  )
}