import qs from 'qs'
import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { getProfileUrl } from '../profile-functions'
import { UserTraits } from '../user-traits.model'

export interface MemberTraitsAPI {
    data: UserTraits[] | undefined
    mutate: KeyedMutator<any>
}

export interface MemberTraitsQuery {
    traitIds: string
}

export function useMemberTraits(handle?: string, query?: MemberTraitsQuery): MemberTraitsAPI {
    const { data, mutate }: SWRResponse
        = useSWR(handle ? `${getProfileUrl(handle)}/traits?${qs.stringify(query)}` : undefined)

    return {
        data,
        mutate,
    }
}
