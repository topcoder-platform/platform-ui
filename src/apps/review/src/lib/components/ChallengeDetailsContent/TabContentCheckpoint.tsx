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
    checkpointReview?: Screening[]
    isLoading: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    selectedTab?: string
}

export const TabContentCheckpoint: FC<Props> = (props: Props) => {
    if (props.isLoading) {
        return <TableLoading />
    }

    const tab = (props.selectedTab || '').toLowerCase()
    const isScreening = tab === 'checkpoint screening' || tab.startsWith('checkpoint screening ')
    const isReview = tab === 'checkpoint review' || tab.startsWith('checkpoint review ')
    const mode: 'submission' | 'screening' | 'review' = isReview ? 'review' : (isScreening ? 'screening' : 'submission')
    const data = isReview ? (props.checkpointReview ?? []) : props.checkpoint

    return (
        <TableCheckpointSubmissions
            datas={data}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mode={mode}
        />
    )
}

export default TabContentCheckpoint
