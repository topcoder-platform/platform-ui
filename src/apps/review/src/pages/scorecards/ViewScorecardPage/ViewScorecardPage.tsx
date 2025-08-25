import { FC, useContext, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import cn from 'classnames'

import { PencilIcon } from '@heroicons/react/solid'
import { LinkButton } from '~/libs/ui'
import { profileContext, ProfileContextData, UserRole } from '~/libs/core'

import { PageWrapper } from '../../../lib'
import { useFetchScorecard } from '../../../lib/hooks/useFetchScorecard'

import { ScorecardDetails } from './ScorecardDetails'
import { ScorecardGroups } from './ScorecardGroups'
import styles from './ViewScorecardPage.module.scss'

const PencilIconWrapper: FC = () => <PencilIcon />

const ViewScorecardPage: FC = () => {
    const { scorecardId = '' }: { scorecardId?: string } = useParams<{ scorecardId: string }>()
    const { profile }: ProfileContextData = useContext(profileContext)
    const isAdmin = profile?.roles.includes(UserRole.administrator)
    const breadCrumb = useMemo(
        () => (profile && isAdmin) ? [{ index: 1, label: 'Scorecards', path: '/scorecard' }, { index: 2, label: 'Scorecards Details' }] : [],
        [profile, isAdmin],
    )

    const scorecardQuery = useFetchScorecard(scorecardId, true)

    return (
        <PageWrapper
            pageTitle={(scorecardQuery.scorecard && scorecardQuery.scorecard.name) || ''}
            breadCrumb={breadCrumb}
            rightHeader={scorecardQuery.scorecard && isAdmin && (
                <LinkButton
                    iconToLeft
                    icon={PencilIconWrapper}
                    className='borderButton'
                    secondary
                    to='edit'
                >
                    Edit Scorecard
                </LinkButton>
            )}
        >
            {
                scorecardQuery.scorecard && (
                    <div className={styles.container}>
                        <div className={styles.section}>
                            <h3 className={styles.heading}>1. Scorecard Information</h3>
                            <ScorecardDetails scorecard={scorecardQuery.scorecard} />
                        </div>
                        {
                            scorecardQuery.scorecard.scorecardGroups.length > 0 && (
                                <div className={cn(styles.section, styles.evaluationStructureSection)}>
                                    <h3 className={styles.heading}>2. Evaluation Structure</h3>
                                    <ScorecardGroups groups={scorecardQuery.scorecard.scorecardGroups} />
                                </div>
                            )
                        }
                    </div>
                )
            }
        </PageWrapper>
    )
}

export default ViewScorecardPage
