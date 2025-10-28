/**
 * Content of post-mortem tab.
 */
import { FC, useContext, useMemo } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContext } from '../../contexts'
import { ChallengeDetailContextModel, SubmissionInfo } from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableIterativeReview } from '../TableIterativeReview'
import { useRole, useRoleProps } from '../../hooks'
import {
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'
import { hasSubmitterPassedThreshold } from '../../utils/reviewScoring'

interface Props {
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    postMortemMinimumPassingScore?: number | null
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
}

export const TabContentPostMortem: FC<Props> = (props: Props) => {
    const {
        challengeInfo,
        myResources = [],
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { actionChallengeRole }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    const isSubmitterView = actionChallengeRole === SUBMITTER
    const sourceRows = isSubmitterView ? props.submitterReviews : props.reviews
    const myMemberIds = useMemo<Set<string>>(
        () => new Set((myResources ?? []).map(resource => resource.memberId)),
        [myResources],
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
    const hasPassedPostMortemThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            sourceRows ?? [],
            myMemberIds,
            props.postMortemMinimumPassingScore,
        ),
        [sourceRows, myMemberIds, props.postMortemMinimumPassingScore],
    )

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (!sourceRows.length) {
        return <TableNoRecord message='No post-mortem yet' />
    }

    return (
        <TableIterativeReview
            datas={sourceRows}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
            columnLabel='Post-Mortem'
            hideSubmissionColumn
            isChallengeCompleted={isChallengeCompleted}
            hasPassedThreshold={hasPassedPostMortemThreshold}
        />
    )
}

export default TabContentPostMortem
