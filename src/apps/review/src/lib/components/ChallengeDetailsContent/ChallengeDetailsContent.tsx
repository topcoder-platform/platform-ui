/**
 * Challenge Details Content.
 */
import { FC } from 'react'

import {
    ProjectResult,
    RegistrationInfo,
    Screening,
    SubmissionInfo,
} from '../../models'
import { TableRegistration } from '../TableRegistration'
import { TableNoRecord } from '../TableNoRecord'
import { TableSubmissionScreening } from '../TableSubmissionScreening'
import { TableReviewAppeals } from '../TableReviewAppeals'
import { TableWinners } from '../TableWinners'
import { useRole } from '../../hooks'
import { APPROVAL, MOCKHANDLE, REVIEWER, SUBMITTER } from '../../../config/index.config'
import { TableReviewAppealsForSubmitter } from '../TableReviewAppealsForSubmitter'

interface Props {
    selectedTab: string
    type?: string
    registrations: RegistrationInfo[]
    submissions: SubmissionInfo[]
    projectResults: ProjectResult[]
    screening: Screening[]
    firstSubmissions: SubmissionInfo | undefined
}

export const ChallengeDetailsContent: FC<Props> = (props: Props) => {
    const selectedTab = props.selectedTab
    const type = props.type
    const registrations = props.registrations
    const submissions = props.submissions
    const firstSubmissions = props.firstSubmissions
    const projectResults = props.projectResults
    const { role }: { role: string } = useRole()
    const screening
        = role === REVIEWER
            ? props.screening
            : props.screening.filter(s => s.handle === MOCKHANDLE)

    if (
        !registrations.length
        || !submissions.length
        || !projectResults.length
        || !screening.length
    ) {
        return <TableNoRecord />
    }

    return (
        <>
            {selectedTab === 'Registration' ? (
                <TableRegistration datas={registrations} />
            ) : selectedTab === 'Submission / Screening' ? (
                <TableSubmissionScreening datas={screening} />
            ) : selectedTab === 'Winners' ? (
                <TableWinners datas={projectResults} />
            ) : (role !== SUBMITTER || selectedTab === APPROVAL) ? (
                <TableReviewAppeals
                    datas={submissions}
                    tab={selectedTab}
                    type={type}
                    firstSubmissions={firstSubmissions}
                />
            ) : (
                <TableReviewAppealsForSubmitter
                    datas={submissions}
                    tab={selectedTab}
                    type={type}
                    firstSubmissions={firstSubmissions}
                />
            )}
        </>
    )
}

export default ChallengeDetailsContent
