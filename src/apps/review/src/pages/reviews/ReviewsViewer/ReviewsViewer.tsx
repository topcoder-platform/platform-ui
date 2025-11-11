import { FC, useEffect, useMemo } from 'react'

import { NotificationContextType, useNotification } from '~/libs/shared'

import { IconAiReview } from '../../../lib/assets/icons'
import { PageWrapper } from '../../../lib'
import { BreadCrumbData, ReviewsContextModel } from '../../../lib/models'
import { ReviewsSidebar } from '../components/ReviewsSidebar'
import { useReviewsContext } from '../ReviewsContext'

import styles from './ReviewsViewer.module.scss'
import { AiReviewViewer } from '../components/AiReviewViewer'
import { activeReviewAssignmentsRouteId, rootRoute } from '../../../config/routes.config'
import { ReviewViewer } from '../components/ReviewViewer'


const ReviewsViewer: FC = () => {
    const { showBannerNotification, removeNotification }: NotificationContextType = useNotification()
    const { challengeInfo, submissionId, workflowRun }: ReviewsContextModel = useReviewsContext()

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

    useEffect(() => {
        const notification = showBannerNotification({
            icon: <IconAiReview />,
            id: 'ai-review-icon-notification',
            message: `Challenges with this icon indicate that
                one or more AI reviews will be conducted for each member submission.`,
        })
        return () => notification && removeNotification(notification.id)
    }, [showBannerNotification, removeNotification])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={styles.container}
            breadCrumb={breadCrumb}
        >
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
