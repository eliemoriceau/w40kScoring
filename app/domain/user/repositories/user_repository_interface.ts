import { User } from '../entities/user.js'
import { UserId } from '../value_objects/user_id.js'
import { Username } from '../value_objects/username.js'
import { EmailAddress } from '../value_objects/email_address.js'

export interface UserRepositoryInterface {
  save(user: User): Promise<void>
  findById(id: UserId): Promise<User | null>
  findByUsername(username: Username): Promise<User | null>
  findByEmail(email: EmailAddress): Promise<User | null>
  exists(id: UserId): Promise<boolean>
  isUsernameUnique(username: Username, excludeId?: UserId): Promise<boolean>
  isEmailUnique(email: EmailAddress, excludeId?: UserId): Promise<boolean>
  nextId(): Promise<UserId>
}
