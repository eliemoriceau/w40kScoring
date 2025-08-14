import vine from '@vinejs/vine'

/**
 * Validator pour les paramètres de la liste des parties
 *
 * Valide les paramètres de requête GET /parties pour :
 * - Filtres par status et gameType
 * - Pagination avec limit et cursor
 */
export const partiesListValidator = vine.compile(
  vine.object({
    /**
     * Filtre par statut de la partie
     * Valeurs autorisées : PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
     */
    status: vine.string().in(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),

    /**
     * Filtre par type de jeu
     * Valeurs autorisées : MATCHED_PLAY, NARRATIVE, OPEN_PLAY
     */
    gameType: vine.string().in(['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY']).optional(),

    /**
     * Nombre d'éléments par page
     * Min: 1, Max: 100, Default: 20
     */
    limit: vine.number().min(1).max(100).optional(),

    /**
     * Curseur pour pagination
     * String encodée représentant la position dans les résultats
     */
    cursor: vine.string().optional(),

    /**
     * Tri des résultats
     * Default: 'createdAt' descendant (plus récents en premier)
     */
    sort: vine.string().in(['createdAt', 'updatedAt', 'status', 'gameType']).optional(),

    /**
     * Ordre de tri
     * asc: ascendant, desc: descendant
     */
    order: vine.string().in(['asc', 'desc']).optional(),
  })
)

/**
 * Type inféré du validator pour utilisation TypeScript
 */
export type PartiesListRequest = Infer<typeof partiesListValidator>

// Export du type pour l'utiliser dans d'autres parties du code
type Infer<T> = T extends vine.VineValidator<any, infer U> ? U : never
