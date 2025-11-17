import { FC, useCallback, useMemo } from 'react'
import { noop } from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { IconOutline, Table, TableColumn } from '~/libs/ui'
import { useReviewsContext } from '~/apps/review/src/pages/reviews/ReviewsContext'

import { AiWorkflowRunArtifact,
    AiWorkflowRunArtifactDownloadResponse,
    AiWorkflowRunAttachmentsResponse,
    useDownloadAiWorkflowsRunArtifact, useFetchAiWorkflowsRunAttachments } from '../../../hooks'
import { TableWrapper } from '../../TableWrapper'
import { TABLE_DATE_FORMAT } from '../../../constants'
import { formatFileSize } from '../../common'
import { ReviewsContextModel } from '../../../models'

import styles from './ScorecardAttachments.module.scss'

interface ScorecardAttachmentsProps {
    className?: string
}

const ScorecardAttachments: FC<ScorecardAttachmentsProps> = (props: ScorecardAttachmentsProps) => {
    const className = props.className
    // const { width: screenWidth }: WindowSize = useWindowSize()
    // const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])
    const { workflowId, workflowRun }: ReviewsContextModel = useReviewsContext()
    const { artifacts }: AiWorkflowRunAttachmentsResponse
    = useFetchAiWorkflowsRunAttachments(workflowId, workflowRun?.id)
    const { download, isDownloading }: AiWorkflowRunArtifactDownloadResponse = useDownloadAiWorkflowsRunArtifact(
        workflowId,
        workflowRun?.id,
    )

    const handleDownload = useCallback(
        async (artifactId: number): Promise<void> => {
            await download(artifactId)
        },
        [download],
    )

    const createDownloadHandler = useCallback(
        (id: number) => () => handleDownload(id),
        [handleDownload],
    )

    const columns = useMemo<TableColumn<AiWorkflowRunArtifact>[]>(
        () => [
            {
                className: classNames(styles.tableCell),
                label: 'Filename',
                propertyName: 'name',
                renderer: (attachment: AiWorkflowRunArtifact) => {
                    const isExpired = attachment.expired

                    return (
                        <div
                            className={classNames(
                                styles.filenameCell,
                                {
                                    [styles.expired]: isExpired,
                                    [styles.downloading]: isDownloading && !isExpired,
                                },
                            )}
                            onClick={!isExpired ? createDownloadHandler(attachment.id) : undefined}
                        >
                            <span>{attachment.name}</span>
                            {isExpired && <span>(Link Expired)</span>}
                        </div>
                    )
                },
                type: 'element',
            },
            {
                className: classNames(styles.tableCell),
                label: 'Type',
                renderer: () => (
                    <div className={styles.artifactType}>
                        <IconOutline.CubeIcon className={styles.artifactIcon} width={26} />
                        <span>Artifact</span>
                    </div>
                ),
                type: 'element',
            },
            {
                className: classNames(styles.tableCell),
                label: 'Size',
                propertyName: 'sizeInBytes',
                renderer: (attachment: AiWorkflowRunArtifact) => (
                    <div>{formatFileSize(attachment.size_in_bytes)}</div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Attached Date',
                renderer: (attachment: AiWorkflowRunArtifact) => (
                    <span className='last-element'>
                        {moment(attachment.created_at)
                            .local()
                            .format(TABLE_DATE_FORMAT)}
                    </span>
                ),
                type: 'element',
            },
        ],
        [],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {artifacts ? (
                <Table
                    columns={columns}
                    data={artifacts}
                    disableSorting
                    onToggleSort={noop}
                    removeDefaultSort
                    className='enhanced-table-desktop'
                />
            ) : (
                <div>No attachments</div>
            )}

        </TableWrapper>
    )

}

export default ScorecardAttachments
