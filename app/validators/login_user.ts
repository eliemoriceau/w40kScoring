import vine from '@vinejs/vine'

/**
 * Validator pour l'authentification utilisateur
 * Supporte à la fois email et username avec détection automatique
 */
export const loginUserValidator = vine.compile(
  vine.object({
    login: vine.string().trim().minLength(3).maxLength(255),

    password: vine.string().minLength(8).maxLength(255),

    rememberMe: vine.boolean().optional(),
  })
)
