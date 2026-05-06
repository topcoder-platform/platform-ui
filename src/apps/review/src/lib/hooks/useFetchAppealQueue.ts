/**
 * Fetch review appeals
 */
import { useCallback, useRef, useState } from 'react'
import { filter } from 'lodash'

import {
    MappingReviewAppeal,
} from '../models'
import { fetchAppealsWithReviewId } from '../services'

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

        const nextId = idLoadQueue.current[0]
        idLoadQueue.current = idLoadQueue.current.slice(1)
        if (mappingReviewAppealRef.current[nextId]) {
            fetchNextDataInQueue()
            return
        }

        isLoading.current = true
        const finish = (): void => {
            isLoading.current = false
            fetchNextDataInQueue()
        }

        const fetchDataFail = (): void => {
            mappingReviewAppealRef.current[nextId] = {
                finishAppeals: 0,
                totalAppeals: 0,
            }
            setMappingReviewAppeal({
                ...mappingReviewAppealRef.current,
            })
            finish()
        }

        // Fetch appeal datas
        fetchAppealsWithReviewId(1, 100, nextId)
            .then(res => {
                mappingReviewAppealRef.current[nextId] = {
                    finishAppeals: filter(res, item => !!item.appealResponse)
                        .length,
                    totalAppeals: res.length,
                }
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
