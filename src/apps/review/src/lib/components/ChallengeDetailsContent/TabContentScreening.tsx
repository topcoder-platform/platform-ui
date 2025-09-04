/**
 * Content of screening tab.
 */
import { FC } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { Screening } from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableSubmissionScreening } from '../TableSubmissionScreening'

interface Props {
    screening: Screening[]
    isLoadingScreening: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

export const TabContentScreening: FC<Props> = (props: Props) => {
    // show loading ui when fetching data
    if (props.isLoadingScreening) {
        return <TableLoading />
    }

    // show no record message
    if (!props.screening.length) {
        return <TableNoRecord />
    }

    return (
        <TableSubmissionScreening
            datas={props.screening}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
        />
    )
}

export default TabContentScreening
