type Props = {
  title: string
  subtitle: string
  stats?: {
    label: string
    value: string | number
  }[]
}

export default function HeroHeader({
  title,
  subtitle,
  stats = [],
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#020817] p-8">

      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="relative">

        <p className="text-yellow-400 text-sm font-semibold tracking-widest uppercase">
          AGENTIS
        </p>

        <h1 className="mt-3 text-4xl font-black text-white">
          {title}
        </h1>

        <p className="mt-3 text-slate-400 text-lg">
          {subtitle}
        </p>

        {stats.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-6">

            {stats.map((stat) => (

              <div
                key={stat.label}
                className="rounded-2xl border border-slate-700 bg-black/20 px-5 py-4"
              >
                <div className="text-3xl font-black text-yellow-400">
                  {stat.value}
                </div>

                <div className="text-xs uppercase tracking-wider text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  )
}