import type { SupabaseClient } from "@supabase/supabase-js"

import {
  createClient as createServerSupabaseClient,
} from "@/lib/supabase/server"

import { auditEngine } from "../AuditEngine"
import type { AgentisAuditReport } from "../types"

import { ContractAudit } from "./ContractAudit"
import { HabilitationAudit } from "./HabilitationAudit"
import { MedicalVisitAudit } from "./MedicalVisitAudit"

export class AuditRunner {
  static async run(
    providedClient?: SupabaseClient
  ): Promise<AgentisAuditReport> {
    const client =
      providedClient ??
      (await createServerSupabaseClient())

    auditEngine.clear()

    const auditResults =
      await Promise.all([
        ContractAudit.run(client),
        HabilitationAudit.run(client),
        MedicalVisitAudit.run(client),
      ])

    for (const checks of auditResults) {
      for (const check of checks) {
        auditEngine.addCheck(check)
      }
    }

    return auditEngine.buildReport()
  }
}