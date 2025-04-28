/**
 * Challenge Details Page.
 */
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useParams, useSearchParams } from 'react-router-dom'
import { kebabCase } from 'lodash'
import classNames from 'classnames'

import {
    useFetchChallengeInfo,
    useFetchChallengeInfoProps,
    useRole,
} from '../../../lib/hooks'
import {
    ChallengeDetailsContent,
    ChallengeLinks,
    ChallengePhaseInfo,
    PageWrapper,
    Tabs,
} from '../../../lib'

import styles from './ChallengeDetailsPage.module.scss'

interface Props {
    className?: string
}

const tabItems = [
    'Registration',
    'Submission / Screening',
    'Review / Appeals',
    'Winners',
]

export const ChallengeDetailsPage: FC<Props> = (props: Props) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const { role }: {role: string} = useRole()
    const params = useParams()
    const {
        challengeInfo,
        registrations,
        submissions,
        projectResults,
        screenings,
    }: useFetchChallengeInfoProps = useFetchChallengeInfo(
        params.challengeId,
        role,
    )
    const [selectedTab, setSelectedTab] = useState(0)
    const reviewers = useMemo(
        () => projectResults[0]?.reviews ?? [],
        [projectResults],
    )
    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: 'Active Reviews',
                path: '/review/active-review-assigments/',
            },
            { index: 2, label: challengeInfo?.name ?? '' },
        ],
        [challengeInfo],
    )

    const switchTab = useCallback((tabId: number) => {
        setSelectedTab(tabId)
        setSearchParams({ tab: kebabCase(tabItems[tabId]) })
    }, [setSearchParams])

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab) {
            const tabId = tabItems.findIndex(item => kebabCase(item) === tab)
            setSelectedTab(tabId)
        }
    }, [searchParams])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            titleUrl='emptyLink'
            breadCrumb={breadCrumb}
        >
            <div className={styles.summary}>
                {challengeInfo && (
                    <ChallengePhaseInfo challengeInfo={challengeInfo} />
                )}
                <ChallengeLinks />
            </div>

            <div className={styles.blockContent}>
                <span className={styles.textTitle}>Phases</span>

                <div className={styles.blockTabsContainer}>
                    <Tabs
                        items={tabItems}
                        selectedIndex={selectedTab}
                        onChange={switchTab}
                        rightContent={
                            selectedTab === 3 ? (
                                <div className={styles.blockReviewers}>
                                    {reviewers.map(item => (
                                        <div
                                            key={item.reviewerHandle}
                                            className={styles.blockReviewer}
                                        >
                                            <strong>Reviewer :</strong>
                                            <NavLink
                                                to='#'
                                                onClick={prevent}
                                                style={{
                                                    color: item.reviewerHandleColor,
                                                }}
                                            >
                                                {item.reviewerHandle}
                                            </NavLink>
                                        </div>
                                    ))}
                                </div>
                            ) : undefined
                        }
                    />
                </div>

                <ChallengeDetailsContent
                    selectedTab={selectedTab}
                    registrations={registrations}
                    submissions={submissions}
                    projectResults={projectResults}
                    screening={screenings}
                />
            </div>
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
