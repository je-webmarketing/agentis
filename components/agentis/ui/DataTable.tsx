import type { ReactNode } from "react"

type Props = {
  headers: ReactNode[]
  children: ReactNode
  empty?: ReactNode
  loading?: boolean
  loadingLabel?: string
}

export default function DataTable({
  headers,
  children,
  empty,
  loading = false,
  loadingLabel = "Chargement...",
}: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] text-slate-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-12 text-center text-slate-500"
                >
                  {loadingLabel}
                </td>
              </tr>
            ) : children ? (
              children
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-12 text-center"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}