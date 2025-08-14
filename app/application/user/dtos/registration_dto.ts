export interface RegistrationDTO {
  username: string
  email: string
  password: string
  passwordConfirmation: string
  newsletterConsent: boolean
  termsAccepted: boolean
}

export interface UserRegistrationResult {
  userId: number
  username: string
  email: string
  success: boolean
  message?: string
}
