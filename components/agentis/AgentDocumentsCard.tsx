type Props = {
  totalDocuments?: number
}

export default function AgentDocumentsCard({
  totalDocuments = 0,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">
        Documents
      </h3>

      <p className="text-5xl font-black text-yellow-400">
        {totalDocuments}
      </p>

      <p className="text-slate-400 mt-2">
        document(s)
      </p>
    </div>
  )
}