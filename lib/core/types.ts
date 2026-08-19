export type AgentisModule =
  | "agents"
  | "planning"
  | "absences"
  | "remplacements"
  | "documents"
  | "formations"
  | "habilitations"
  | "visites-medicales"
  | "periscolaire"
  | "rapports"
  | "administration"
  | "authentification"
  | "cockpit"

export type AgentisEventName =
  | "AGENT_CREATED"
  | "AGENT_UPDATED"
  | "AGENT_DEACTIVATED"
  | "ABSENCE_CREATED"
  | "ABSENCE_UPDATED"
  | "ABSENCE_VALIDATED"
  | "ABSENCE_REFUSED"
  | "PLANNING_CREATED"
  | "PLANNING_UPDATED"
  | "PLANNING_DELETED"
  | "REPLACEMENT_CREATED"
  | "REPLACEMENT_UPDATED"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_EXPIRED"
  | "FORMATION_CREATED"
  | "FORMATION_EXPIRED"
  | "HABILITATION_CREATED"
  | "HABILITATION_EXPIRED"
  | "MEDICAL_VISIT_CREATED"
  | "MEDICAL_VISIT_EXPIRED"
  | "USER_CONNECTED"
  | "USER_DISCONNECTED"
  | "ROLE_CHANGED"

export type AgentisSeverity =
  | "info"
  | "success"
  | "warning"
  | "critical"

export type AgentisEntityType =
  | "agent"
  | "absence"
  | "planning"
  | "replacement"
  | "document"
  | "formation"
  | "habilitation"
  | "medical-visit"
  | "site"
  | "service"
  | "post"
  | "structure"
  | "user"

export type AgentisEventPayload = Record<string, unknown>

export type AgentisEvent = {
  id: string
  name: AgentisEventName
  module: AgentisModule
  entityType?: AgentisEntityType
  entityId?: string
  severity: AgentisSeverity
  payload: AgentisEventPayload
  occurredAt: string
  userId?: string
  source?: string
}

export type AgentisRuleContext = {
  module: AgentisModule
  action: string
  entityType?: AgentisEntityType
  entityId?: string
  data?: Record<string, unknown>
  userId?: string
}

export type AgentisRuleResult = {
  valid: boolean
  code: string
  message: string
  severity: AgentisSeverity
  metadata?: Record<string, unknown>
}

export type AgentisAuditStatus =
  | "success"
  | "warning"
  | "error"
  | "skipped"

export type AgentisAuditCheck = {
  id: string
  module: AgentisModule
  label: string
  status: AgentisAuditStatus
  message: string
  severity: AgentisSeverity
  metadata?: Record<string, unknown>
}

export type AgentisAuditReport = {
  generatedAt: string
  score: number
  totalChecks: number
  passedChecks: number
  warningChecks: number
  failedChecks: number
  checks: AgentisAuditCheck[]
}

export type AgentisHealthMetric = {
  key: string
  label: string
  score: number
  severity: AgentisSeverity
  description?: string
}

export type AgentisHealthReport = {
  generatedAt: string
  score: number
  status: AgentisSeverity
  metrics: AgentisHealthMetric[]
}

export type AgentisRecommendationReason = {
  label: string
  score: number
  severity: AgentisSeverity
  description?: string
}

export type AgentisRecommendation<T = unknown> = {
  id: string
  score: number
  item: T
  reasons: AgentisRecommendationReason[]
  warnings: string[]
}