import { ReactNode } from "react"

type Props = {
  title: string
  children: ReactNode
}

export default function DashboardSection({ title, children }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a] via-[#0b1220] to-[#020817] shadow-2xl shadow-black/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="p-6">
        <header className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">
            {title}
          </h2>

          <div className="h-2 w-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/40" />
        </header>

        <div className="min-h-[210px]">{children}</div>
      </div>
    </section>
  )
}