import { ReactNode } from "react"

type SectionProps = {
  title: string
  children: ReactNode
}

export default function Section({
  title,
  children,
}: SectionProps) {
  return (
    <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-6 mb-8">
      <h2 className="text-xl font-bold text-yellow-400 mb-6">
        {title}
      </h2>

      {children}
    </div>
  )
}