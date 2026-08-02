import type { ReactNode } from "react"

export type StatCardTone =
  | "slate"
  | "yellow"
  | "cyan"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "violet"

type Props = {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  tone?: StatCardTone
  trend?: {
    value: string
    direction?: "up" | "down" | "neutral"
  }
  footer?: ReactNode
  className?: string
}

const toneStyles: Record<
  StatCardTone,
  {
    card: string
    icon: string
    value: string
  }
> = {
  slate: {
    card: "border-slate-800 bg-[#0f172a]",
    icon: "border-slate-700 bg-slate-800/70 text-slate-300",
    value: "text-white",
  },
  yellow: {
    card: "border-yellow-500/25 bg-yellow-500/[0.06]",
    icon:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    value: "text-yellow-300",
  },
  cyan: {
    card: "border-cyan-500/25 bg-cyan-500/[0.06]",
    icon:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    value: "text-cyan-300",
  },
  blue: {
    card: "border-blue-500/25 bg-blue-500/[0.06]",
    icon:
      "border-blue-500/30 bg-blue-500/10 text-blue-300",
    value: "text-blue-300",
  },
  green: {
    card:
      "border-emerald-500/25 bg-emerald-500/[0.06]",
    icon:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    value: "text-emerald-300",
  },
  orange: {
    card: "border-orange-500/25 bg-orange-500/[0.06]",
    icon:
      "border-orange-500/30 bg-orange-500/10 text-orange-300",
    value: "text-orange-300",
  },
  red: {
    card: "border-red-500/25 bg-red-500/[0.06]",
    icon:
      "border-red-500/30 bg-red-500/10 text-red-300",
    value: "text-red-300",
  },
  violet: {
    card:
      "border-violet-500/25 bg-violet-500/[0.06]",
    icon:
      "border-violet-500/30 bg-violet-500/10 text-violet-300",
    value: "text-violet-300",
  },
}

const trendStyles = {
  up: "text-emerald-300",
  down: "text-red-300",
  neutral: "text-slate-400",
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  tone = "slate",
  trend,
  footer,
  className = "",
}: Props) {
  const styles = toneStyles[tone]
  const trendDirection = trend?.direction || "neutral"

  return (
    <article
      className={`rounded-2xl border p-5 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 ${styles.card} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p
            className={`mt-2 break-words text-3xl font-bold tracking-tight ${styles.value}`}
          >
            {value}
          </p>
        </div>

        {icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${styles.icon}`}
          >
            {icon}
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {description && (
            <p className="text-slate-500">
              {description}
            </p>
          )}

          {trend && (
            <span
              className={`font-semibold ${trendStyles[trendDirection]}`}
            >
              {trend.direction === "up" && "↑ "}
              {trend.direction === "down" && "↓ "}
              {trend.value}
            </span>
          )}
        </div>
      )}

      {footer && (
        <div className="mt-5 border-t border-slate-800/80 pt-4">
          {footer}
        </div>
      )}
    </article>
  )
}