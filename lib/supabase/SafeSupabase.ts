import { supabase } from "@/lib/supabase"

export type SafeSupabaseResult<T> = {
  data: T
  error: Error | null
  offline: boolean
  timedOut: boolean
}

export type SafeSupabaseOptions<T> = {
  fallback: T
  context?: string
  timeoutMs?: number
  logError?: boolean
}

const DEFAULT_TIMEOUT_MS = 8_000

type QueryResult<T> = {
  data: T | null
  error: unknown
}

type TimeoutResult = {
  __safeSupabaseTimeout: true
}

function toError(
  error: unknown,
  fallbackMessage: string
) {
  if (error instanceof Error) {
    return error
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return new Error(error.message)
  }

  return new Error(fallbackMessage)
}

function isTimeoutResult(
  value: unknown
): value is TimeoutResult {
  return Boolean(
    value &&
      typeof value === "object" &&
      "__safeSupabaseTimeout" in value
  )
}

function isNetworkError(error: Error) {
  const message = error.message
    .toLowerCase()
    .trim()

  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network error") ||
    message.includes("connection reset") ||
    message.includes("err_connection") ||
    message.includes("timeout") ||
    message.includes("délai de réponse dépassé")
  )
}

function safeLog(
  context: string,
  error: Error,
  enabled: boolean
) {
  if (!enabled) return

  /*
   * Ne pas transmettre l'objet Error à console.error/console.warn :
   * Next.js l'intercepte en développement et affiche un écran rouge.
   */
  console.info(
    `[SafeSupabase] ${context} — ${error.message}`
  )
}

export const SafeSupabase = {
  client: supabase,

  async execute<T>(
    query:
      | PromiseLike<QueryResult<T>>
      | (() => PromiseLike<QueryResult<T>>),
    options: SafeSupabaseOptions<T>
  ): Promise<SafeSupabaseResult<T>> {
    const context =
      options.context || "Requête Supabase"

    const timeoutMs =
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const logError =
      options.logError ?? false

    let timeoutId:
      | ReturnType<typeof setTimeout>
      | null = null

    try {
      const queryPromise = Promise.resolve(
        typeof query === "function"
          ? query()
          : query
      )

      const timeoutPromise =
        new Promise<TimeoutResult>((resolve) => {
          timeoutId = setTimeout(() => {
            resolve({
              __safeSupabaseTimeout: true,
            })
          }, timeoutMs)
        })

      const result = await Promise.race([
        queryPromise,
        timeoutPromise,
      ])

      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      if (isTimeoutResult(result)) {
        const error = new Error(
          `${context} : délai de réponse dépassé.`
        )

        safeLog(context, error, logError)

        return {
          data: options.fallback,
          error,
          offline: true,
          timedOut: true,
        }
      }

      if (result.error) {
        const error = toError(
          result.error,
          `${context} impossible.`
        )

        safeLog(context, error, logError)

        return {
          data: options.fallback,
          error,
          offline: isNetworkError(error),
          timedOut: false,
        }
      }

      return {
        data:
          result.data ?? options.fallback,
        error: null,
        offline: false,
        timedOut: false,
      }
    } catch (caughtError: unknown) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      const error = toError(
        caughtError,
        `${context} impossible.`
      )

      safeLog(context, error, logError)

      return {
        data: options.fallback,
        error,
        offline: isNetworkError(error),
        timedOut: false,
      }
    }
  },

  async array<T>(
    query:
      | PromiseLike<QueryResult<T[]>>
      | (() => PromiseLike<QueryResult<T[]>>),
    context = "Chargement des données"
  ) {
    return this.execute<T[]>(query, {
      fallback: [],
      context,
      logError: false,
    })
  },

  async nullable<T>(
    query:
      | PromiseLike<QueryResult<T>>
      | (() => PromiseLike<QueryResult<T>>),
    context = "Chargement de la donnée"
  ) {
    return this.execute<T | null>(query, {
      fallback: null,
      context,
      logError: false,
    })
  },

  isNetworkError,
}

export default SafeSupabase