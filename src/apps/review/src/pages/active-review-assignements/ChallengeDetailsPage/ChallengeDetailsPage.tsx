/**
 * Challenge Details Page.
 */
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { kebabCase } from 'lodash'
import classNames from 'classnames'

import { TableLoading } from '~/apps/admin/src/lib'
import { EnvironmentConfig } from '~/config'

import {
    useFetchScreeningReview,
    useFetchScreeningReviewProps,
} from '../../../lib/hooks'
import {
    ChallengeDetailContext,
    ChallengeDetailsContent,
    ChallengeLinks,
    ChallengePhaseInfo,
    PageWrapper,
    Tabs,
} from '../../../lib'
import { fetchTabs } from '../../../lib/services'
import { ChallengeDetailContextModel, SelectOption } from '../../../lib/models'
import { TAB } from '../../../config/index.config'
import { getHandleUrl } from '../../../lib/utils'
import {
    activeReviewAssigmentsRouteId,
    pastReviewAssignmentsRouteId,
    rootRoute,
} from '../../../config/routes.config'

import styles from './ChallengeDetailsPage.module.scss'

interface Props {
    className?: string
}

export const ChallengeDetailsPage: FC<Props> = (props: Props) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()

    // get challenge info from challenge detail context
    const {
        challengeId,
        challengeInfo,
        isLoadingChallengeInfo,
        reviewers,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    // get challenge screening, review data
    const {
        isLoading: isLoadingSubmission,
        review,
        reviewProgress,
        screening,
        mappingReviewAppeal,
    }: useFetchScreeningReviewProps = useFetchScreeningReview()

    const [tabItems, setTabItems] = useState<SelectOption[]>([])
    const [selectedTab, setSelectedTab] = useState<string>('')
    const isPastReviewDetail = useMemo(
        () => location.pathname.includes(`/${pastReviewAssignmentsRouteId}/`),
        [location.pathname],
    )
    const listRouteId = isPastReviewDetail
        ? pastReviewAssignmentsRouteId
        : activeReviewAssigmentsRouteId
    const listLabel = isPastReviewDetail
        ? 'Past Review Assignments'
        : 'Active Reviews'
    const listPath = `${rootRoute}/${listRouteId}/`
    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: listLabel,
                path: listPath,
            },
            ...(isLoadingChallengeInfo
                ? []
                : [{ index: 2, label: challengeInfo?.name ?? '' }]),
        ],
        [
            challengeInfo,
            isLoadingChallengeInfo,
            listLabel,
            listPath,
        ],
    )

    const switchTab = useCallback((tab: string) => {
        setSelectedTab(tab)
        setSearchParams({ tab: kebabCase(tab) })
    }, [setSearchParams])

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tabItems.length) {
            if (tab) {
                const tabId = tabItems.findIndex(item => kebabCase(item.value) === tab)
                if (tabId > -1) {
                    setSelectedTab(tabItems[tabId].value)
                    sessionStorage.setItem(TAB, tabItems[tabId].value)
                }
            } else {
                setSelectedTab(tabItems[0].value)
                sessionStorage.setItem(TAB, tabItems[0].value)
            }
        }
    }, [searchParams, tabItems])

    useEffect(() => {
        if (challengeInfo?.type) {
            fetchTabs(challengeInfo?.type, challengeInfo.reviewLength)
                .then(d => setTabItems(d))
        }
    }, [challengeInfo?.type, challengeInfo?.reviewLength])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            titleUrl={`${EnvironmentConfig.REVIEW.CHALLENGE_PAGE_URL}/${challengeId}`}
            breadCrumb={breadCrumb}
        >
            {isLoadingChallengeInfo ? (
                <TableLoading />
            ) : challengeInfo ? (
                <>
                    <div className={styles.summary}>
                        {challengeInfo && (
                            <ChallengePhaseInfo
                                challengeInfo={challengeInfo}
                                reviewProgress={reviewProgress}
                                variant={isPastReviewDetail ? 'past' : 'active'}
                            />
                        )}
                        <ChallengeLinks />
                    </div>

                    <div className={styles.blockContent}>
                        <span className={styles.textTitle}>Phases</span>

                        <div className={styles.blockTabsContainer}>
                            <Tabs
                                items={tabItems}
                                selected={selectedTab}
                                onChange={switchTab}
                                rightContent={
                                    selectedTab === 'Winners' ? (
                                        <div className={styles.blockReviewers}>
                                            {reviewers.map(item => (
                                                <div
                                                    key={item.id}
                                                    className={
                                                        styles.blockReviewer
                                                    }
                                                >
                                                    <strong>Reviewer :</strong>
                                                    <a
                                                        href={getHandleUrl(item)}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                        style={{
                                                            color: item.handleColor,
                                                        }}
                                                        onClick={function onClick() {
                                                            window.open(
                                                                getHandleUrl(item),
                                                                '_blank',
                                                            )
                                                        }}
                                                    >
                                                        {item.memberHandle}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : undefined
                                }
                            />
                        </div>

                        <ChallengeDetailsContent
                            selectedTab={selectedTab}
                            isLoadingSubmission={isLoadingSubmission}
                            screening={screening}
                            review={review}
                            mappingReviewAppeal={mappingReviewAppeal}
                        />
                    </div>
                </>
            ) : undefined}
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
