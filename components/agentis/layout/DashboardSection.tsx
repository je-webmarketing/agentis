import { ReactNode } from "react"

type Props = {
  title: string
  children: ReactNode
}

export default function DashboardSection({ title, children }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h2 className="text-xl font-bold text-yellow-400 mb-5">
        {title}
      </h2>

      {children}
    </section>
  )
}