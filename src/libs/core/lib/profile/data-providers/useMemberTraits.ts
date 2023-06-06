import useSWR, { SWRResponse } from 'swr'

import { getProfileUrl } from '../profile-functions'
import { UserTraits } from '../user-traits.model'

export function useMemberTraits(handle?: string): UserTraits[] | undefined {
    const { data }: SWRResponse = useSWR(handle ? `${getProfileUrl(handle)}/traits` : undefined)

    return data
}
