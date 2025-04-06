/**
 * Challenge Details Page.
 */
import { FC, useMemo, useState } from 'react'
import classNames from 'classnames'

import {
    useFetchChallengeInfo,
    useFetchChallengeInfoProps,
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
    const {
        challengeInfo,
        registrations,
        submissions,
        projectResults,
    }: useFetchChallengeInfoProps = useFetchChallengeInfo()
    const [selectedTab, setSelectedTab] = useState(0)
    const reviewers = useMemo(
        () => projectResults[0]?.reviews ?? [],
        [projectResults],
    )

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            backUrl='./../../'
            rightHeader={<ChallengeLinks />}
            titleUrl='emptyLink'
        >
            {challengeInfo && (
                <ChallengePhaseInfo challengeInfo={challengeInfo} />
            )}

            <div className={styles.blockContent}>
                <span className={styles.textTitle}>Phases</span>

                <div className={styles.blockTabsContainer}>
                    <Tabs
                        items={tabItems}
                        selectedIndex={selectedTab}
                        onChange={setSelectedTab}
                        rightContent={
                            selectedTab === 3 ? (
                                <div className={styles.blockReviewers}>
                                    {reviewers.map(item => (
                                        <div
                                            key={item.reviewerHandle}
                                            className={styles.blockReviewer}
                                        >
                                            <strong>Reviewer:</strong>
                                            <span
                                                style={{
                                                    color: item.reviewerHandleColor,
                                                }}
                                            >
                                                {item.reviewerHandle}
                                            </span>
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
                />
            </div>
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
