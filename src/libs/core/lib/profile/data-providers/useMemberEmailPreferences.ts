import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { memberEmailPreferencesURL } from '../profile-functions'
import { UserEmailPreferences } from '../user-email-preference.model'

export interface MemberEmailPreferenceAPI {
    data: UserEmailPreferences | undefined
    mutate: KeyedMutator<any>
}

export function useMemberEmailPreferences(email: string): MemberEmailPreferenceAPI {
    const { data, mutate }: SWRResponse = useSWR(`${memberEmailPreferencesURL()}/${email}`)

    return {
        data,
        mutate,
    }
}
