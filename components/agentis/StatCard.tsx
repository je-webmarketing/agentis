import Link from "next/link"
import type { ReactNode } from "react"

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
    value: "text-amber-700",
    border: "border-amber-200",
    accent: "from-amber-400 to-yellow-500",
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    hover: "hover:border-amber-300",
  },
  emerald: {
    value: "text-emerald-700",
    border: "border-emerald-200",
    accent: "from-emerald-400 to-emerald-500",
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    hover: "hover:border-emerald-300",
  },
  red: {
    value: "text-red-700",
    border: "border-red-200",
    accent: "from-red-400 to-red-500",
    icon: "border-red-200 bg-red-50 text-red-700",
    hover: "hover:border-red-300",
  },
  cyan: {
    value: "text-cyan-700",
    border: "border-cyan-200",
    accent: "from-cyan-400 to-cyan-500",
    icon: "border-cyan-200 bg-cyan-50 text-cyan-700",
    hover: "hover:border-cyan-300",
  },
  blue: {
    value: "text-blue-700",
    border: "border-blue-200",
    accent: "from-blue-400 to-blue-500",
    icon: "border-blue-200 bg-blue-50 text-blue-700",
    hover: "hover:border-blue-300",
  },
  violet: {
    value: "text-violet-700",
    border: "border-violet-200",
    accent: "from-violet-400 to-violet-500",
    icon: "border-violet-200 bg-violet-50 text-violet-700",
    hover: "hover:border-violet-300",
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
      className={`group relative h-full overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${theme.border} ${theme.hover}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accent}`}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>

          <div
            className={`mt-4 text-4xl font-bold tracking-tight ${theme.value}`}
          >
            {value}
          </div>

          {subtitle && (
            <p className="mt-4 text-sm font-medium text-slate-700">
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
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl transition-transform duration-300 group-hover:scale-110 ${theme.icon}`}
          >
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