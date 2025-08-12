/**
 * PartieFilterDto
 * Data Transfer Object for filtering Parties
 * Supports advanced filtering and cursor-based pagination
 */
export interface PartieFilterDto {
  // User filtering
  userId?: number
  opponentId?: number

  // Status filtering
  status?: string[]

  // Game configuration filtering
  gameType?: string
  pointsLimit?: number[]

  // Date range filtering
  dateFrom?: Date
  dateTo?: Date
  createdAfter?: Date
  createdBefore?: Date

  // Pagination
  cursor?: string
  limit?: number

  // Sorting
  sortBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'pointsLimit'
  sortOrder?: 'ASC' | 'DESC'

  // Advanced filters
  hasOpponent?: boolean
  hasMission?: boolean
  withScores?: boolean
}

/**
 * Default values for PartieFilterDto
 */
export const DEFAULT_PARTIE_FILTERS: Partial<PartieFilterDto> = {
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  withScores: false,
}

/**
 * Factory for creating validated PartieFilterDto instances
 */
export class PartieFilterDtoFactory {
  static create(filters: Partial<PartieFilterDto> = {}): PartieFilterDto {
    const normalizedFilters = {
      ...DEFAULT_PARTIE_FILTERS,
      ...filters,
    }

    this.validate(normalizedFilters)

    return normalizedFilters
  }

  private static validate(filters: Partial<PartieFilterDto>): void {
    if (filters.limit && (filters.limit <= 0 || filters.limit > 100)) {
      throw new Error('Limit must be between 1 and 100')
    }

    if (filters.userId && (!Number.isInteger(filters.userId) || filters.userId <= 0)) {
      throw new Error('User ID must be a positive integer')
    }

    if (filters.status && (!Array.isArray(filters.status) || filters.status.length === 0)) {
      throw new Error('Status must be a non-empty array')
    }

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      throw new Error('Date from cannot be after date to')
    }

    if (
      filters.pointsLimit &&
      (!Array.isArray(filters.pointsLimit) || filters.pointsLimit.length === 0)
    ) {
      throw new Error('Points limit must be a non-empty array')
    }
  }
}
