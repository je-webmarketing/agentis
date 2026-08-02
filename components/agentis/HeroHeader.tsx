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
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-10 shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" />

      <div className="relative z-10">
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
            <div className="text-xs font-bold uppercase tracking-[0.35em] text-amber-600">
              AGENTIS RH Intelligence
            </div>

            <h1 className="mt-3 text-5xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                {subtitle}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Aujourd'hui
            </div>

            <div className="mt-2 text-base font-semibold capitalize text-slate-800">
              {today}
            </div>
          </div>
        </div>

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
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="text-4xl font-bold text-slate-900">
                  {stat.value}
                </div>

                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

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
      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-700"
    >
      {label}
    </Link>
  )
}