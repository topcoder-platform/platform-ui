import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import { EnvironmentConfig } from '../../../config'

import { GameBadge } from './game-badge.model'

export interface BadgeDetailPageHandler<T> {
    data?: Readonly<T>
    error?: Readonly<any>
    mutate: KeyedMutator<any>
}

export function useGetGameBadgeDetails(badgeID: string): BadgeDetailPageHandler<GameBadge> {

    const badgeEndpointUrl: URL = new URL(`${EnvironmentConfig.API.V5}/gamification/badges/${badgeID}`)

    const { data, error, mutate }: SWRResponse = useSWR(badgeEndpointUrl.toString())

    return {
        data,
        error,
        mutate,
    }
}
