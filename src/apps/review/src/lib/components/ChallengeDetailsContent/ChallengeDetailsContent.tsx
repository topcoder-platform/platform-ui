/**
 * Challenge Details Content.
 */
import { FC } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'

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
import { useRole, useRoleProps } from '../../hooks'
import { APPROVAL, MOCKHANDLE, REVIEWER, SUBMITTER } from '../../../config/index.config'
import { TableReviewAppealsForSubmitter } from '../TableReviewAppealsForSubmitter'

interface Props {
    selectedTab: string
    type?: string
    registrations: RegistrationInfo[]
    isLoadingRegistrants: boolean
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
    const { actionChallengeRole }: useRoleProps = useRole()
    const screening
        = actionChallengeRole === REVIEWER
            ? props.screening
            : props.screening.filter(s => s.handle === MOCKHANDLE)

    // show ui for Registration tab
    if (selectedTab === 'Registration') {
        // show loading ui when fetching registrants
        if (props.isLoadingRegistrants) {
            return <TableLoading />
        }

        // show no record message
        if (!registrations.length) {
            return <TableNoRecord />
        }

        // show registrants table
        return <TableRegistration datas={registrations} />
    }

    if (
        !submissions.length
        || !projectResults.length
        || !screening.length
    ) {
        return <TableNoRecord />
    }

    return (
        <>
            {selectedTab === 'Submission / Screening' ? (
                <TableSubmissionScreening datas={screening} />
            ) : selectedTab === 'Winners' ? (
                <TableWinners datas={projectResults} />
            ) : (actionChallengeRole !== SUBMITTER || selectedTab === APPROVAL) ? (
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
