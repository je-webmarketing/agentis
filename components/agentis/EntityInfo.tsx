type EntityInfoProps = {
  label: string
  value?: string | number | null
  fallback?: string
}

export default function EntityInfo({
  label,
  value,
  fallback = "Non renseigné",
}: EntityInfoProps) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-slate-100 font-medium">
        {value || fallback}
      </p>
    </div>
  )
}