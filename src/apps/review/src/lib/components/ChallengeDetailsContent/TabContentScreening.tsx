/**
 * Content of screening tab.
 */
import { FC } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { Screening } from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableSubmissionScreening } from '../TableSubmissionScreening'
import { useRole, useRoleProps } from '../../hooks'
import { REVIEWER } from '../../../config/index.config'

interface Props {
    screening: Screening[]
    isLoadingScreening: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
}

export const TabContentScreening: FC<Props> = (props: Props) => {
    const { actionChallengeRole }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    // show loading ui when fetching data
    if (props.isLoadingScreening) {
        return <TableLoading />
    }

    // show no record message
    if (!props.screening.length) {
        return <TableNoRecord message='No submissions' />
    }

    return (
        <TableSubmissionScreening
            datas={props.screening}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
        />
    )
}

export default TabContentScreening
