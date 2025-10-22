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
): Submission[] => {
    const latestSubmissions: Submission[] = []
    memberSubmissions.forEach(memberSubmission => {
        memberSubmission.submissions.forEach(submission => {
            if ((submission as Submission & { isLatest?: boolean }).isLatest === true) {
                latestSubmissions.push(submission)
            }
        })
    })

    return latestSubmissions
}

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

    const isLoadingRef = useRef(false)

    useEffect(() => {
        if (!challengeId) {
            setReviewSummations([])
            setSubmissions([])
            setError(undefined)
            return
        }

        if (isLoadingRef.current) {
            return
        }

        isLoadingRef.current = true
        setIsLoading(true)
        setError(undefined)

        Promise.all([
            fetchReviewSummations(challengeId),
            fetchSubmissionsOfChallenge(challengeId),
        ])
            .then(([summations, memberSubmissions]) => {
                setReviewSummations(summations)
                setSubmissions(getLatestSubmissions(memberSubmissions))
            })
            .catch(err => {
                handleError(err)
                const normalizedError = err instanceof Error
                    ? err
                    : new Error(String(err))
                setError(normalizedError)
                setReviewSummations([])
                setSubmissions([])
            })
            .finally(() => {
                isLoadingRef.current = false
                setIsLoading(false)
            })
    }, [challengeId])

    const provisionalScores = useMemo(
        () => reviewSummations.filter(item => item.isProvisional === true),
        [reviewSummations],
    )

    const finalScoresData = useMemo(
        () => submissions.map(submission => ({
            reviewSummation: reviewSummations.find(
                item => item.isFinal === true
                    && item.submissionId === submission.id,
            ),
            submission,
        })),
        [reviewSummations, submissions],
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
