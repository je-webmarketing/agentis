type StatusBadgeProps = {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}

export default function StatusBadge({
  active,
  activeLabel = "Actif",
  inactiveLabel = "Inactif",
}: StatusBadgeProps) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-sm font-medium"
          : "inline-flex items-center px-3 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20 text-sm font-medium"
      }
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}