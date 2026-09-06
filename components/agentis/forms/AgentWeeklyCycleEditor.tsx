"use client"

export type WeeklyCycleDay = {
  jour: number
  actif: boolean
  heure_debut_matin: string
  heure_fin_matin: string
  heure_debut_apres_midi: string
  heure_fin_apres_midi: string
}

type Props = {
  value: WeeklyCycleDay[]
  onChange: (value: WeeklyCycleDay[]) => void
}

const DAYS = [
  {
    jour: 1,
    label: "Lundi",
  },
  {
    jour: 2,
    label: "Mardi",
  },
  {
    jour: 3,
    label: "Mercredi",
  },
  {
    jour: 4,
    label: "Jeudi",
  },
  {
    jour: 5,
    label: "Vendredi",
  },
  {
    jour: 6,
    label: "Samedi",
  },
  {
    jour: 0,
    label: "Dimanche",
  },
]

export function createEmptyWeeklyCycle(): WeeklyCycleDay[] {
  return DAYS.map(({ jour }) => ({
    jour,
    actif:
  jour >= 1 &&
  jour <= 5,
    heure_debut_matin: "",
    heure_fin_matin: "",
    heure_debut_apres_midi: "",
    heure_fin_apres_midi: "",
  }))
}

export default function AgentWeeklyCycleEditor({
  value,
  onChange,
}: Props) {
  function updateDay(
    jour: number,
    changes: Partial<WeeklyCycleDay>
  ) {
    onChange(
      value.map((day) =>
        day.jour === jour
          ? {
              ...day,
              ...changes,
            }
          : day
      )
    )
  }

  const totalMinutes = value.reduce(
    (total, day) => {
      if (!day.actif) return total

      return (
        total +
        calculateDuration(
          day.heure_debut_matin,
          day.heure_fin_matin
        ) +
        calculateDuration(
          day.heure_debut_apres_midi,
          day.heure_fin_apres_midi
        )
      )
    },
    0
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
          Temps de travail
        </p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Cycle hebdomadaire
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Définissez les jours et horaires habituels de
              l’agent.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
            <p className="text-xs font-medium text-amber-700">
              Total hebdomadaire
            </p>

            <p className="text-lg font-bold text-amber-900">
              {formatMinutes(totalMinutes)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {DAYS.map(({ jour, label }) => {
          const day =
            value.find(
              (item) => item.jour === jour
            ) || {
              jour,
              actif: false,
              heure_debut_matin: "",
              heure_fin_matin: "",
              heure_debut_apres_midi: "",
              heure_fin_apres_midi: "",
            }

          return (
            <div
              key={jour}
              className={`rounded-xl border p-4 transition ${
                day.actif
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="grid grid-cols-1 items-center gap-4 xl:grid-cols-[150px_130px_1fr]">
                <div className="font-semibold text-slate-900">
                  {label}
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={day.actif}
                    onChange={(event) =>
                      updateDay(jour, {
                        actif:
                          event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-amber-500"
                  />

                  Travaillé
                </label>

                {day.actif ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TimeRange
                      label="Matin"
                      start={
                        day.heure_debut_matin
                      }
                      end={
                        day.heure_fin_matin
                      }
                      onStartChange={(time) =>
                        updateDay(jour, {
                          heure_debut_matin:
                            time,
                        })
                      }
                      onEndChange={(time) =>
                        updateDay(jour, {
                          heure_fin_matin:
                            time,
                        })
                      }
                    />

                    <TimeRange
                      label="Après-midi"
                      start={
                        day.heure_debut_apres_midi
                      }
                      end={
                        day.heure_fin_apres_midi
                      }
                      onStartChange={(time) =>
                        updateDay(jour, {
                          heure_debut_apres_midi:
                            time,
                        })
                      }
                      onEndChange={(time) =>
                        updateDay(jour, {
                          heure_fin_apres_midi:
                            time,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="text-sm italic text-slate-400">
                    Non travaillé
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TimeRange({
  label,
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  label: string
  start: string
  end: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="flex items-center gap-2">
        <input
          type="time"
          value={start}
          onChange={(event) =>
            onStartChange(event.target.value)
          }
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
        />

        <span className="text-slate-400">→</span>

        <input
          type="time"
          value={end}
          onChange={(event) =>
            onEndChange(event.target.value)
          }
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
      </div>
    </div>
  )
}

function calculateDuration(
  start: string,
  end: string
) {
  if (!start || !end) return 0

  const [startHour, startMinute] =
    start.split(":").map(Number)

  const [endHour, endMinute] =
    end.split(":").map(Number)

  const startTotal =
    startHour * 60 + startMinute

  const endTotal =
    endHour * 60 + endMinute

  return Math.max(0, endTotal - startTotal)
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!remainingMinutes) {
    return `${hours} h`
  }

  return `${hours} h ${String(
    remainingMinutes
  ).padStart(2, "0")}`
}