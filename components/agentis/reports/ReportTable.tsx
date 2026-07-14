type Props = {
  headers: string[]
  children: React.ReactNode
}

export default function ReportTable({
  headers,
  children,
}: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a]">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-[#111827] text-sm text-slate-300">

            <tr>

              {headers.map((header) => (

                <th
                  key={header}
                  className="p-4 text-left"
                >
                  {header}
                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {children}

          </tbody>

        </table>

      </div>

    </div>
  )
}