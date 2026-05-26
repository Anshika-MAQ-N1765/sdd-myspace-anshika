export interface StructuredLogEntry {
  actor: string;
  action: string;
  entity_id: string;
  timestamp: string; // ISO8601 UTC
  outcome: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}

/**
 * Redacts personally identifiable information from a string.
 * Replaces PII values with "REDACTED".
 */
export function redactPII(value: unknown): unknown {
  if (typeof value === 'string') {
    // Check if the string looks like PII (email, name patterns, etc.)
    // For now, we'll redact common PII patterns
    if (
      value.includes('@') || // Email addresses
      /^[A-Z][a-z]+\s[A-Z][a-z]+/.test(value) // Names like "John Smith"
    ) {
      return 'REDACTED';
    }
  }
  return value;
}

/**
 * Creates a structured log entry with the required fields for audit and observability.
 * All timestamps should be normalized to UTC ISO8601 format.
 *
 * @param actor - Actor identifier (e.g., "employee:123")
 * @param action - Action taken (e.g., "create_leave_request")
 * @param entity_id - Entity identifier (e.g., "lr:456")
 * @param outcome - Result of the action (success or failure)
 * @param metadata - Optional additional context (will be redacted for PII)
 * @returns Structured log entry object
 */
export function createStructuredLog(
  actor: string,
  action: string,
  entity_id: string,
  outcome: 'success' | 'failure',
  metadata?: Record<string, unknown>
): StructuredLogEntry {
  // Redact metadata to remove PII
  const redactedMetadata = metadata
    ? Object.entries(metadata).reduce((acc, [key, value]) => {
        acc[key] = redactPII(value);
        return acc;
      }, {} as Record<string, unknown>)
    : undefined;

  return {
    actor,
    action,
    entity_id,
    timestamp: new Date().toISOString(),
    outcome,
    ...(redactedMetadata && Object.keys(redactedMetadata).length > 0 && { metadata: redactedMetadata }),
  };
}

/**
 * Emits a structured log entry to stdout as JSON.
 * Can be piped to log aggregation systems (e.g., ELK, Datadog, CloudWatch).
 */
export function emitStructuredLog(entry: StructuredLogEntry): void {
  console.log(JSON.stringify(entry));
}
