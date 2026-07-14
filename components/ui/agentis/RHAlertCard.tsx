import { RHAlert } from "@/lib/rh-alerts"

type Props = {
  alert: RHAlert
}

export default function RHAlertCard({ alert }: Props) {
  const styles = {
    success:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    warning:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    danger:
      "border-red-500/30 bg-red-500/10 text-red-300",
    info:
      "border-blue-500/30 bg-blue-500/10 text-blue-300",
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        styles[alert.level]
      }`}
    >
      <div className="flex items-center justify-between">

        <div>

          <h3 className="font-bold">
            {alert.title}
          </h3>

          <p className="text-sm mt-1">
            {alert.message}
          </p>

        </div>

        {alert.target && (
          <span className="text-xs opacity-70">
            {alert.target}
          </span>
        )}

      </div>
    </div>
  )
}