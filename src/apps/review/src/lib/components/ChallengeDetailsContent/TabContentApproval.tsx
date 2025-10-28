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
    SUBMITTER,
} from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { hasSubmitterPassedThreshold } from '../../utils/reviewScoring'

interface Props {
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    approvalMinimumPassingScore?: number | null
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

    const isSubmitterOnly = actionChallengeRole === SUBMITTER
        && approverResourceIds.size === 0
    const rawRows = isSubmitterOnly ? props.submitterReviews : props.reviews

    const hasPassedApprovalThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            rawRows ?? [],
            myMemberIds,
            props.approvalMinimumPassingScore,
        ),
        [rawRows, myMemberIds, props.approvalMinimumPassingScore],
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
        () => new Set(
            (challengeInfo?.phases ?? [])
                .filter(p => (p.name || '').toLowerCase() === 'approval')
                .map(p => p.id),
        ),
        [challengeInfo?.phases],
    )
    const approvalRows: SubmissionInfo[] = useMemo(
        () => {
            if (!rawRows.length) {
                return []
            }

            if (approvalPhaseIds.size === 0) {
                return rawRows
            }

            return rawRows.filter(row => {
                const phaseId = row.review?.phaseId
                return phaseId ? approvalPhaseIds.has(phaseId) : false
            })
        },
        [rawRows, approvalPhaseIds],
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
        />
    )
}

export default TabContentApproval
