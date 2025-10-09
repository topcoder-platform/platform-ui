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

interface Props {
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
}

export const TabContentApproval: FC<Props> = (props: Props) => {
    const { actionChallengeRole }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    const isSubmitterView = actionChallengeRole === SUBMITTER
    const rawRows = isSubmitterView ? props.submitterReviews : props.reviews

    // Only show Approval-phase reviews on the Approval tab
    const { challengeInfo }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const approvalPhaseIds = useMemo(
        () => new Set(
            (challengeInfo?.phases ?? [])
                .filter(p => (p.name || '').toLowerCase() === 'approval')
                .map(p => p.id),
        ),
        [challengeInfo?.phases],
    )
    const sourceRows = useMemo(
        () => rawRows.filter(r => (r.review?.phaseId ? approvalPhaseIds.has(r.review.phaseId) : false)),
        [rawRows, approvalPhaseIds],
    )

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (!sourceRows.length) {
        return <TableNoRecord message='No approvals yet' />
    }

    return (
        <TableIterativeReview
            datas={sourceRows}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
            columnLabel='Approval'
        />
    )
}

export default TabContentApproval
