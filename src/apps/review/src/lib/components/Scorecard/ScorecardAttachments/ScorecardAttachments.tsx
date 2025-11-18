import { FC, useCallback, useMemo, useState } from 'react'
import { noop } from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { IconOutline, Table, TableColumn } from '~/libs/ui'
import { useReviewsContext } from '~/apps/review/src/pages/reviews/ReviewsContext'
import { useWindowSize, WindowSize } from '~/libs/shared'

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
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])
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
        [createDownloadHandler, isDownloading],
    )

    const [openRow, setOpenRow] = useState<number | undefined>(undefined)
    const toggleRow = useCallback(
        (id: number) => () => {
            setOpenRow(prev => (prev === id ? undefined : id))
        },
        [],
    )
    const renderMobileRow = (attachment: AiWorkflowRunArtifact): JSX.Element => {
        const isExpired = attachment.expired
        const downloading = isDownloading
        const isOpen = openRow === attachment.id

        return (
            <div key={attachment.id} className={styles.mobileRow}>
                {/* Top collapsed row */}
                <div className={styles.mobileHeader}>
                    <IconOutline.ChevronDownIcon
                        onClick={toggleRow(attachment.id)}
                        className={classNames(styles.chevron, {
                            [styles.open]: isOpen,
                        })}
                        width={20}
                    />
                    <div
                        className={classNames(styles.filenameCell, {
                            [styles.expired]: isExpired,
                            [styles.downloading]: downloading,
                        })}
                        onClick={!isExpired ? createDownloadHandler(attachment.id) : undefined}
                    >
                        {attachment.name}
                    </div>

                </div>

                {/* Expanded content */}
                {isOpen && (
                    <div className={styles.mobileExpanded}>
                        <div className={styles.rowItem}>
                            <span className={styles.rowItemHeading}>Type:</span>
                            <div className={styles.artifactType}>
                                <IconOutline.CubeIcon className={styles.artifactIcon} width={20} />
                                Artifact
                            </div>
                        </div>

                        <div className={styles.rowItem}>
                            <span className={styles.rowItemHeading}>Size:</span>
                            {formatFileSize(attachment.size_in_bytes)}
                        </div>

                        <div className={styles.rowItem}>
                            <span className={styles.rowItemHeading}>Date:</span>
                            {moment(attachment.created_at)
                                .local()
                                .format(TABLE_DATE_FORMAT)}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <TableWrapper
            className={classNames(
                styles.tableWrapper,
                className,
                'enhanced-table',
            )}
        >
            {!artifacts || artifacts.length === 0 ? (
                <div className={styles.noAttachmentText}>No attachments</div>
            ) : isTablet ? (
                <div className={styles.mobileList}>
                    {artifacts.map(renderMobileRow)}
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={artifacts}
                    disableSorting
                    onToggleSort={noop}
                    removeDefaultSort
                />
            )}

        </TableWrapper>
    )

}

export default ScorecardAttachments
