import { FC, useContext, useMemo } from 'react'
import { PencilIcon } from '@heroicons/react/solid'
import { useParams } from 'react-router-dom'
import cn from 'classnames'

import { Button } from '~/libs/ui'

import { profileContext, ProfileContextData, UserRole } from '~/libs/core'
import { PageWrapper } from '../../../lib'
import { useFetchScorecard } from '../../../lib/hooks/useFetchScorecard'
import { ScorecardDetails } from './ScorecardDetails'

import { ScorecardGroups } from './ScorecardGroups'
import styles from './ViewScorecardPage.module.scss'

const ViewScorecardPage: FC = () => {
    const { scorecardId } = useParams()
    const { profile }: ProfileContextData = useContext(profileContext)
    const isAdmin = profile?.roles.includes(UserRole.administrator)
    console.log(profile, 'profile')
    // const admin = isAdmin
    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'Scorecards', path: '/review/scorecard' }, { index: 2, label: 'Scorecards Details' }],
        [],
    )

    const scorecard = useFetchScorecard({ id: scorecardId as string })
    console.log(scorecard, 'scorecard')
    return (
        <PageWrapper
            pageTitle='Software General Review Scorecard'
            breadCrumb={breadCrumb}
            rightHeader={isAdmin && <Button iconToLeft icon={() => <PencilIcon />} className='borderButton' secondary>Edit Scorecard</Button>}
        >
            {
                scorecard && (
                    <div className={styles.container}>
                        <div className={styles.section}>
                            <h3 className={styles.heading}>1. Scorecard Information</h3>
                            {scorecard && <ScorecardDetails scorecard={scorecard} />}
                        </div>
                        {
                            scorecard.scorecardGroups.length > 0 && (
                                <div className={cn(styles.section, styles.evaluationStructureSection)}>
                                    <h3 className={styles.heading}>2. Evaluation Structure</h3>
                                    <ScorecardGroups groups={scorecard.scorecardGroups} />
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
