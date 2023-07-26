import useSWR, { SWRResponse } from 'swr'

import { getProfileUrl } from '../profile-functions'

export function useProfileCompleteness(memberHandle?: string): number | undefined {
    const { data }: SWRResponse = useSWR(`${getProfileUrl(memberHandle ?? '')}/profileCompleteness`, {
        isPaused: () => !memberHandle,
    })

    const percentComplete = data?.data?.percentComplete
    return percentComplete === undefined ? percentComplete : (percentComplete ?? 0) * 100
}
