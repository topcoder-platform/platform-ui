import { omit } from 'lodash'
import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { getProfileUrl } from '../profile-functions'

export function useProfileCompleteness(memberHandle?: string): {
    entries: {[key: string]: boolean},
    isLoading: boolean,
    mutate: KeyedMutator<any>,
    percent: number | undefined,
} {
    const { data, mutate }: SWRResponse = useSWR(`${getProfileUrl(memberHandle ?? '')}/profileCompleteness`, {
        isPaused: () => !memberHandle,
    })

    const percentComplete = data?.data?.percentComplete
    return {
        entries: omit(data?.data ?? {}, 'percentComplete'),
        isLoading: percentComplete === undefined,
        mutate,
        percent: (percentComplete ?? 0) * 100,
    }
}
