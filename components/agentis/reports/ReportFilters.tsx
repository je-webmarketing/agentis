type Props = {
  children: React.ReactNode
}

export default function ReportFilters({
  children,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0f172a] p-6">
      <div className="grid gap-5 md:grid-cols-4">
        {children}
      </div>
    </div>
  )
}