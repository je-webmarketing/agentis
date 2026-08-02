import type { ReactNode } from "react"

type Props = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-10 py-16 text-center shadow-sm">
      {icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-4xl text-amber-500 shadow-sm">
          {icon}
        </div>
      )}

      <h3 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h3>

      {description && (
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  )
}