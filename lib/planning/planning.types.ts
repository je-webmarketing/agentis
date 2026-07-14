export type PlanningSlotKey =
  | "matin"
  | "midi"
  | "midi_primaire"
  | "midi_maternelle"
  | "atsem"
  | "restauration"
  | "soir"

export type PlanningAgentStatus =
  | "present"
  | "absence"
  | "replacement"

export type PlanningSiteStatus =
  | "ok"
  | "warning"
  | "danger"

export type PlanningSlotDefinition = {
  key: PlanningSlotKey
  label: string
  time: string
}

export type PlanningSite = {
  id: string
  name: string
  status: PlanningSiteStatus
}

export type PlanningAgent = {
  id: string
  firstName: string
  lastName: string
  position: string
  siteId: string
  slot: PlanningSlotKey
  start: string
  end: string
  status: PlanningAgentStatus
}