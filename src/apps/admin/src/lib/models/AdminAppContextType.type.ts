import { SearchUserInfo } from './SearchUserInfo.model'
import { SelectOption } from './SelectOption.model'

export type UserIdType = number | string
export type UserMappingType = { [userId: UserIdType]: string }
export type AdminAppContextType = {
    usersMapping: UserMappingType // from user id to user handle
    loadUser: (userId: UserIdType) => void
    cancelLoadUser: () => void
    setUserFromSearch: (userHandles: SearchUserInfo[]) => void
    setGroupFromSearch: (userHandles: SelectOption[]) => void
    groupsMapping: UserMappingType // from group id to group name
    loadGroup: (groupId: UserIdType) => void
    cancelLoadGroup: () => void
}
