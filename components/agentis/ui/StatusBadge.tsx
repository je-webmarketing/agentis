type BadgeTone =
  | "slate"
  | "green"
  | "red"
  | "yellow"
  | "cyan"
  | "blue"
  | "orange"
  | "violet"

type Props = {
  label: string
  tone?: BadgeTone
  size?: "sm" | "md"
}

const toneStyles: Record<
  BadgeTone,
  string
> = {
  slate:
    "border-slate-600 bg-slate-700/20 text-slate-300",

  green:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",

  red:
    "border-red-500/30 bg-red-500/10 text-red-300",

  yellow:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",

  cyan:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",

  blue:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",

  orange:
    "border-orange-500/30 bg-orange-500/10 text-orange-300",

  violet:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
}

const sizeStyles = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
}

export default function StatusBadge({
  label,
  tone = "slate",
  size = "sm",
}: Props) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        font-semibold
        whitespace-nowrap
        ${toneStyles[tone]}
        ${sizeStyles[size]}
      `}
    >
      {label}
    </span>
  )
}