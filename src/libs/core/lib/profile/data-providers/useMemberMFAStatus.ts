import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { memberModifyMfaURL } from '~/libs/core'

export interface MemberMFAStatus {
    createdAt: Date
    createdBy: number
    diceEnabled: boolean
    id: number
    mfaEnabled: boolean
    modifiedAt: Date
    modifiedBy: number
    userId: number
}

export interface UseMemberMFAStatusAPI {
    data: MemberMFAStatus | undefined
    mutate: KeyedMutator<any>
}

export function useMemberMFAStatus(userId: number): UseMemberMFAStatusAPI {
    const { data, mutate }: SWRResponse = useSWR(memberModifyMfaURL(userId))

    return {
        data: data ? data.result.content : undefined,
        mutate,
    }
}
