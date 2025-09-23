/**
 * Fetch active review info
 */

import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { forEach } from 'lodash'

import { handleError } from '~/libs/shared'
import {
    useTableFilterBackend,
    useTableFilterBackendProps,
} from '~/apps/admin/src/lib/hooks'

import { ChallengeInfo } from '../models'
import { fetchActiveReviews } from '../services'
import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'

export interface useFetchActiveReviewsProps {
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    activeReviews: ChallengeInfo[]
    isLoading: boolean
    loadActiveReviews: (
        challengeTypeId: string,
        challengeTrackId: string,
        memberId: string,
    ) => void
}

/**
 * Fetch active reviews
 * @param loadChallengeRelativeInfos load my role ids
 * @param cancelLoadChallengeRelativeInfos cancel load my role ids
 * @returns active reviews
 */
export function useFetchActiveReviews(
    loadChallengeRelativeInfos: (challengeId: string) => void,
    cancelLoadChallengeRelativeInfos: () => void,
): useFetchActiveReviewsProps {
    const [totalPages, setTotalPages] = useState<number>(1)
    const [isLoading, setIsLoading] = useState(false)
    const [activeReviews, setActiveReviews] = useState<ChallengeInfo[]>([])

    const {
        page,
        setPage,
        setFilterCriteria,
    }: useTableFilterBackendProps<{
        challengeTypeId?: string
        challengeTrackId?: string
        memberId?: string
    }> = useTableFilterBackend<{
        challengeTypeId?: string
        challengeTrackId?: string
        memberId?: string
    }>((pageRequest, sortRequest, filterCriteria, success, fail) => {
        if (
            filterCriteria?.challengeTypeId !== undefined
            && filterCriteria?.challengeTrackId !== undefined
            && filterCriteria?.memberId !== undefined
        ) {
            setIsLoading(true)
            fetchActiveReviews(
                pageRequest,
                TABLE_PAGINATION_ITEM_PER_PAGE,
                filterCriteria.challengeTypeId,
                filterCriteria.challengeTrackId,
                filterCriteria.memberId,
            )
                .then(results => {
                    setTotalPages(results.totalPages)
                    setActiveReviews(results.data)
                    setIsLoading(false)
                    success()
                })
                .catch(e => {
                    handleError(e)
                    setIsLoading(false)
                    fail()
                })
        } else {
            fail()
        }
    }, {})

    const loadActiveReviews = useCallback(
        (
            challengeTypeId: string,
            challengeTrackId: string,
            memberId: string,
        ) => {
            setFilterCriteria({
                challengeTrackId,
                challengeTypeId,
                memberId,
            })
        },
        [setFilterCriteria],
    )

    useEffect(() => {
        forEach(activeReviews, challengeInfo => {
            loadChallengeRelativeInfos(challengeInfo.id)
        })

        return () => {
            // clear queue of currently loading my role ids after exit ui
            cancelLoadChallengeRelativeInfos()
        }
    }, [activeReviews])

    return {
        activeReviews,
        isLoading,
        loadActiveReviews,
        page,
        setPage,
        totalPages,
    }
}
