type Props = {
  title: string
  description?: string
  badge?: string
  actions?: React.ReactNode
}

export default function ReportHeader({
  title,
  description,
  badge = "AGENTIS",
  actions,
}: Props) {
  return (
    <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#111827] via-[#07111f] to-[#020817] p-8 shadow-2xl shadow-black/30">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
            {badge}
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl text-slate-400">
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