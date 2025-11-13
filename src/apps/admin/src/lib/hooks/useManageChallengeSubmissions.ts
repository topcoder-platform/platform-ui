/**
 * Manage Challenge Submissions
 */
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { IsRemovingType, MemberSubmission, recalculateSubmissionRank, Submission } from '../models'
import { fetchSubmissionsOfChallenge, removeSubmission } from '../services'
import { handleError } from '../utils'
import { removeReviewSummations } from '../services/reviews.service'

export interface useManageChallengeSubmissionsProps {
    isLoading: boolean
    submissions: Submission[]
    isRemovingSubmission: IsRemovingType
    isRemovingSubmissionBool: boolean
    isRemovingReviewSummations: IsRemovingType
    isRemovingReviewSummationsBool: boolean
    doRemoveSubmission: (item: Submission) => void
    doRemoveReviewSummations: (item: Submission) => void
    showSubmissionHistory: IsRemovingType
    setShowSubmissionHistory: Dispatch<SetStateAction<IsRemovingType>>
}

/**
 * Manage challenge submissions redux state
 * @param challengeId challenge id
 * @returns state data
 */
export function useManageChallengeSubmissions(
    challengeId: string,
): useManageChallengeSubmissionsProps {
    const [isLoading, setIsLoading] = useState(false)
    const [memberSubmissions, setMemberSubmissions] = useState<
        MemberSubmission[]
    >([])
    const [showSubmissionHistory, setShowSubmissionHistory]
        = useState<IsRemovingType>({})

    const submissions = useMemo(() => {
        const results: Submission[] = []
        _.forEach(memberSubmissions, memberSubmission => {
            const theLatestSubmission = memberSubmission.submissions[0]
            results.push({
                ...theLatestSubmission,
                hideToggleHistory: memberSubmission.submissions.length <= 1,
                isTheLatestSubmission: true,
            })

            if (showSubmissionHistory[theLatestSubmission.id]) {
                for (
                    let index = 1;
                    index < memberSubmission.submissions.length;
                    index++
                ) {
                    const submission = memberSubmission.submissions[index]
                    results.push({
                        ...submission,
                        hideToggleHistory: true,
                        isTheLatestSubmission: false,
                    })
                }
            }
        })
        return results
    }, [memberSubmissions, showSubmissionHistory])

    const isLoadingRef = useRef(false)
    const [isRemovingSubmission, setIsRemovingSubmission]
        = useState<IsRemovingType>({})
    const isRemovingSubmissionBool = useMemo(
        () => _.some(isRemovingSubmission, value => value === true),
        [isRemovingSubmission],
    )
    const [isRemovingReviewSummations, setIsRemovingReviewSummations]
        = useState<IsRemovingType>({})
    const isRemovingReviewSummationsBool = useMemo(
        () => _.some(isRemovingReviewSummations, value => value === true),
        [isRemovingReviewSummations],
    )
    useEffect(() => {
        if (isLoadingRef.current) {
            return
        }

        if (challengeId) {
            isLoadingRef.current = true
            setIsLoading(isLoadingRef.current)
            fetchSubmissionsOfChallenge(challengeId)
                .then(result => {
                    isLoadingRef.current = false
                    setIsLoading(isLoadingRef.current)
                    setMemberSubmissions(result)
                })
                .catch(e => {
                    isLoadingRef.current = false
                    setIsLoading(isLoadingRef.current)
                    handleError(e)
                    fail()
                })
        }
    }, [challengeId])

    const doRemoveSubmission = useCallback(
        (item: Submission) => {
            setIsRemovingSubmission(prev => ({
                ...prev,
                [item.id]: true,
            }))

            removeSubmission(item.id)
                .then(() => {
                    toast.success('Submission removed successfully', {
                        toastId: 'Remove submission',
                    })
                    setIsRemovingSubmission(prev => ({
                        ...prev,
                        [item.id]: false,
                    }))
                    setMemberSubmissions(prev => recalculateSubmissionRank(_.map(prev, member => {
                        member.submissions = _.filter(
                            member.submissions,
                            sub => sub.id !== item.id,
                        )
                        return member
                    }))) // remove submission in ui
                })
                .catch(e => {
                    handleError(e)
                    setIsRemovingSubmission(prev => ({
                        ...prev,
                        [item.id]: false,
                    }))
                })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )
    const doRemoveReviewSummations = useCallback(
        (item: Submission) => {
            setIsRemovingReviewSummations(prev => ({
                ...prev,
                [item.id]: true,
            }))

            removeReviewSummations(
                (item.reviewSummation ?? []).map(rS => rS.id),
            )
                .then(() => {
                    toast.success('Review summations removed successfully', {
                        toastId: 'Remove review summations',
                    })
                    setIsRemovingReviewSummations(prev => ({
                        ...prev,
                        [item.id]: false,
                    }))

                    setMemberSubmissions(prev => recalculateSubmissionRank(_.map(prev, member => {
                        member.submissions = _.map(
                            member.submissions,
                            sub => (sub.id === item.id
                                ? { ...sub, reviewSummation: [] }
                                : sub),
                        )
                        return member
                    }))) // remove review summations in ui
                })
                .catch(e => {
                    handleError(e)
                    setIsRemovingReviewSummations(prev => ({
                        ...prev,
                        [item.id]: false,
                    }))
                })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return {
        doRemoveReviewSummations,
        doRemoveSubmission,
        isLoading,
        isRemovingReviewSummations,
        isRemovingReviewSummationsBool,
        isRemovingSubmission,
        isRemovingSubmissionBool,
        setShowSubmissionHistory,
        showSubmissionHistory,
        submissions,
    }
}
