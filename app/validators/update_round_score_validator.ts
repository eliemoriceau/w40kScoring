import vine from '@vinejs/vine'

/**
 * Validator pour la mise à jour des scores d'un round
 *
 * Valide les données reçues via PUT /parties/:gameId/rounds/:roundId/score
 */
export const updateRoundScoreValidator = vine.compile(
  vine.object({
    /**
     * ID du joueur qui effectue la modification
     * Doit être un nombre entier positif
     */
    playerId: vine.number().positive().withoutDecimals(),

    /**
     * Nouveau score à attribuer
     * Doit être entre 0 et 50 (limites des scores primaires W40k)
     */
    score: vine.number().min(0).max(50).withoutDecimals(),
  })
)

/**
 * Messages d'erreur personnalisés en français
 */
export const updateRoundScoreMessages = {
  'playerId.required': "L'ID du joueur est requis",
  'playerId.number': "L'ID du joueur doit être un nombre",
  'playerId.positive': "L'ID du joueur doit être positif",
  'playerId.withoutDecimals': "L'ID du joueur doit être un entier",
  'score.required': 'Le score est requis',
  'score.number': 'Le score doit être un nombre',
  'score.min': 'Le score doit être au minimum 0',
  'score.max': 'Le score doit être au maximum 50',
  'score.withoutDecimals': 'Le score doit être un entier',
}
