/**
 * Content of winners tab.
 */
import { FC } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ProjectResult } from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableWinners } from '../TableWinners'

interface Props {
    projectResults: ProjectResult[]
    isLoading: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

export const TabContentWinners: FC<Props> = (props: Props) => {
    // show loading ui when fetching data
    if (props.isLoading) {
        return <TableLoading />
    }

    // show no record message
    if (!props.projectResults.length) {
        return <TableNoRecord />
    }

    return (
        <TableWinners
            datas={props.projectResults}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
        />
    )
}

export default TabContentWinners
