import type { ReactNode } from "react"

type Props = {
  title: string
  children: ReactNode
}

export default function DashboardSection({
  title,
  children,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" />

      <div className="p-6">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>

          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-sm" />
        </header>

        <div className="min-h-[210px] text-slate-700">
          {children}
        </div>
      </div>
    </section>
  )
}