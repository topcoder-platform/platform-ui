/**
 * Fetch review appeals
 */
import { useCallback, useRef, useState } from 'react'
import { filter } from 'lodash'

import {
    MappingReviewAppeal,
} from '../models'
import { fetchAllAppealsWithReviewIds } from '../services'

export interface useFetchAppealQueueProps {
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    loadResourceAppeal: (
        reviewId: string,
    ) => void
    cancelLoadResourceAppeal: () => void
}

/**
 * Fetch review appeals
 * @returns review appeals
 */
export function useFetchAppealQueue(): useFetchAppealQueueProps {
    const [mappingReviewAppeal, setMappingReviewAppeal]
        = useState<MappingReviewAppeal>({})
    const mappingReviewAppealRef = useRef<MappingReviewAppeal>({})
    const idLoadQueue = useRef<string[]>([])
    const isLoading = useRef<boolean>(false)
    /**
     * Check to fetch datas in queue
     */
    const fetchNextDataInQueue = useCallback(() => {
        if (isLoading.current || !idLoadQueue.current.length) {
            return
        }

        const nextIds = Array.from(new Set(idLoadQueue.current))
            .filter(id => !mappingReviewAppealRef.current[id])
        idLoadQueue.current = []

        if (!nextIds.length) {
            fetchNextDataInQueue()
            return
        }

        isLoading.current = true
        const finish = (): void => {
            isLoading.current = false
            fetchNextDataInQueue()
        }

        const fetchDataFail = (): void => {
            nextIds.forEach(id => {
                mappingReviewAppealRef.current[id] = {
                    finishAppeals: 0,
                    totalAppeals: 0,
                }
            })
            setMappingReviewAppeal({
                ...mappingReviewAppealRef.current,
            })
            finish()
        }

        fetchAllAppealsWithReviewIds(nextIds)
            .then(res => {
                nextIds.forEach(id => {
                    const reviewAppeals = res.filter(item => item.reviewId === id)

                    mappingReviewAppealRef.current[id] = {
                        finishAppeals: filter(reviewAppeals, item => !!item.appealResponse)
                            .length,
                        totalAppeals: reviewAppeals.length,
                    }
                })
                setMappingReviewAppeal({
                    ...mappingReviewAppealRef.current,
                })
                finish()
            })
            .catch(fetchDataFail)
    }, [])

    /**
     * Add new resource id to loading queue
     */
    const loadResourceAppeal = useCallback(
        (
            reviewId: string,
        ) => {
            if (
                reviewId
                && !mappingReviewAppealRef.current[
                    reviewId
                ]
            ) {
                idLoadQueue.current.push(reviewId)
                fetchNextDataInQueue()
            }
        },
        [fetchNextDataInQueue],
    )

    /**
     * Cancel load infos queue
     */
    const cancelLoadResourceAppeal = useCallback(() => {
        idLoadQueue.current = []
    }, [])

    return {
        cancelLoadResourceAppeal,
        loadResourceAppeal,
        mappingReviewAppeal,
    }
}
