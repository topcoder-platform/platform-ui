import { FC, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'

import { PageWrapper } from '../../../lib'
import { BreadCrumbData, ReviewsContextModel } from '../../../lib/models'
import { ReviewsSidebar } from '../components/ReviewsSidebar'
import { useReviewsContext } from '../ReviewsContext'
import { AiReviewViewer } from '../components/AiReviewViewer'
import { activeReviewAssignmentsRouteId, rootRoute } from '../../../config/routes.config'
import { ReviewViewer } from '../components/ReviewViewer'
import { SubmissionBarInfo } from '../../../lib/components/SubmissionBarInfo'

import styles from './ReviewsViewer.module.scss'

const ReviewsViewer: FC = () => {
    const {
        challengeInfo,
        submissionId,
        workflowRun,
        actionButtons,
        submissionInfo,
    }: ReviewsContextModel = useReviewsContext()

    const location = useLocation()
    const containsPastChallenges = location.pathname.indexOf('/past-challenges/')

    const breadCrumb = useMemo<BreadCrumbData[]>(() => [
        {
            index: 1,
            label: 'Active Challenges',
            path: `${rootRoute}/${activeReviewAssignmentsRouteId}/`,
        },
        {
            fallback: './../../../../challenge-details',
            index: 2,
            label: challengeInfo?.name,
            path: containsPastChallenges > -1
                ? `${rootRoute}/past-challenges/${challengeInfo?.id}/challenge-details`
                : `${rootRoute}/active-challenges/${challengeInfo?.id}/challenge-details`,
        },
        {
            index: 3,
            label: `Review Scorecard - ${submissionId}`,
        },
    ], [challengeInfo?.name, challengeInfo?.id, submissionId, containsPastChallenges])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={styles.container}
            breadCrumb={breadCrumb}
            titleUrl={`${EnvironmentConfig.REVIEW.CHALLENGE_PAGE_URL}/${challengeInfo?.id}`}
            rightHeader={actionButtons}
        >
            <div className={styles.subHeader}>
                <SubmissionBarInfo submission={submissionInfo} />
            </div>
            <div className={styles.pageContentWrap}>
                <ReviewsSidebar className={styles.sidebar} />
                <div className={styles.contentWrap}>
                    {!!workflowRun && <AiReviewViewer />}
                    {!workflowRun && <ReviewViewer />}
                </div>
            </div>
        </PageWrapper>
    )
}

export default ReviewsViewer
