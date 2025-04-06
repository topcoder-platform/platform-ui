/**
 * Challenge Details Content.
 */
import { FC } from 'react'

import { ProjectResult, RegistrationInfo, SubmissionInfo } from '../../models'
import { TableRegistration } from '../TableRegistration'
import { TableNoRecord } from '../TableNoRecord'
import { TableSubmissionScreening } from '../TableSubmissionScreening'
import { TableReviewAppeals } from '../TableReviewAppeals'
import { TableWinners } from '../TableWinners'

interface Props {
    selectedTab: number
    registrations: RegistrationInfo[]
    submissions: SubmissionInfo[]
    projectResults: ProjectResult[]
}

export const ChallengeDetailsContent: FC<Props> = (props: Props) => {
    const selectedTab = props.selectedTab
    const registrations = props.registrations
    const submissions = props.submissions
    const projectResults = props.projectResults
    return (
        <>
            {selectedTab === 0 && registrations.length !== 0 && (
                <TableRegistration datas={registrations} />
            )}
            {((selectedTab === 0 && registrations.length === 0)
                || (selectedTab === 2 && submissions.length === 0)
                || (selectedTab === 3 && projectResults.length === 0)) && (
                <TableNoRecord />
            )}

            {selectedTab === 1 && <TableSubmissionScreening />}
            {selectedTab === 2 && submissions.length !== 0 && (
                <TableReviewAppeals datas={submissions} />
            )}
            {selectedTab === 3 && projectResults.length !== 0 && (
                <TableWinners datas={projectResults} />
            )}
        </>
    )
}

export default ChallengeDetailsContent
