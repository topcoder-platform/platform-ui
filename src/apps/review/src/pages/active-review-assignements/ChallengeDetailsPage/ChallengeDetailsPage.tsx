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
import { fetchTabs } from '../../../lib/services'
import { SelectOption } from '../../../lib/models'
import { TAB } from '../../../config/index.config'

import styles from './ChallengeDetailsPage.module.scss'

interface Props {
    className?: string
}

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
        firstSubmissions,
    }: useFetchChallengeInfoProps = useFetchChallengeInfo(
        params.challengeId,
        role,
    )
    const [tabItems, setTabItems] = useState<SelectOption[]>([])
    const [selectedTab, setSelectedTab] = useState<string>('')
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
                        selected={selectedTab}
                        onChange={switchTab}
                        rightContent={
                            selectedTab === 'Winners' ? (
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
                    type={challengeInfo?.type}
                    selectedTab={selectedTab}
                    registrations={registrations}
                    submissions={submissions}
                    projectResults={projectResults}
                    screening={screenings}
                    firstSubmissions={firstSubmissions}
                />
            </div>
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
