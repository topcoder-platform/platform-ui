import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { diceIDURL } from '~/libs/core'

export interface DiceConnectionStatus {
    accepted: boolean
    connection: string
    createdAt: Date
    id: number
}

export function useDiceIdConnection(userId: number, connectionId?: number): DiceConnectionStatus | undefined {
    const options: SWRConfiguration = {}

    if (connectionId) {
        options.refreshInterval = 5000 // pooling interval 5s if connection is active
    }

    const { data }: SWRResponse
        = useSWR(`${diceIDURL(userId)}/diceConnection${connectionId ? `/${connectionId}` : ''}`, options)

    return data ? data.result.content : undefined
}
