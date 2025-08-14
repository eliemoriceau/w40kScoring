import vine from '@vinejs/vine'

export const registerUserValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .minLength(3)
      .maxLength(30)
      .regex(/^[a-zA-Z0-9_-]+$/),

    email: vine.string().email().maxLength(254),

    password: vine.string().minLength(8),

    passwordConfirmation: vine.string().confirmed({ confirmationField: 'password' }),

    newsletterConsent: vine.boolean().optional(),

    termsAccepted: vine.literal(true),
  })
)
