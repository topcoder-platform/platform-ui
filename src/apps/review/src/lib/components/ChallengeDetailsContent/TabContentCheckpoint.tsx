/**
 * Content of checkpoint tab.
 */
import { FC } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { Screening } from '../../models'
import TableCheckpointSubmissions from '../TableCheckpointSubmissions/TableCheckpointSubmissions'

interface Props {
    checkpoint: Screening[]
    isLoading: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

export const TabContentCheckpoint: FC<Props> = (props: Props) => {
    if (props.isLoading) {
        return <TableLoading />
    }

    return (
        <TableCheckpointSubmissions
            datas={props.checkpoint}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
        />
    )
}

export default TabContentCheckpoint
