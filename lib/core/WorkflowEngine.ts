import { eventBus } from "./EventBus"
import type { AgentisEvent } from "./types"

export type WorkflowStep = {
  id: string
  label: string
  execute(event: AgentisEvent): Promise<void> | void
}

export type Workflow = {
  id: string
  event: AgentisEvent["name"]
  steps: WorkflowStep[]
}

export class WorkflowEngine {
  private workflows = new Map<string, Workflow>()

  register(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow)

    eventBus.subscribe(workflow.event, async (event) => {
      await this.execute(workflow.id, event)
    })
  }

  unregister(id: string): boolean {
    return this.workflows.delete(id)
  }

  get(id: string): Workflow | undefined {
    return this.workflows.get(id)
  }

  list(): Workflow[] {
    return Array.from(this.workflows.values())
  }

  async execute(id: string, event: AgentisEvent): Promise<void> {
    const workflow = this.workflows.get(id)

    if (!workflow) {
      return
    }

    for (const step of workflow.steps) {
      await step.execute(event)
    }
  }

  clear(): void {
    this.workflows.clear()
  }
}

export const workflowEngine = new WorkflowEngine()