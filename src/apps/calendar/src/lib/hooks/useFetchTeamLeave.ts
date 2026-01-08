import { useCallback, useRef, useState } from 'react'

import { handleError } from '~/libs/shared'

import { TeamLeaveDate } from '../models'
import { fetchTeamLeave } from '../services'
import { getDateKey } from '../utils'

export interface UseFetchTeamLeaveResult {
    teamLeaveDates: TeamLeaveDate[]
    isLoading: boolean
    error: unknown
    loadTeamLeave: (startDate?: Date, endDate?: Date) => Promise<void>
}

const buildRequestKey = (...parts: Array<string | undefined>): string => (
    parts
        .filter(Boolean)
        .join('|')
)

export function useFetchTeamLeave(): UseFetchTeamLeaveResult {
    const [teamLeaveDates, setTeamLeaveDates] = useState<TeamLeaveDate[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<unknown>(undefined)
    const latestLoadRequestRef = useRef<string>('')

    const loadTeamLeave = useCallback(
        async (startDate?: Date, endDate?: Date) => {
            const startKey = startDate ? getDateKey(startDate) : undefined
            const endKey = endDate ? getDateKey(endDate) : undefined
            const requestKey = buildRequestKey(
                startKey,
                endKey,
                Date.now()
                    .toString(),
            )
            latestLoadRequestRef.current = requestKey
            setIsLoading(true)
            setTeamLeaveDates([])
            setError(undefined)

            try {
                const response = await fetchTeamLeave(startKey, endKey)
                if (latestLoadRequestRef.current !== requestKey) {
                    return
                }

                setTeamLeaveDates(response)
            } catch (err) {
                if (latestLoadRequestRef.current === requestKey) {
                    setError(err)
                    handleError(err)
                    throw err
                }
            } finally {
                if (latestLoadRequestRef.current === requestKey) {
                    setIsLoading(false)
                }
            }
        },
        [],
    )

    return {
        error,
        isLoading,
        loadTeamLeave,
        teamLeaveDates,
    }
}
