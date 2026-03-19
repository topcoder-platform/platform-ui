/**
 * Problem Library page.
 *
 * Allows administrators to upload programming problems, trigger Docker-based
 * test runs, and flag problems as contest-ready.
 */
import { ChangeEvent, FC, useCallback, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'

// Uncomment the following line to make sure that only logged-in users can access this page. You may also want to enforce
// import { useProfileContext } from '~/libs/core'
import { Button, LoadingSpinner, PageDivider, PageTitle, Table, TableColumn } from '~/libs/ui'

import { MSG_NO_PROBLEMS_FOUND } from '../../config/index.config'
import {
    DeleteConfirmationModal,
    deleteProblem,
    flagProblem,
    getProblemLog,
    getProblems,
    SourceProblem,
    testProblem,
    uploadProblem,
} from '../../lib'

import styles from './ProblemLibraryPage.module.scss'

const pageTitle = 'AI Arena Problem Management'

type AlertType = 'success' | 'error' | 'pending'

interface Alert {
    message: string
    type: AlertType
}

const columns: ReadonlyArray<TableColumn<SourceProblem>> = [
    {
        label: 'ID',
        renderer: (p: SourceProblem) => (
            <span className={styles.idCell} title={p.problemId}>
                {p.problemId.substring(0, 8)}…
            </span>
        ),
        type: 'element',
    },
    {
        label: 'Name',
        propertyName: 'problemName',
        type: 'text',
    },
    {
        label: 'Status',
        renderer: (p: SourceProblem) => {
            if (p.isTested || p.status === 'Passed') {
                return <span className={styles.statusPassed}>Passed</span>
            }
            if (p.status === 'Failed') {
                return <span className={styles.statusFailed}>Failed</span>
            }
            return <span className={styles.statusPending}>Pending</span>
        },
        type: 'element',
    },
    {
        label: 'Contest Use',
        renderer: (p: SourceProblem) =>
            p.isContestReady ? (
                <span className={styles.badgeReady}>READY</span>
            ) : (
                <span className={styles.badgeDraft}>DRAFT</span>
            ),
        type: 'element',
    },
    {
        label: 'Actions',
        type: 'action',
    },
]

export const ProblemLibraryPage: FC = () => {
    // Uncomment the following lines to read the logged-in user from context:
    // const profileContext = useProfileContext()
    // const isLoggedIn = profileContext.isLoggedIn

    const [problems, setProblems] = useState<SourceProblem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [alert, setAlert] = useState<Alert | null>(null)
    const [logModal, setLogModal] = useState<{ name: string; log: string } | null>(null)
    const [isLoadingLog, setIsLoadingLog] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<{ problemId: string; name: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const problemNameRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const showAlert = useCallback((message: string, type: AlertType = 'success') => {
        setAlert({ message, type })
    }, [])

    const fetchProblems = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await getProblems()
            if (response.success) {
                setProblems(response.data ?? [])
                if (response.message) showAlert(response.message)
            } else {
                showAlert(response.message || 'Failed to load problems.', 'error')
            }
        } catch (err: unknown) {
            showAlert(`Failed to load problems: ${(err as Error).message}`, 'error')
        } finally {
            setIsLoading(false)
        }
    }, [showAlert])

    useEffect(() => {
        fetchProblems()
    }, [fetchProblems])

    // Uncomment the following block to guard this page to logged-in members only:
    // if (!isLoggedIn) {
    //     return null
    // }

    // TODO: Enforce a specific user role here (e.g. 'arena-admin') before allowing
    // access to this page. Example:
    // const hasRequiredRole = profileContext.profile?.roles?.includes('arena-admin')
    // if (!hasRequiredRole) return <Navigate to='/' replace />

    const handleUpload = useCallback(async () => {
        const name = problemNameRef.current?.value?.trim()
        const file = fileInputRef.current?.files?.[0]

        if (!name || !file) {
            showAlert('Please enter a problem name and select a ZIP file.', 'error')
            return
        }

        setIsUploading(true)
        showAlert(`Uploading ${name}…`, 'pending')

        try {
            const uploadResponse = await uploadProblem(file, name)
            if (!uploadResponse.success) {
                showAlert(`Upload failed: ${uploadResponse.message}`, 'error')
                return
            }

            const problemId = uploadResponse.data.problemId
            showAlert(`'${name}' uploaded. Starting Docker test…`, 'pending')

            const testResponse = await testProblem(problemId)
            if (testResponse.success) {
                showAlert(`Testing completed successfully for '${name}'.`)
            } else {
                showAlert(`'${name}' uploaded but testing failed. Check server logs.`, 'error')
            }

            // Reset form
            if (problemNameRef.current) problemNameRef.current.value = ''
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err: unknown) {
            showAlert(`Fatal error during upload/test: ${(err as Error).message}`, 'error')
        } finally {
            setIsUploading(false)
            fetchProblems()
        }
    }, [fetchProblems, showAlert])

    const handleTest = useCallback(
        async (problemId: string) => {
            showAlert(`Testing problem ${problemId.substring(0, 8)}…`, 'pending')
            try {
                const response = await testProblem(problemId)
                showAlert(
                    response.success
                        ? response.message || 'Test passed.'
                        : response.message || 'Test failed.',
                    response.success ? 'success' : 'error',
                )
            } catch (err: unknown) {
                showAlert(`Test error: ${(err as Error).message}`, 'error')
            } finally {
                fetchProblems()
            }
        },
        [fetchProblems, showAlert],
    )

    const handleViewLog = useCallback(async (problemId: string, problemName: string) => {
        setIsLoadingLog(true)
        try {
            const response = await getProblemLog(problemId)
            setLogModal({
                name: problemName,
                log: response.success && response.data
                    ? response.data
                    : response.message || 'No log available.',
            })
        } catch (err: unknown) {
            setLogModal({
                name: problemName,
                log: `Failed to load log: ${(err as Error).message}`,
            })
        } finally {
            setIsLoadingLog(false)
        }
    }, [])

    const handleDelete = useCallback(async () => {
        if (!deleteConfirm) return
        setIsDeleting(true)
        try {
            const response = await deleteProblem(deleteConfirm.problemId)
            showAlert(
                response.success
                    ? `'${deleteConfirm.name}' removed from the library.`
                    : response.message || 'Delete failed.',
                response.success ? 'success' : 'error',
            )
        } catch (err: unknown) {
            showAlert(`Delete error: ${(err as Error).message}`, 'error')
        } finally {
            setIsDeleting(false)
            setDeleteConfirm(null)
            fetchProblems()
        }
    }, [deleteConfirm, fetchProblems, showAlert])

    const handleFlag = useCallback(
        async (problemId: string, flag: boolean) => {
            showAlert(`${flag ? 'Flagging' : 'Unflagging'} problem…`, 'pending')
            try {
                const response = await flagProblem(problemId, flag)
                showAlert(
                    response.success
                        ? response.message || 'Flag updated.'
                        : response.message || 'Flag update failed.',
                    response.success ? 'success' : 'error',
                )
            } catch (err: unknown) {
                showAlert(`Flag error: ${(err as Error).message}`, 'error')
            } finally {
                fetchProblems()
            }
        },
        [fetchProblems, showAlert],
    )

    const tableColumns: ReadonlyArray<TableColumn<SourceProblem>> = columns.map(col => {
        if (col.type !== 'action') return col
        return {
            ...col,
            renderer: (p: SourceProblem) => (
                <div className={styles.actionCell}>
                    <Button
                        size='sm'
                        secondary
                        variant='linkblue'
                        noCaps
                        onClick={() => handleTest(p.problemId)}
                        disabled={p.isTested}
                    >
                        Test
                    </Button>
                    <Button
                        size='sm'
                        primary
                        noCaps
                        onClick={() => handleFlag(p.problemId, !p.isContestReady)}
                        disabled={!p.isTested}
                        className={styles.flagButton}
                    >
                        {p.isContestReady ? 'Unflag' : 'Flag for Contest'}
                    </Button>
                    <Button
                        size='sm'
                        noCaps
                        onClick={() => setDeleteConfirm({ problemId: p.problemId, name: p.problemName })}
                        className={styles.removeButton}
                    >
                        Remove
                    </Button>
                    {p.status === 'Failed' && (
                        <Button
                            size='sm'
                            secondary
                            noCaps
                            onClick={() => handleViewLog(p.problemId, p.problemName)}
                            disabled={isLoadingLog}
                            className={styles.buildLogButton}
                        >
                            Build Log
                        </Button>
                    )}
                </div>
            ),
        }
    })

    return (
        <div className={styles.container}>
            <PageTitle>{pageTitle}</PageTitle>

            <div className={styles.pageHeader}>
                <h3>{pageTitle}</h3>
            </div>

            <div className={styles.pageContent}>
                {/* Status Alert */}
                {alert && (
                    <div
                        className={classNames(styles.alert, {
                            [styles.alertSuccess]: alert.type === 'success',
                            [styles.alertError]: alert.type === 'error',
                            [styles.alertPending]: alert.type === 'pending',
                        })}
                        role='alert'
                    >
                        {alert.message}
                    </div>
                )}

                {/* Upload Form */}
                <div className={styles.card}>
                    <h4 className={styles.cardTitle}>Upload New Problem (.zip)</h4>
                    <div className={styles.uploadForm}>
                        <div className={styles.field}>
                            <label htmlFor='problem-name' className={styles.label}>
                                Problem Name
                            </label>
                            <input
                                id='problem-name'
                                ref={problemNameRef}
                                type='text'
                                className={styles.input}
                                disabled={isUploading}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor='problem-file' className={styles.label}>
                                Problem ZIP File (Source &amp; Tests)
                            </label>
                            <input
                                id='problem-file'
                                ref={fileInputRef}
                                type='file'
                                accept='.zip'
                                className={styles.fileInput}
                                disabled={isUploading}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    // Update the problem name from the filename if name is empty
                                    const file = e.target.files?.[0]
                                    if (
                                        file
                                        && problemNameRef.current
                                        && !problemNameRef.current.value
                                    ) {
                                        problemNameRef.current.value = file.name.replace(/\.zip$/i, '')
                                    }
                                }}
                            />
                        </div>
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading}
                            size='md'
                            noCaps
                            className={styles.uploadButton}
                        >
                            Upload &amp; Register Problem
                        </Button>
                    </div>
                </div>

                <PageDivider />

                {/* Problem Table */}
                <div className={styles.tableHeader}>
                    <h4 className={styles.tableTitle}>Problem Library</h4>
                    <Button
                        size='sm'
                        onClick={fetchProblems}
                        disabled={isLoading}
                    >
                        Refresh List
                    </Button>
                </div>

                {isLoading ? (
                    <div className={styles.spinnerWrap}>
                        <LoadingSpinner />
                    </div>
                ) : problems.length === 0 ? (
                    <p className={styles.emptyText}>{MSG_NO_PROBLEMS_FOUND}</p>
                ) : (
                    <Table
                        columns={tableColumns}
                        data={problems}
                        disableSorting
                        className={styles.problemTable}
                    />
                )}
            </div>

            <DeleteConfirmationModal
                open={Boolean(deleteConfirm)}
                title='Remove Problem'
                content={(
                    <p className={styles.confirmText}>
                        Are you sure you want to remove <strong>{deleteConfirm?.name}</strong> from
                        the library? This will permanently delete all associated files and cannot
                        be undone.
                    </p>
                )}
                confirmLabel={isDeleting ? 'Removing…' : 'Remove'}
                confirmButtonClassName={styles.confirmDeleteButton}
                isProcessing={isDeleting}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
            />

            {/* Build Log Modal */}
            {logModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setLogModal(null)}
                    role='dialog'
                    aria-modal='true'
                    aria-label={`Build log for ${logModal.name}`}
                >
                    <div
                        className={styles.modal}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h4 className={styles.modalTitle}>Build Log: {logModal.name}</h4>
                            <button
                                className={styles.modalClose}
                                onClick={() => setLogModal(null)}
                                aria-label='Close'
                            >
                                ✕
                            </button>
                        </div>
                        <pre className={styles.logContent}>{logModal.log}</pre>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProblemLibraryPage
