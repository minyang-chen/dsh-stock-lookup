import type { ToolEnvelope } from './errors.ts'

/**
 * Serialize a ToolEnvelope to a compact JSON string.
 * This is the final output format every tool's execute() returns.
 */
export function stringify<T>(envelope: ToolEnvelope<T>): string {
  return JSON.stringify(envelope)
}
