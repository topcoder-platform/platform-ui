/**
 * Content of screening tab.
 */
import { FC, useContext, useMemo } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContextModel, Screening } from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { TableNoRecord } from '../TableNoRecord'
import { TableSubmissionScreening } from '../TableSubmissionScreening'
import { useRole, useRoleProps } from '../../hooks'
import { REVIEWER } from '../../../config/index.config'
import { hasSubmitterPassedThreshold } from '../../utils/reviewScoring'

interface Props {
    screening: Screening[]
    screeningMinimumPassingScore?: number | null
    isLoadingScreening: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
    showScreeningColumns?: boolean
    challengeStatus?: string
    aiReviewers?: { aiWorkflowId: string }[]
}

export const TabContentScreening: FC<Props> = (props: Props) => {
    const {
        myResources = [],
        challengeInfo,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const {
        actionChallengeRole,
        isPrivilegedRole,
        hasReviewerRole,
        screenerResourceIds,
        reviewerResourceIds,
    }: useRoleProps = useRole()
    const showScreeningColumns: boolean = props.showScreeningColumns ?? true
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

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

    const hasPassedScreeningThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            props.screening ?? [],
            myMemberIds,
            props.screeningMinimumPassingScore,
        ),
        [props.screening, myMemberIds, props.screeningMinimumPassingScore],
    )

    const filteredScreening = useMemo<Screening[]>(
        () => {
            const baseRows = props.screening ?? []
            // Defensive filtering: exclude any entries that don't belong to Screening phase
            const phaseValidatedRows = baseRows.filter(row => {
                if (!row.reviewId) {
                    return true
                }

                const normalizedPhaseName = row.phaseName
                    ?.toLowerCase()
                    .trim()

                return normalizedPhaseName === 'screening'
            })
            const canSeeAll = isPrivilegedRole || hasReviewerRole

            if (isChallengeCompleted && !canSeeAll && !hasPassedScreeningThreshold) {
                return []
            }

            if (canSeeAll || (isChallengeCompleted && hasPassedScreeningThreshold)) {
                return phaseValidatedRows
            }

            return phaseValidatedRows.filter(row => {
                if (row.myReviewResourceId
                    && (screenerResourceIds.has(row.myReviewResourceId)
                        || reviewerResourceIds.has(row.myReviewResourceId))) {
                    return true
                }

                if (row.memberId && myMemberIds.has(row.memberId)) {
                    return true
                }

                return false
            })
        },
        [
            props.screening,
            isPrivilegedRole,
            hasReviewerRole,
            isChallengeCompleted,
            hasPassedScreeningThreshold,
            screenerResourceIds,
            reviewerResourceIds,
            myMemberIds,
        ],
    )

    // show loading ui when fetching data
    if (props.isLoadingScreening) {
        return <TableLoading />
    }

    // show no record message
    if (!filteredScreening.length) {
        return <TableNoRecord message='No submissions' />
    }

    return (
        <TableSubmissionScreening
            screenings={filteredScreening}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
            showScreeningColumns={showScreeningColumns}
            aiReviewers={props.aiReviewers}
        />
    )
}

export default TabContentScreening
