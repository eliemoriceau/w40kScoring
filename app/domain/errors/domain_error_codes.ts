/**
 * Domain Error Codes
 * Centralized catalog of all domain error codes
 * Following DDD ubiquitous language principles
 */
export const DomainErrorCodes = {
  PSEUDO_ALREADY_TAKEN: 'PSEUDO_ALREADY_TAKEN',
  PARTIE_NOT_FOUND: 'PARTIE_NOT_FOUND',
  UNAUTHORIZED_PARTIE_ACCESS: 'UNAUTHORIZED_PARTIE_ACCESS',
  INVALID_PARTIE_ID: 'INVALID_PARTIE_ID',
  INVALID_USER_ID: 'INVALID_USER_ID',
} as const

export type DomainErrorCode = (typeof DomainErrorCodes)[keyof typeof DomainErrorCodes]
