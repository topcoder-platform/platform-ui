import { SearchUserInfo } from './SearchUserInfo.model'
import { SelectOption } from './SelectOption.model'

/**
 * Model for add group member form
 */
export type FormAddGroupMembers = {
    userHandles?: SearchUserInfo[]
    groupIds?: SelectOption[]
    membershipType: string
}
