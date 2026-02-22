/**
 * Content of approval tab.
 */
import { FC, useContext, useMemo } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContextModel, SubmissionInfo } from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableIterativeReview } from '../TableIterativeReview'
import { useRole, useRoleProps } from '../../hooks'
import {
    REVIEWER,
} from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { hasSubmitterPassedThreshold } from '../../utils/reviewScoring'

interface Props {
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    approvalMinimumPassingScore?: number | null
    phaseIdFilter?: string
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
}

export const TabContentApproval: FC<Props> = (props: Props) => {
    const {
        challengeInfo,
        myResources = [],
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const {
        actionChallengeRole,
        approverResourceIds,
        isPrivilegedRole,
    }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    const myMemberIds = useMemo<Set<string>>(
        () => new Set((myResources ?? []).map(resource => resource.memberId)),
        [myResources],
    )

    const hasPassedApprovalThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            props.submitterReviews ?? [],
            myMemberIds,
            props.approvalMinimumPassingScore,
        ),
        [props.submitterReviews, myMemberIds, props.approvalMinimumPassingScore],
    )

    const isChallengeCompleted = useMemo(
        () => {
            const normalizedStatus = (challengeInfo?.status ?? '').toUpperCase()
            return normalizedStatus === 'COMPLETED'
                || normalizedStatus === 'CANCELLED'
                || normalizedStatus.startsWith('CANCELLED_')
        },
        [challengeInfo?.status],
    )

    // Only show Approval-phase reviews on the Approval tab
    const approvalPhaseIds = useMemo<Set<string>>(
        () => (challengeInfo?.phases ?? [])
            .reduce((ids, phase) => {
                if ((phase.name || '').toLowerCase() !== 'approval') {
                    return ids
                }

                const id = `${phase.id ?? ''}`.trim()
                const phaseId = `${phase.phaseId ?? ''}`.trim()

                if (id) {
                    ids.add(id)
                }

                if (phaseId) {
                    ids.add(phaseId)
                }

                return ids
            }, new Set<string>()),
        [challengeInfo?.phases],
    )

    const filteredPhaseIds = useMemo<Set<string>>(
        () => {
            const normalizedPhaseId = `${props.phaseIdFilter ?? ''}`.trim()
            if (!normalizedPhaseId) {
                return new Set<string>()
            }

            const matchingPhase = (challengeInfo?.phases ?? []).find(
                phase => phase.id === normalizedPhaseId || phase.phaseId === normalizedPhaseId,
            )

            const identifiers = new Set<string>([normalizedPhaseId])
            const matchingPhaseId = `${matchingPhase?.id ?? ''}`.trim()
            const matchingPhasePhaseId = `${matchingPhase?.phaseId ?? ''}`.trim()

            if (matchingPhaseId) {
                identifiers.add(matchingPhaseId)
            }

            if (matchingPhasePhaseId) {
                identifiers.add(matchingPhasePhaseId)
            }

            return identifiers
        },
        [challengeInfo?.phases, props.phaseIdFilter],
    )

    const approvalRows: SubmissionInfo[] = useMemo(
        () => {
            if (!props.reviews.length) {
                return []
            }

            if (filteredPhaseIds.size) {
                return props.reviews.filter(row => {
                    const phaseId = `${row.review?.phaseId ?? ''}`.trim()
                    return phaseId ? filteredPhaseIds.has(phaseId) : false
                })
            }

            if (approvalPhaseIds.size === 0) {
                return props.reviews
            }

            return props.reviews.filter(row => {
                const phaseId = `${row.review?.phaseId ?? ''}`.trim()
                return phaseId ? approvalPhaseIds.has(phaseId) : false
            })
        },
        [props.reviews, approvalPhaseIds, filteredPhaseIds],
    )

    const filteredApprovalRows = useMemo<SubmissionInfo[]>(
        () => {
            if (isPrivilegedRole || (isChallengeCompleted && hasPassedApprovalThreshold)) {
                return approvalRows
            }

            return approvalRows.filter(row => {
                if (row.review?.resourceId
                    && approverResourceIds.has(row.review.resourceId)) {
                    return true
                }

                if (row.memberId && myMemberIds.has(row.memberId)) {
                    return true
                }

                return false
            })
        },
        [
            approvalRows,
            isPrivilegedRole,
            isChallengeCompleted,
            hasPassedApprovalThreshold,
            approverResourceIds,
            myMemberIds,
        ],
    )

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (!filteredApprovalRows.length) {
        return <TableNoRecord message='No approvals yet' />
    }

    return (
        <TableIterativeReview
            datas={filteredApprovalRows}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
            columnLabel='Approval'
            isChallengeCompleted={isChallengeCompleted}
            hasPassedThreshold={hasPassedApprovalThreshold}
        />
    )
}

export default TabContentApproval
