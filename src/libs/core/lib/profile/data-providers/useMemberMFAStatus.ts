import useSWR, { SWRResponse } from 'swr'

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

export function useMemberMFAStatus(userId: number): MemberMFAStatus | undefined {
    const { data }: SWRResponse = useSWR(memberModifyMfaURL(userId))

    return data ? data.result.content : undefined
}
