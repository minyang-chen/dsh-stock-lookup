/**
 * Structured envelope returned by every tool.
 * On success: { status: 'ok', data: T }
 * On error:   { status: 'error', error: string }
 */
export interface SuccessEnvelope<T> {
  status: 'ok'
  data: T
}

export interface ErrorEnvelope {
  status: 'error'
  error: string
}

export type ToolEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope

export function success<T>(data: T): SuccessEnvelope<T> {
  return { status: 'ok', data }
}

export function failure(message: string): ErrorEnvelope {
  return { status: 'error', error: message }
}

/**
 * Wraps an async operation, catching any thrown error and converting it to an
 * ErrorEnvelope so the tool never rejects its execute promise.
 */
export async function guard<T>(fn: () => Promise<ToolEnvelope<T>>): Promise<ToolEnvelope<T>> {
  try {
    return await fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return failure(message)
  }
}
