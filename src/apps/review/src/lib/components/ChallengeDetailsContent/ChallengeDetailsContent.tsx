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
import { MOCKHANDLE, REVIEWER } from '../../../config/index.config'
import { TableReviewAppealsForSubmitter } from '../TableReviewAppealsForSubmitter'

interface Props {
    selectedTab: number
    registrations: RegistrationInfo[]
    submissions: SubmissionInfo[]
    projectResults: ProjectResult[]
    screening: Screening[]
}

export const ChallengeDetailsContent: FC<Props> = (props: Props) => {
    const selectedTab = props.selectedTab
    const registrations = props.registrations
    const submissions = props.submissions
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
            {selectedTab === 0 ? (
                <TableRegistration datas={registrations} />
            ) : selectedTab === 1 ? (
                <TableSubmissionScreening datas={screening} />
            ) : selectedTab === 2 ? (
                role === REVIEWER ? (
                    <TableReviewAppeals datas={submissions} />
                ) : (
                    <TableReviewAppealsForSubmitter datas={submissions} />
                )
            ) : (
                <TableWinners datas={projectResults} />
            )}
        </>
    )
}

export default ChallengeDetailsContent
