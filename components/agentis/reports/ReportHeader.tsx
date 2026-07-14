type Props = {
  title: string
  description?: string
}

export default function ReportHeader({
  title,
  description,
}: Props) {
  return (
    <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#111827] via-[#07111f] to-[#020817] p-8 shadow-2xl shadow-black/30">

      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
        AGENTIS
      </p>

      <h1 className="mt-3 text-3xl font-bold text-white">
        {title}
      </h1>

      {description && (
        <p className="mt-3 max-w-3xl text-slate-400">
          {description}
        </p>
      )}

    </section>
  )
}