import { useCallback, useRef, useState } from 'react'

import { handleError } from '~/libs/shared'

import { LeaveDate, LeaveUpdateStatus } from '../models'
import { fetchUserLeaveDates, setLeaveDates as setLeaveDatesService } from '../services'
import { getDateKey } from '../utils'

export interface UseFetchLeaveDatesResult {
    leaveDates: LeaveDate[]
    isLoading: boolean
    isUpdating: boolean
    error: unknown
    loadLeaveDates: (startDate?: Date, endDate?: Date) => Promise<void>
    updateLeaveDates: (dates: string[], status: LeaveUpdateStatus) => Promise<void>
}

const buildRequestKey = (...parts: Array<string | undefined>): string =>
    parts.filter(Boolean).join('|')

export function useFetchLeaveDates(): UseFetchLeaveDatesResult {
    const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<unknown>(null)
    const latestLoadRequestRef = useRef<string>('')
    const latestUpdateRequestRef = useRef<string>('')

    const loadLeaveDates = useCallback(
        async (startDate?: Date, endDate?: Date) => {
            const startKey = startDate ? getDateKey(startDate) : undefined
            const endKey = endDate ? getDateKey(endDate) : undefined
            const requestKey = buildRequestKey(startKey, endKey, Date.now().toString())
            latestLoadRequestRef.current = requestKey
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetchUserLeaveDates(startKey, endKey)
                if (latestLoadRequestRef.current !== requestKey) {
                    return
                }
                setLeaveDates(response)
            } catch (error) {
                if (latestLoadRequestRef.current === requestKey) {
                    setError(error)
                    handleError(error)
                    throw error
                }
            } finally {
                if (latestLoadRequestRef.current === requestKey) {
                    setIsLoading(false)
                }
            }
        },
        [],
    )

    const updateLeaveDates = useCallback(
        async (dates: string[], status: LeaveUpdateStatus) => {
            const requestKey = buildRequestKey(status, dates.join(','), Date.now().toString())
            latestUpdateRequestRef.current = requestKey
            setIsUpdating(true)
            setError(null)

            try {
                await setLeaveDatesService(dates, status)
            } catch (error) {
                if (latestUpdateRequestRef.current === requestKey) {
                    setError(error)
                    handleError(error)
                    throw error
                }
            } finally {
                if (latestUpdateRequestRef.current === requestKey) {
                    setIsUpdating(false)
                }
            }
        },
        [],
    )

    return {
        error,
        isLoading,
        isUpdating,
        leaveDates,
        loadLeaveDates,
        updateLeaveDates,
    }
}
