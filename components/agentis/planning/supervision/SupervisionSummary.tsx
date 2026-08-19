type SupervisionSummaryProps = {
  displayedStructures: number
  coveredStructures: number
  warningStructures: number
  criticalStructures: number
  uncoveredPosts: number
  expectedPosts: number
  coveredPosts: number
  coverage: number
  selectedDate: string
}

type SummaryTone =
  | "slate"
  | "emerald"
  | "amber"
  | "red"
  | "blue"

export default function SupervisionSummary({
  displayedStructures,
  coveredStructures,
  warningStructures,
  criticalStructures,
  uncoveredPosts,
  expectedPosts,
  coveredPosts,
  coverage,
  selectedDate,
}: SupervisionSummaryProps) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Affichées"
          value={displayedStructures}
          tone="slate"
        />

        <SummaryCard
          label="Couvertes"
          value={coveredStructures}
          tone="emerald"
        />

        <SummaryCard
          label="À surveiller"
          value={warningStructures}
          tone="amber"
        />

        <SummaryCard
          label="Critiques"
          value={criticalStructures}
          tone="red"
        />

        <SummaryCard
          label="Postes non couverts"
          value={uncoveredPosts}
          tone={uncoveredPosts > 0 ? "red" : "emerald"}
        />

        <SummaryCard
          label="Couverture"
          value={`${coverage} %`}
          tone="blue"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Supervision du {selectedDate}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {uncoveredPosts} poste
              {uncoveredPosts > 1 ? "s" : ""} restant
              {uncoveredPosts > 1 ? "s" : ""} à couvrir dans la
              sélection.
            </p>
          </div>

          <div className="text-sm font-semibold text-slate-700">
            {coveredPosts} / {expectedPosts} besoins couverts
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              coverage >= 90
                ? "bg-emerald-500"
                : coverage >= 70
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
            style={{
              width: `${Math.max(0, Math.min(100, coverage))}%`,
            }}
          />
        </div>
      </section>
    </>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: SummaryTone
}) {
  const styles: Record<SummaryTone, string> = {
    slate:
      "border-slate-200 bg-white text-slate-900",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
    red:
      "border-red-200 bg-red-50 text-red-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
  }

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${styles[tone]}`}
    >
      <p className="text-sm font-medium text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold">
        {value}
      </p>
    </article>
  )
}