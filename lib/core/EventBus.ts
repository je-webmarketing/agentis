import { AgentisEvent, AgentisEventName } from "./types"

type EventHandler = (event: AgentisEvent) => void | Promise<void>

export class EventBus {
  private listeners = new Map<AgentisEventName, Set<EventHandler>>()

  subscribe(eventName: AgentisEventName, handler: EventHandler): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }

    this.listeners.get(eventName)!.add(handler)

    return () => {
      this.listeners.get(eventName)?.delete(handler)
    }
  }

  async publish(event: AgentisEvent): Promise<void> {
    const handlers = this.listeners.get(event.name)

    if (!handlers || handlers.size === 0) {
      return
    }

    for (const handler of handlers) {
      await handler(event)
    }
  }

  clear() {
    this.listeners.clear()
  }

  listenerCount(eventName: AgentisEventName): number {
    return this.listeners.get(eventName)?.size ?? 0
  }
}

export const eventBus = new EventBus()