import { FC, useCallback, useMemo, useState } from 'react'
import moment from 'moment'

import {
    Button,
    IconOutline,
    Table,
    TableColumn,
    Tooltip,
} from '~/libs/ui'

import {
    type ChallengeInfo,
    downloadSubmissionArtifact,
    fetchSubmissionArtifacts,
    type SubmissionInfo,
} from '../../../../lib'
import { DownloadArtifactsModal } from '../DownloadArtifactsModal'
import { ScreeningDetails } from '../ScreeningDetails'
import { type WorkflowRun, WorkflowRuns } from '../WorkflowRuns'

import styles from './SubmissionsTable.module.scss'

const TERMINAL_STATUSES = [
    'COMPLETED',
    'FAILURE',
    'CANCELLED',
    'SUCCESS',
]

interface ScreeningWarning {
    brief?: string
    details?: string
}

interface ScreeningData {
    status?: string
    warnings?: ScreeningWarning[]
}

type WorkflowRunsData = WorkflowRun[] | Record<string, WorkflowRun>

interface SubmissionWithDetails extends SubmissionInfo {
    review?: Record<string, unknown> & {
        workflowRuns?: WorkflowRunsData
    }
    screening?: ScreeningData
    workflowRuns?: WorkflowRunsData
}

interface SubmissionsTableProps {
    challenge: ChallengeInfo
    isDesign: boolean
    onDelete: (submissionId: string) => void
    submissionPhaseStartDate?: string
    submissions: SubmissionInfo[]
}

function getWorkflowRuns(
    submission: SubmissionWithDetails,
): WorkflowRunsData | undefined {
    if (submission.workflowRuns) {
        return submission.workflowRuns
    }

    return submission.review?.workflowRuns
}

function isWorkflowRunTerminal(
    submission: SubmissionWithDetails,
): boolean {
    const runs = getWorkflowRuns(submission)

    if (!runs) {
        return true
    }

    const runValues = Array.isArray(runs)
        ? runs
        : Object.values(runs)

    if (!runValues.length) {
        return true
    }

    return runValues.every(run => TERMINAL_STATUSES.includes((run.status || '').toUpperCase()))
}

function canDeleteSubmission(
    submission: SubmissionWithDetails,
    submissionPhaseStartDate?: string,
): boolean {
    if (!submissionPhaseStartDate) {
        return true
    }

    return moment(submission.created)
        .isAfter(submissionPhaseStartDate)
}

function downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)
}

function getScreeningLabel(screening: ScreeningData | undefined): string {
    if (!screening?.status) {
        return 'Pending'
    }

    const status = screening.status.toLowerCase()

    if (status === 'passed') {
        return screening.warnings?.length
            ? 'Passed w/Warnings'
            : 'Passed'
    }

    if (status === 'failed') {
        return screening.warnings?.length
            ? 'Failed w/Warnings'
            : 'Failed'
    }

    if (status === 'pending') {
        return 'Pending'
    }

    return screening.status
}

interface SubmissionActionButtonsProps {
    deleteDisabled: boolean
    isDesign: boolean
    onDelete: (submissionId: string) => void
    onDownload: (submission: SubmissionWithDetails) => void
    onOpenArtifacts: (submissionId: string) => void
    onToggleDetails: (submissionId: string) => void
    showDetails: boolean
    submission: SubmissionWithDetails
}

const SubmissionActionButtons: FC<SubmissionActionButtonsProps>
    = (props: SubmissionActionButtonsProps) => {
        const handleDeleteClick = useCallback((): void => {
            props.onDelete(props.submission.id)
        }, [props])

        const handleDownloadClick = useCallback((): void => {
            props.onDownload(props.submission)
        }, [props])

        const handleOpenArtifactsClick = useCallback((): void => {
            props.onOpenArtifacts(props.submission.id)
        }, [props])

        const handleToggleDetailsClick = useCallback((): void => {
            props.onToggleDetails(props.submission.id)
        }, [props])

        return (
            <div className={styles.actions}>
                <Button
                    icon={IconOutline.DownloadIcon}
                    onClick={handleDownloadClick}
                    primary
                />
                <Button
                    icon={IconOutline.CollectionIcon}
                    onClick={handleOpenArtifactsClick}
                    primary
                />
                {props.isDesign && (
                    props.deleteDisabled
                        ? (
                            <Tooltip content='You can delete this submission only after the review is complete'>
                                <Button
                                    disabled
                                    icon={IconOutline.TrashIcon}
                                    primary
                                />
                            </Tooltip>
                        )
                        : (
                            <Button
                                icon={IconOutline.TrashIcon}
                                onClick={handleDeleteClick}
                                primary
                            />
                        )
                )}
                <Button
                    icon={props.showDetails
                        ? IconOutline.ChevronUpIcon
                        : IconOutline.ChevronDownIcon}
                    onClick={handleToggleDetailsClick}
                    primary
                />
            </div>
        )
    }

/**
 * Table view for current-member submissions in challenge details.
 *
 * @param props Challenge context and submission handlers.
 * @returns Submission rows with actions and expandable details.
 */
const SubmissionsTable: FC<SubmissionsTableProps> = (props: SubmissionsTableProps) => {
    const [artifactsModalSubmissionId, setArtifactsModalSubmissionId] = useState<string | undefined>(undefined)
    const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})
    const [tableError, setTableError] = useState<string>('')

    const submissionRows = useMemo(
        () => (props.submissions || []).map(submission => submission as SubmissionWithDetails),
        [props.submissions],
    )

    const handleDownload = useCallback(async (submission: SubmissionWithDetails): Promise<void> => {
        try {
            const primaryArtifactBlob = await downloadSubmissionArtifact(submission.id, submission.id)
            downloadBlob(primaryArtifactBlob, `submission-${submission.id}.zip`)
            return
        } catch {
            // fallback to first artifact when direct artifact id lookup is not available
        }

        const artifacts = await fetchSubmissionArtifacts(submission.id)
        const firstArtifactId = artifacts[0]

        if (!firstArtifactId) {
            throw new Error('No downloadable artifact found for this submission.')
        }

        const blob = await downloadSubmissionArtifact(submission.id, firstArtifactId)
        downloadBlob(blob, `submission-${submission.id}.zip`)
    }, [])
    const handleDownloadWithError = useCallback((submission: SubmissionWithDetails): void => {
        handleDownload(submission)
            .catch(error => {
                setTableError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to download submission.',
                )
            })
    }, [handleDownload])

    const toggleShowDetails = useCallback((submissionId: string): void => {
        setShowDetails(previous => ({
            ...previous,
            [submissionId]: !previous[submissionId],
        }))
    }, [])
    const handleOpenArtifactsModal = useCallback((submissionId: string): void => {
        setArtifactsModalSubmissionId(submissionId)
    }, [])
    const handleCloseArtifactsModal = useCallback((): void => {
        setArtifactsModalSubmissionId(undefined)
    }, [])

    const columns = useMemo<ReadonlyArray<TableColumn<SubmissionWithDetails>>>(() => {
        const baseColumns: Array<TableColumn<SubmissionWithDetails>> = [
            {
                columnId: 'id',
                isSortable: false,
                label: 'ID',
                renderer: submission => (
                    <div className={styles.idCell}>
                        <span>{submission.legacySubmissionId || '-'}</span>
                        <span className={styles.v5Id}>{submission.id}</span>
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'type',
                isSortable: false,
                label: 'Type',
                propertyName: 'type',
                type: 'text',
            },
            {
                columnId: 'created',
                isSortable: false,
                label: 'Submission Date',
                renderer: submission => (
                    <span>
                        {moment(submission.created)
                            .local()
                            .format('MMM DD, YYYY hh:mm A')}
                    </span>
                ),
                type: 'element',
            },
        ]

        if (props.isDesign) {
            baseColumns.push({
                columnId: 'screening',
                isSortable: false,
                label: 'Screening Status',
                renderer: submission => (
                    <span>{getScreeningLabel(submission.screening)}</span>
                ),
                type: 'element',
            })
        }

        baseColumns.push({
            columnId: 'actions',
            isSortable: false,
            label: 'Actions',
            renderer: submission => {
                const workflowComplete = isWorkflowRunTerminal(submission)
                const canDelete = canDeleteSubmission(submission, props.submissionPhaseStartDate)
                const deleteDisabled = !workflowComplete || !canDelete

                return (
                    <SubmissionActionButtons
                        deleteDisabled={deleteDisabled}
                        isDesign={props.isDesign}
                        onDelete={props.onDelete}
                        onDownload={handleDownloadWithError}
                        onOpenArtifacts={handleOpenArtifactsModal}
                        onToggleDetails={toggleShowDetails}
                        showDetails={showDetails[submission.id]}
                        submission={submission}
                    />
                )
            },
            type: 'action',
        })

        baseColumns.push({
            columnId: 'details',
            isExpand: true,
            renderer: submission => (
                <div className={styles.detailsWrap}>
                    {showDetails[submission.id] && (
                        <>
                            <WorkflowRuns
                                challengeId={props.challenge.id}
                                workflowRuns={getWorkflowRuns(submission)}
                            />
                            {props.isDesign && (
                                <ScreeningDetails
                                    screeningObject={submission.screening}
                                    submissionId={submission.id}
                                />
                            )}
                        </>
                    )}
                </div>
            ),
            type: 'element',
        })

        return baseColumns
    }, [
        handleDownloadWithError,
        handleOpenArtifactsModal,
        props.challenge.id,
        props.isDesign,
        props.onDelete,
        props.submissionPhaseStartDate,
        showDetails,
        toggleShowDetails,
    ])

    return (
        <section className={styles.container}>
            {!!tableError && (
                <p className={styles.error}>{tableError}</p>
            )}

            <Table
                columns={columns}
                data={submissionRows}
                disableSorting
                expandMode='always'
                preventDefault
                showExpand
            />

            {artifactsModalSubmissionId && (
                <DownloadArtifactsModal
                    onClose={handleCloseArtifactsModal}
                    submissionId={artifactsModalSubmissionId}
                />
            )}
        </section>
    )
}

export { SubmissionsTable }
export default SubmissionsTable
