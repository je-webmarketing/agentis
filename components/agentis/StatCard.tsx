type StatCardProps = {
  title: string
  value: string | number
  color?: "yellow" | "emerald" | "red" | "cyan" | "blue" | "violet"
  icon?: string
  subtitle?: string
  trend?: string
  href?: string
}

const colors = {
  yellow: {
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    top: "bg-yellow-500",
  },
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    top: "bg-emerald-500",
  },
  red: {
    text: "text-red-400",
    border: "border-red-500/30",
    top: "bg-red-500",
  },
  cyan: {
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    top: "bg-cyan-500",
  },
  blue: {
    text: "text-blue-400",
    border: "border-blue-500/30",
    top: "bg-blue-500",
  },
  violet: {
    text: "text-violet-400",
    border: "border-violet-500/30",
    top: "bg-violet-500",
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

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-[#0f172a] p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className={`absolute top-0 left-0 h-1 w-full ${theme.top}`} />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-400 text-sm uppercase tracking-wide">
            {title}
          </p>

          <p className={`text-4xl font-bold mt-2 ${theme.text}`}>
            {value}
          </p>
        </div>

        {icon && (
          <div className="text-3xl opacity-80">
            {icon}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-sm text-slate-300">
          {subtitle}
        </p>
      )}

      {trend && (
        <p className="mt-2 text-xs text-slate-500">
          {trend}
        </p>
      )}

      {href && (
        <div className="mt-5 pt-4 border-t border-slate-800">
          <a
            href={href}
            className={`${theme.text} text-sm font-medium hover:underline`}
          >
            Voir le détail →
          </a>
        </div>
      )}
    </div>
  )
}