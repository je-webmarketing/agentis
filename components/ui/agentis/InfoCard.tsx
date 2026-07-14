type InfoCardProps = {
  label: string
  value?: string | number | null
}

export default function InfoCard({
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        {label}
      </p>

      <p className="text-lg font-semibold text-white">
        {value || "Non renseigné"}
      </p>
    </div>
  )
}