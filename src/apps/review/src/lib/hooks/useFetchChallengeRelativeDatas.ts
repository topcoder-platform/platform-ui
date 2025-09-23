/**
 * Fetch resource
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { find, reduce, toString } from 'lodash'

import { TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'
import { handleError } from '~/libs/shared'

import {
    fetchAllResourceRoles,
    fetchChallengeResouces,
} from '../services/resources.service'
import { BackendResourceRole, BackendSubmission, ChallengeRealtiveInfosMapping } from '../models'
import { fetchSubmissions } from '../services'

export interface useFetchChallengeRelativeDatasProps {
    challengeRelativeInfosMapping: ChallengeRealtiveInfosMapping // from challenge id to list of my role
    isLoadingResourceRoles: boolean
    resourceRoleMapping?: {
        [key: string]: BackendResourceRole
    }
    resourceRoleReviewer?: BackendResourceRole,
    resourceRoleSubmitter?: BackendResourceRole,
    loadChallengeRelativeInfos: (challengeId: string) => void
    cancelLoadChallengeRelativeInfos: () => void
}

/**
 * Fetch resources
 * @returns resources
 */
export function useFetchChallengeRelativeDatas(
    loginUserInfo: TokenModel | undefined,
): useFetchChallengeRelativeDatasProps {
    const [challengeRelativeInfosMapping, setChallengeRelativeInfosMapping]
        = useState<ChallengeRealtiveInfosMapping>({})
    const [isLoadingResourceRoles, setIsLoadingResourceRoles] = useState(false)
    const [resourceRoleMapping, setResourceRoleMapping] = useState<{
        [key: string]: BackendResourceRole
    }>()
    const [resourceRoleSubmitter, setResourceRoleSubmitter] = useState<BackendResourceRole>()
    const [resourceRoleReviewer, setResourceRoleReviewer] = useState<BackendResourceRole>()
    const challengeRelativeInfosMappingRef = useRef<ChallengeRealtiveInfosMapping>({})
    const challengeIdLoadQueue = useRef<string[]>([])
    const isLoadingMyRole = useRef<boolean>(false)

    useOnComponentDidMount(() => {
        setIsLoadingResourceRoles(true)
        // fetch all resource roles on init
        fetchAllResourceRoles()
            .then(results => {
                setResourceRoleSubmitter(find(results.data, {
                    name: 'Submitter',
                }))
                setResourceRoleReviewer(find(results.data, {
                    name: 'Reviewer',
                }))
                setResourceRoleMapping(
                    reduce(
                        results.data,
                        (mappingResult, resourceRole: BackendResourceRole) => ({
                            ...mappingResult,
                            [resourceRole.id]: resourceRole,
                        }),
                        {},
                    ),
                )
                setIsLoadingResourceRoles(false)
            })
            .catch(e => {
                handleError(e)
                setIsLoadingResourceRoles(false)
            })
    })

    /**
     * Check to fetch my roles infos in queue
     */
    const fetchNextMyRoleInfosInQueue = useCallback(() => {
        if (
            isLoadingMyRole.current
            || !challengeIdLoadQueue.current.length
            || !loginUserInfo
            || !resourceRoleReviewer
        ) {
            return
        }

        const nextChallengeId = challengeIdLoadQueue.current[0]
        challengeIdLoadQueue.current = challengeIdLoadQueue.current.slice(1)
        if (challengeRelativeInfosMappingRef.current[nextChallengeId]) {
            fetchNextMyRoleInfosInQueue()
            return
        }

        isLoadingMyRole.current = true
        const finish = (): void => {
            isLoadingMyRole.current = false
            fetchNextMyRoleInfosInQueue()
        }

        const fetchDataFail = (): void => {
            challengeRelativeInfosMappingRef.current[nextChallengeId] = {
                myRoles: challengeRelativeInfosMappingRef.current[nextChallengeId]?.myRoles ?? [],
                // eslint-disable-next-line unicorn/no-null
                reviewProgress: challengeRelativeInfosMappingRef.current[nextChallengeId]?.reviewProgress ?? null,
            }
            setChallengeRelativeInfosMapping({
                ...challengeRelativeInfosMappingRef.current,
            })
            finish()
        }

        // Fetch all member roles for special challenge
        fetchChallengeResouces(nextChallengeId)
            .then(res => {
                const reviewers = res.data.filter(
                    item => item.roleId === resourceRoleReviewer.id,
                )
                const myRoles = res.data.filter(
                    item => item.memberId === toString(loginUserInfo.userId),
                )
                challengeRelativeInfosMappingRef.current[nextChallengeId] = {
                    myRoles,
                }
                setChallengeRelativeInfosMapping({
                    ...challengeRelativeInfosMappingRef.current,
                })
                fetchSubmissions(1, 1000, nextChallengeId)
                    .then(resSubmissions => {
                        const totalExpectedReviews = resSubmissions.length * reviewers.length
                        const totalReviews = reduce(
                            resSubmissions,
                            (reviews: number, submission: BackendSubmission) => {
                                const totalSubmissionReviews = Math.min(submission.review.length, reviewers.length)
                                return reviews + totalSubmissionReviews
                            },
                            0,
                        )
                        // progress = (# of submitted review) / (# of submissions * # of reviewers) * 100%
                        const reviewProgress = totalExpectedReviews ? ((totalReviews / totalExpectedReviews) * 100) : 0
                        challengeRelativeInfosMappingRef.current[nextChallengeId] = {
                            myRoles,
                            reviewProgress,
                        }
                        setChallengeRelativeInfosMapping({
                            ...challengeRelativeInfosMappingRef.current,
                        })
                        finish()
                    })
                    .catch(fetchDataFail)
            })
            .catch(fetchDataFail)
    }, [loginUserInfo, resourceRoleReviewer])

    /**
     * Add new challenge id to loading queue
     */
    const loadChallengeRelativeInfos = useCallback(
        (challengeId: string) => {
            if (challengeId && !challengeRelativeInfosMappingRef.current[challengeId]) {
                challengeIdLoadQueue.current.push(challengeId)
                fetchNextMyRoleInfosInQueue()
            }
        },
        [fetchNextMyRoleInfosInQueue],
    )

    /**
     * Cancel load my role infos queue
     */
    const cancelLoadChallengeRelativeInfos = useCallback(() => {
        challengeIdLoadQueue.current = []
    }, [])

    useEffect(() => {
        fetchNextMyRoleInfosInQueue()
    }, [loginUserInfo, resourceRoleReviewer])

    return {
        cancelLoadChallengeRelativeInfos,
        challengeRelativeInfosMapping,
        isLoadingResourceRoles,
        loadChallengeRelativeInfos,
        resourceRoleMapping,
        resourceRoleReviewer,
        resourceRoleSubmitter,
    }
}
