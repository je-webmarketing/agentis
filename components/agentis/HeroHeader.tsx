import Link from "next/link"

type HeroStat = {
  label: string
  value: string | number
}

type HeroHeaderProps = {
  title: string
  subtitle?: string
  stats?: HeroStat[]
}

export default function HeroHeader({
  title,
  subtitle,
  stats = [],
}: HeroHeaderProps) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-yellow-500/20 bg-gradient-to-br from-[#111827] via-[#08111d] to-[#020817] p-8 shadow-2xl">

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative z-10">

        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-yellow-300 font-semibold">
              AGENTIS RH Intelligence
            </div>

            <h1 className="mt-2 text-5xl font-bold text-white">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-3 text-slate-300 max-w-3xl leading-6">
                {subtitle}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700 bg-white/5 px-6 py-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Aujourd'hui
            </div>

            <div className="mt-2 text-sm text-slate-200 capitalize">
              {today}
            </div>
          </div>
        </div>

        {/* KPI */}

        {stats.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 32,
              flexWrap: "wrap",
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: "1 1 180px",
                  minWidth: 170,
                }}
                className="rounded-2xl border border-slate-700 bg-[#07111d]/70 p-5"
              >
                <div className="text-4xl font-bold text-white">
                  {stat.value}
                </div>

                <div className="mt-2 uppercase tracking-[0.18em] text-xs text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 32,
          }}
        >
          <HeroAction href="/dashboard/agents" label="+ Nouvel agent" />
          <HeroAction href="/dashboard/planning" label="Planning" />
          <HeroAction href="/dashboard/documents" label="Documents" />
          <HeroAction href="/dashboard/absences" label="Absences" />
        </div>

      </div>
    </section>
  )
}

function HeroAction({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-700 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-yellow-400/50 hover:bg-yellow-400/10"
    >
      {label}
    </Link>
  )
}