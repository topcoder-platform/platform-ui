import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { diceIDURL } from '~/libs/core'

export interface DiceConnectionStatus {
    accepted: boolean
    connection: string | null
    diceEnabled: boolean
}

export function useDiceIdConnection(userId: number): DiceConnectionStatus | undefined {
    const options: SWRConfiguration = { refreshInterval: 5000 } // pooling interval 5s

    const { data }: SWRResponse
        = useSWR(`${diceIDURL(userId)}/diceConnection`, options)

    return data ? data.result.content : undefined
}
