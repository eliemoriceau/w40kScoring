import { PartieFilterDto } from '#application/dto/partie_filter_dto'
import { PartieResponseDto, PartieListResponseDto } from '#application/dto/partie_response_dto'

/**
 * PaginationService
 * Handles cursor-based pagination for Partie listing
 */
export class PaginationService {
  /**
   * Creates cursor from a PartieResponseDto
   * Uses base64 encoding of creation date and id for cursor
   */
  static createCursor(partie: PartieResponseDto): string {
    const cursorData = {
      createdAt: partie.createdAt.toISOString(),
      id: partie.id,
    }
    return Buffer.from(JSON.stringify(cursorData)).toString('base64')
  }

  /**
   * Parses cursor to extract pagination data
   */
  static parseCursor(cursor: string): { createdAt: Date; id: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      return {
        createdAt: new Date(parsed.createdAt),
        id: parsed.id,
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Applies pagination to parties array
   */
  static paginate(parties: PartieResponseDto[], filters: PartieFilterDto): PartieListResponseDto {
    const limit = filters.limit || 20
    let filteredParties = [...parties]

    // Apply cursor-based filtering
    if (filters.cursor) {
      const cursorData = this.parseCursor(filters.cursor)
      if (cursorData) {
        // Filter parties created after cursor date
        filteredParties = filteredParties.filter((partie) => {
          const partieDate = new Date(partie.createdAt)
          return (
            partieDate < cursorData.createdAt ||
            (partieDate.getTime() === cursorData.createdAt.getTime() && partie.id > cursorData.id)
          )
        })
      }
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'DESC'

    filteredParties.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'startedAt':
          aValue = a.startedAt ? new Date(a.startedAt).getTime() : 0
          bValue = b.startedAt ? new Date(b.startedAt).getTime() : 0
          break
        case 'completedAt':
          aValue = a.completedAt ? new Date(a.completedAt).getTime() : 0
          bValue = b.completedAt ? new Date(b.completedAt).getTime() : 0
          break
        case 'pointsLimit':
          aValue = a.pointsLimit
          bValue = b.pointsLimit
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    // Get page of results
    const pageParties = filteredParties.slice(0, limit + 1) // +1 to check if there are more
    const hasMore = pageParties.length > limit

    if (hasMore) {
      pageParties.pop() // Remove the extra item
    }

    // Generate next cursor
    let nextCursor: string | undefined
    if (hasMore && pageParties.length > 0) {
      nextCursor = this.createCursor(pageParties[pageParties.length - 1])
    }

    return {
      parties: pageParties,
      pagination: {
        nextCursor,
        hasMore,
        totalCount: parties.length, // Total before pagination
      },
      filters: {
        applied: filters as Record<string, unknown>,
        available: ['userId', 'status', 'gameType', 'dateFrom', 'dateTo', 'pointsLimit'],
      },
    }
  }
}
