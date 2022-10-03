import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '../../../config'

import { GameBadge } from './game-badge.model'

export interface BadgeDetailPageHandler<T> {
    data?: Readonly<T>
    error?: Readonly<any>
}

export function useGetGameBadgeDetails(badgeID: string): BadgeDetailPageHandler<GameBadge> {

    const badgeEndpointUrl: URL = new URL(`${EnvironmentConfig.API.V5}/gamification/badges/${badgeID}`)

    const { data, error }: SWRResponse = useSWR(badgeEndpointUrl.toString())

    return {
        data,
        error,
    }
}
