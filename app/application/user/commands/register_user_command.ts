export class RegisterUserCommand {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly newsletterConsent: boolean = false,
    public readonly termsAccepted: boolean = true
  ) {}

  static create(data: {
    username: string
    email: string
    password: string
    newsletterConsent?: boolean
    termsAccepted?: boolean
  }): RegisterUserCommand {
    return new RegisterUserCommand(
      data.username,
      data.email,
      data.password,
      data.newsletterConsent ?? false,
      data.termsAccepted ?? true
    )
  }
}
