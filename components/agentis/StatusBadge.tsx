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
          ? "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm"
          : "inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-700 shadow-sm"
      }
    >
      <span
        className={
          active
            ? "h-2.5 w-2.5 rounded-full bg-emerald-500"
            : "h-2.5 w-2.5 rounded-full bg-red-500"
        }
      />

      {active ? activeLabel : inactiveLabel}
    </span>
  )
}