import { FC, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'

import { ChallengeScopedErrorState, PageWrapper } from '../../../lib'
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
        hasChallengeScopedFetchError,
        retryChallengeScopedFetches,
    }: ReviewsContextModel = useReviewsContext()

    const location = useLocation()
    const containsPastChallenges = location.pathname.indexOf('/past-challenges/')

    const breadCrumb = useMemo<BreadCrumbData[]>(() => {
        const items: BreadCrumbData[] = [{
            index: 1,
            label: 'Active Challenges',
            path: `${rootRoute}/${activeReviewAssignmentsRouteId}/`,
        }]

        if (!hasChallengeScopedFetchError && challengeInfo) {
            items.push({
                fallback: './../../../../challenge-details',
                index: 2,
                label: challengeInfo.name,
                path: containsPastChallenges > -1
                    ? `${rootRoute}/past-challenges/${challengeInfo.id}/challenge-details`
                    : `${rootRoute}/active-challenges/${challengeInfo.id}/challenge-details`,
            })
        }

        items.push({
            index: 3,
            label: `Review Scorecard - ${submissionId}`,
        })

        return items
    }, [
        challengeInfo,
        containsPastChallenges,
        hasChallengeScopedFetchError,
        submissionId,
    ])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={styles.container}
            breadCrumb={breadCrumb}
            titleUrl={challengeInfo && !hasChallengeScopedFetchError
                ? `${EnvironmentConfig.REVIEW.CHALLENGE_PAGE_URL}/${challengeInfo.id}`
                : undefined}
            rightHeader={hasChallengeScopedFetchError ? undefined : actionButtons}
        >
            {hasChallengeScopedFetchError ? (
                <ChallengeScopedErrorState onRetry={retryChallengeScopedFetches} />
            ) : (
                <>
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
                </>
            )}
        </PageWrapper>
    )
}

export default ReviewsViewer
