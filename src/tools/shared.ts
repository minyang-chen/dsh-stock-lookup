/** Shared constants and tiny helpers used by both tools. */

export const TOOL_TIMEOUT_MS = 20_000

/** Every tool serializes its result to a JSON string rendered as text. */
export function jsonOutput() {
  return {
    schema: { type: 'string' as const },
    render: (_args: unknown, value: string) => [{ type: 'text' as const, text: value }],
  }
}

/** Pass through only finite numbers. */
export function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Pass through only non-empty strings. */
export function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Round a number to `digits` decimal places; drop non-finite values. */
export function round(value: unknown, digits = 4): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** Normalize a Date, epoch-seconds number, or ISO string to an ISO string. */
export function isoDate(value: unknown): string | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value < 1e11 ? value * 1000 : value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  if (typeof value === 'string' && value.length > 0) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  return undefined
}

/** Drop `undefined` entries so the model never sees empty keys. */
export function compact<T extends Record<string, unknown>>(record: T): Partial<T> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) result[key] = value
  }
  return result as Partial<T>
}
