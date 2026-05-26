export interface EmployeeIdentity {
  id: string;
  employeeNumber: string;
  displayName: string;
}

/**
 * Extracts the IdP token from the request context or headers.
 * Expects the token in the Authorization header as "Bearer <token>"
 * or from OIDC/OAuth session context.
 */
export function extractIdPToken(headers?: Record<string, string | string[]>): string | null {
  if (!headers) {
    return null;
  }

  const authHeader = headers.authorization;
  if (!authHeader) {
    return null;
  }

  if (Array.isArray(authHeader)) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Extracts employee identity information from IdP token claims.
 * Expects token claims to contain:
 * - sub: unique subject identifier (can be used as id)
 * - employeeNumber: employee identifier (fallback from 'sub' if not present)
 * - displayName or name: employee display name (for UI, redacted in logs)
 */
export function getEmployeeIdentity(tokenClaims: Record<string, unknown>): EmployeeIdentity | null {
  if (!tokenClaims) {
    return null;
  }

  // Extract id from 'sub' claim (standard OIDC claim)
  const id = tokenClaims.sub as string | undefined;
  if (!id) {
    return null;
  }

  // Extract employee number, fallback to sub if not provided
  const employeeNumber = (tokenClaims.employeeNumber as string) || id;

  // Extract display name from 'name' or 'displayName' claim
  const displayName = (tokenClaims.displayName as string) || (tokenClaims.name as string) || 'Unknown';

  return {
    id,
    employeeNumber,
    displayName,
  };
}
