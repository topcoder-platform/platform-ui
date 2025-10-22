/**
 * Manage Marathon Match data
 */
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    MemberSubmission,
    Submission,
    SubmissionReviewSummation,
} from '../models'
import { fetchReviewSummations } from '../services/reviews.service'
import { fetchSubmissionsOfChallenge } from '../services/submissions.service'
import { handleError } from '../utils'

export interface useManageMarathonMatchProps {
    isLoading: boolean
    reviewSummations: SubmissionReviewSummation[]
    submissions: Submission[]
    provisionalScores: SubmissionReviewSummation[]
    finalScoresData: Array<{
        submission: Submission
        reviewSummation?: SubmissionReviewSummation
    }>
    error: Error | undefined
}

const getLatestSubmissions = (
    memberSubmissions: MemberSubmission[],
): Submission[] => memberSubmissions.reduce<Submission[]>((results, memberSubmission) => {
    if (!memberSubmission?.submissions?.length) {
        return results
    }

    const explicitLatest = memberSubmission.submissions.filter(
        submission => (submission as Submission & { isLatest?: boolean }).isLatest === true,
    )

    if (explicitLatest.length) {
        results.push(...explicitLatest)
        return results
    }

    const [mostRecent] = memberSubmission.submissions
    if (mostRecent) {
        results.push(mostRecent)
    }

    return results
}, [])

/**
 * Manage marathon match state
 * @param challengeId challenge id
 * @returns marathon match data state
 */
export function useManageMarathonMatch(
    challengeId: string,
): useManageMarathonMatchProps {
    const [isLoading, setIsLoading] = useState(false)
    const [reviewSummations, setReviewSummations]
        = useState<SubmissionReviewSummation[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [error, setError] = useState<Error | undefined>()

    const latestChallengeIdRef = useRef<string | undefined>()
    const requestSequenceRef = useRef(0)

    useEffect(() => {
        if (!challengeId) {
            setReviewSummations([])
            setSubmissions([])
            setError(undefined)
            setIsLoading(false)
            latestChallengeIdRef.current = undefined
            return
        }

        latestChallengeIdRef.current = challengeId
        const requestSequence = requestSequenceRef.current + 1
        requestSequenceRef.current = requestSequence
        setIsLoading(true)
        setError(undefined)

        Promise.all([
            fetchReviewSummations(challengeId),
            fetchSubmissionsOfChallenge(challengeId),
        ])
            .then(([summations, memberSubmissions]) => {
                if (requestSequence !== requestSequenceRef.current
                    || latestChallengeIdRef.current !== challengeId) {
                    return
                }

                setReviewSummations(summations)
                setSubmissions(getLatestSubmissions(memberSubmissions))
            })
            .catch(err => {
                if (requestSequence !== requestSequenceRef.current
                    || latestChallengeIdRef.current !== challengeId) {
                    return
                }

                handleError(err)
                const normalizedError = err instanceof Error
                    ? err
                    : new Error(String(err))
                setError(normalizedError)
                setReviewSummations([])
                setSubmissions([])
            })
            .finally(() => {
                if (requestSequence === requestSequenceRef.current) {
                    setIsLoading(false)
                }
            })
    }, [challengeId])

    const provisionalScores = useMemo(
        () => reviewSummations.filter(item => item.isProvisional === true),
        [reviewSummations],
    )

    const finalSummationsMap = useMemo(() => {
        const map = new Map<string, SubmissionReviewSummation>()

        reviewSummations.forEach(item => {
            if (item.isFinal === true && item.submissionId) {
                map.set(item.submissionId, item)
            }
        })

        return map
    }, [reviewSummations])

    const finalScoresData = useMemo(
        () => submissions.map(submission => ({
            reviewSummation: finalSummationsMap.get(submission.id),
            submission,
        })),
        [finalSummationsMap, submissions],
    )

    return {
        error,
        finalScoresData,
        isLoading,
        provisionalScores,
        reviewSummations,
        submissions,
    }
}
