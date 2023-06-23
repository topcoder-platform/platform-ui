import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { getProfileUrl } from '../profile-functions'
import { UserTraits } from '../user-traits.model'

export interface MemberTraitsAPI {
    data: UserTraits[] | undefined
    mutate: KeyedMutator<any>
}

export function useMemberTraits(handle?: string): MemberTraitsAPI {
    const { data, mutate }: SWRResponse = useSWR(handle ? `${getProfileUrl(handle)}/traits` : undefined)

    return {
        data,
        mutate,
    }
}
