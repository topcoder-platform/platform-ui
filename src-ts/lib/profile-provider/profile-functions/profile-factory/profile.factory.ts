import { TokenModel } from '../../../functions/token-functions'
import { UserProfile } from '../../user-profile.model'

import { UserRole } from './user-role.enum'

export function create(profile: UserProfile, token: TokenModel): UserProfile {
    // Currently, the "Self-Service Customer" role is being set when a user is created
    // during the self-service workflow. There are no other roles being set to distinguish
    // between Customers and Members.
    // Therefore, the only way to know if a user is a Member is if s/he is not a Customer.
    // This is imperfect, bc a user could be both a Customer or a Member, but for now
    // we are okay with this and will have a more in-depth initiave to properly assign
    // rolees.
    profile.isCustomer = !!token.roles?.some(role => role === UserRole.customer)
    profile.isMember = !profile.isCustomer
    return profile
}
