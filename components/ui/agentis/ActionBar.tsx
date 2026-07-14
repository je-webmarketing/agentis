import { ReactNode } from "react"

type ActionBarProps = {
  children: ReactNode
}

export default function ActionBar({
  children,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mt-8">
      {children}
    </div>
  )
}