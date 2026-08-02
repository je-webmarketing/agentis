import type { ReactNode } from "react"

type ActionBarProps = {
  children: ReactNode
}

export default function ActionBar({
  children,
}: ActionBarProps) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {children}
      </div>
    </div>
  )
}