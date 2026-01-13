/**
 * Content of checkpoint tab.
 */
import { FC, useCallback, useContext, useMemo } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import type { ChallengeDetailContextModel } from '../../models'
import type { useRoleProps } from '../../hooks'
import { Screening } from '../../models'
import { useRole } from '../../hooks'
import { ChallengeDetailContext } from '../../contexts'
import { hasSubmitterPassedThreshold } from '../../utils/reviewScoring'
import TableCheckpointSubmissions from '../TableCheckpointSubmissions/TableCheckpointSubmissions'

interface Props {
    checkpoint: Screening[]
    checkpointReview?: Screening[]
    checkpointScreeningMinimumPassingScore?: number | null
    checkpointReviewMinimumPassingScore?: number | null
    isLoading: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    challengeStatus?: string
    mode?: 'submission' | 'screening' | 'review'
    aiReviewers?: { aiWorkflowId: string }[]
}

export const TabContentCheckpoint: FC<Props> = (props: Props) => {
    const {
        myResources = [],
        challengeInfo,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const {
        checkpointReviewerResourceIds,
        checkpointScreenerResourceIds,
        isPrivilegedRole,
        hasCheckpointScreenerRole,
        hasCheckpointReviewerRole,
    }: useRoleProps = useRole()

    const myMemberIds = useMemo<Set<string>>(
        () => new Set((myResources ?? []).map(resource => resource.memberId)),
        [myResources],
    )

    const derivedChallengeStatus = props.challengeStatus
        ?? challengeInfo?.status
        ?? ''
    const isChallengeCompleted = useMemo(
        () => {
            const normalizedStatus = derivedChallengeStatus.toUpperCase()
            return normalizedStatus === 'COMPLETED'
                || normalizedStatus === 'CANCELLED'
                || normalizedStatus.startsWith('CANCELLED_')
        },
        [derivedChallengeStatus],
    )

    const hasPassedCheckpointScreeningThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            props.checkpoint ?? [],
            myMemberIds,
            props.checkpointScreeningMinimumPassingScore,
        ),
        [props.checkpoint, myMemberIds, props.checkpointScreeningMinimumPassingScore],
    )

    const hasPassedCheckpointReviewThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            props.checkpointReview ?? [],
            myMemberIds,
            props.checkpointReviewMinimumPassingScore,
        ),
        [props.checkpointReview, myMemberIds, props.checkpointReviewMinimumPassingScore],
    )

    const checkpointScreeningOutcome = useMemo(
        () => {
            const passingSubmissionIds = new Set<string>()
            const failingSubmissionIds = new Set<string>()

            props.checkpoint.forEach(entry => {
                if (!entry?.submissionId) {
                    return
                }

                const normalizedResult = (entry.result || '').toUpperCase()
                if (normalizedResult === 'PASS') {
                    passingSubmissionIds.add(`${entry.submissionId}`)
                } else if (normalizedResult === 'NO PASS') {
                    failingSubmissionIds.add(`${entry.submissionId}`)
                }
            })

            return {
                failingSubmissionIds,
                passingSubmissionIds,
            }
        },
        [props.checkpoint],
    )

    const filteredCheckpoint = useMemo<Screening[]>(
        () => {
            const baseRows = props.checkpoint ?? []

            const canSeeAll = isPrivilegedRole || hasCheckpointScreenerRole || hasCheckpointReviewerRole
            if (canSeeAll || (isChallengeCompleted && hasPassedCheckpointScreeningThreshold)) {
                return baseRows
            }

            return baseRows.filter(row => {
                if (row.myReviewResourceId
                    && checkpointScreenerResourceIds.has(row.myReviewResourceId)) {
                    return true
                }

                if (row.memberId && myMemberIds.has(row.memberId)) {
                    return true
                }

                return false
            })
        },
        [
            props.checkpoint,
            isPrivilegedRole,
            isChallengeCompleted,
            hasPassedCheckpointScreeningThreshold,
            checkpointScreenerResourceIds,
            myMemberIds,
        ],
    )

    const filterCheckpointReviewByScreeningResult = useCallback(
        (screening: Screening[]) => screening
            .filter(row => checkpointScreeningOutcome.passingSubmissionIds.has(`${row.submissionId}`)),
        [checkpointScreeningOutcome],
    )

    const filteredCheckpointReview = useMemo<Screening[]>(
        () => {
            const baseRows = filterCheckpointReviewByScreeningResult(props.checkpointReview ?? [])

            if (isPrivilegedRole || (isChallengeCompleted && hasPassedCheckpointReviewThreshold)) {
                return baseRows
            }

            return baseRows.filter(row => {
                if (row.myReviewResourceId
                    && checkpointReviewerResourceIds.has(row.myReviewResourceId)) {
                    return true
                }

                if (row.memberId && myMemberIds.has(row.memberId)) {
                    return true
                }

                return false
            })
        },
        [
            props.checkpointReview,
            isPrivilegedRole,
            isChallengeCompleted,
            hasPassedCheckpointReviewThreshold,
            checkpointReviewerResourceIds,
            myMemberIds,
            checkpointScreeningOutcome,
        ],
    )

    if (props.isLoading) {
        return <TableLoading />
    }

    const mode: 'submission' | 'screening' | 'review' = props.mode ?? 'submission'
    const data = mode === 'review' ? filteredCheckpointReview : filteredCheckpoint

    return (
        <TableCheckpointSubmissions
            datas={data}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mode={mode}
            aiReviewers={props.aiReviewers}
        />
    )
}

export default TabContentCheckpoint
