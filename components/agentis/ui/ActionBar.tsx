import type { ReactNode } from "react"

type Props = {
  title?: string
  children: ReactNode
}

export default function ActionBar({
  title,
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0f172a] p-5 lg:flex-row lg:items-center lg:justify-between">

      <div>
        {title && (
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {children}
      </div>

    </div>
  )
}