import Link from "next/link"
import { ReactNode } from "react"

type StatCardProps = {
  title: string
  value: string | number
  color?: "yellow" | "emerald" | "red" | "cyan" | "blue" | "violet"
  icon?: ReactNode
  subtitle?: string
  trend?: string
  href?: string
}

const colors = {
  yellow: {
    text: "text-yellow-300",
    border: "border-yellow-500/30",
    gradient: "from-yellow-400 to-amber-600",
    glow: "shadow-yellow-500/10",
  },
  emerald: {
    text: "text-emerald-300",
    border: "border-emerald-500/30",
    gradient: "from-emerald-400 to-emerald-600",
    glow: "shadow-emerald-500/10",
  },
  red: {
    text: "text-red-300",
    border: "border-red-500/30",
    gradient: "from-red-400 to-red-600",
    glow: "shadow-red-500/10",
  },
  cyan: {
    text: "text-cyan-300",
    border: "border-cyan-500/30",
    gradient: "from-cyan-400 to-cyan-600",
    glow: "shadow-cyan-500/10",
  },
  blue: {
    text: "text-blue-300",
    border: "border-blue-500/30",
    gradient: "from-blue-400 to-blue-600",
    glow: "shadow-blue-500/10",
  },
  violet: {
    text: "text-violet-300",
    border: "border-violet-500/30",
    gradient: "from-violet-400 to-violet-600",
    glow: "shadow-violet-500/10",
  },
}

export default function StatCard({
  title,
  value,
  color = "yellow",
  icon,
  subtitle,
  trend,
  href,
}: StatCardProps) {
  const theme = colors[color]

  const content = (
    <div
      className={`group relative h-full overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-br from-slate-900 via-[#111827] to-[#020817] p-6 shadow-xl ${theme.glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>

          <div className={`mt-4 text-4xl font-bold tracking-tight ${theme.text}`}>
            {value}
          </div>

          {subtitle && (
            <p className="mt-4 text-sm font-medium text-slate-200">
              {subtitle}
            </p>
          )}

          {trend && (
            <p className="mt-1 text-xs text-slate-500">
              {trend}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl text-slate-100 backdrop-blur transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}