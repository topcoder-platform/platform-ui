/**
 * Triggers an ingestion run: either one challenge by id, or a filtered bulk
 * run. Exactly one of the two — filling in one side disables the other, so a
 * run can never be ambiguous about what it was asked to do.
 */
import { ChangeEvent, FC, useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import {
    bulkIngestChallengesInRag,
    BulkIngestionFilters,
    ingestChallengeInRag,
    WorkflowPollTimeoutError,
} from '~/libs/shared'
import { Button, InputSelect } from '~/libs/ui'
import FormToggleSwitch from '~/libs/ui/lib/components/form/form-groups/form-toggle-switch'

import { Field, TextField } from './FormFields'
import {
    BULK_STATUS_OPTIONS,
    BULK_TRACK_OPTIONS,
    BULK_TYPE_OPTIONS,
} from './ingest-options'
import { IngestionRun, IngestionRunSummary } from './IngestionRunSummary'
import styles from './IngestChallengesPanel.module.scss'

interface BulkFormState {
    projectId: string
    track: string
    type: string
    status: string
    updatedSince: string
}

const EMPTY_BULK: BulkFormState = {
    projectId: '',
    status: '',
    track: '',
    type: '',
    updatedSince: '',
}

interface IngestChallengesPanelProps {
    /** Called after any run that may have changed the index. */
    onRunComplete: () => void
}

export const IngestChallengesPanel: FC<IngestChallengesPanelProps> = props => {
    const [challengeId, setChallengeId] = useState('')
    const [bulk, setBulk] = useState<BulkFormState>(EMPTY_BULK)
    const [dryRun, setDryRun] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [lastRun, setLastRun] = useState<IngestionRun | undefined>()

    const hasSingle = !!challengeId.trim()
    const hasBulk = useMemo(
        () => Object.values(bulk)
            .some(value => !!value.trim()),
        [bulk],
    )
    const hasAnyInput = hasSingle || hasBulk
    const canRun = hasAnyInput && !isRunning

    const handleChallengeIdChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setChallengeId(event.target.value)
    }, [])

    const handleBulkChange = useCallback((field: keyof BulkFormState) => (
        (event: ChangeEvent<HTMLInputElement>) => {
            setBulk(previous => ({ ...previous, [field]: event.target.value }))
        }
    ), [])

    const handleDryRunChange = useCallback(() => {
        setDryRun(previous => !previous)
    }, [])

    /**
     * Clears both sections at once. Filling either one disables the other, so
     * without this an operator who started down the wrong path has to empty
     * every field by hand before they can switch.
     */
    const handleReset = useCallback(() => {
        setChallengeId('')
        setBulk(EMPTY_BULK)
    }, [])

    const runIngestion = useCallback(async () => {
        setIsRunning(true)
        setLastRun(undefined)

        try {
            if (hasSingle) {
                const report = await ingestChallengeInRag(challengeId.trim(), { dryRun })
                setLastRun({
                    finishedAt: new Date(),
                    result: {
                        chunks: report.chunks,
                        dryRun: report.dryRun,
                        failed: 0,
                        failures: [],
                        processed: 1,
                        skipped: report.skipped ? 1 : 0,
                        succeeded: 1,
                    },
                    status: 'completed',
                })
                toast.success(
                    report.dryRun
                        ? `Dry run complete — ${report.chunks} chunk(s), index unchanged`
                        : 'Challenge ingested successfully',
                )
            } else {
                const filters: BulkIngestionFilters = {
                    dryRun,
                    projectId: bulk.projectId.trim() || undefined,
                    status: bulk.status ? [bulk.status] : undefined,
                    tracks: bulk.track ? [bulk.track] : undefined,
                    types: bulk.type ? [bulk.type] : undefined,
                    updatedDateStart: bulk.updatedSince.trim() || undefined,
                }
                const report = await bulkIngestChallengesInRag(filters)
                setLastRun({ finishedAt: new Date(), result: report, status: 'completed' })
                toast.success(
                    report.dryRun
                        ? `Dry run complete — ${report.processed} challenge(s), index unchanged`
                        : `Ingestion completed — ${report.succeeded} of ${report.processed} succeeded`,
                )
            }

            props.onRunComplete()
        } catch (error) {
            // A poll timeout is not a failure: the run is still going
            // server-side, so say so and refresh rather than reporting an error.
            if (error instanceof WorkflowPollTimeoutError) {
                setLastRun({
                    finishedAt: new Date(),
                    message: 'This run is taking longer than we wait for it. It is still running — '
                        + 'refresh the indexed challenges below to see results as they land.',
                    status: 'timed-out',
                })
                toast.info('Ingestion is still running')
                props.onRunComplete()
                return
            }

            const message = error instanceof Error ? error.message : 'Ingestion failed'
            setLastRun({ finishedAt: new Date(), message, status: 'failed' })
            toast.error(message)
        } finally {
            setIsRunning(false)
        }
    }, [bulk, challengeId, dryRun, hasSingle, props])

    const handleRunClick = useCallback(() => {
        runIngestion()
    }, [runIngestion])

    const singleDisabled = isRunning || hasBulk
    const bulkDisabled = isRunning || hasSingle

    return (
        <section className={styles.panel}>
            <h4 className={classNames('details', styles.panelTitle)}>Ingest Challenges</h4>
            <p className={styles.panelSubtitle}>
                Ingest one challenge by id, or run a filtered bulk ingestion — choose exactly one.
            </p>

            <div className={styles.formRow}>
                <div className={styles.singleColumn}>
                    <span className={styles.groupLabel}>Single Challenge</span>
                    <TextField
                        label='Challenge ID'
                        placeholder='e.g. 9f1c2e4a-7b3d-4f10-9c2e-1a2b3c4d5e6f'
                        value={challengeId}
                        onChange={handleChallengeIdChange}
                        disabled={singleDisabled}
                        hint="Re-runs replace this challenge's existing chunks."
                    />
                </div>

                <div className={styles.divider}>
                    <span className={styles.dividerLabel}>OR</span>
                </div>

                <div className={styles.bulkColumn}>
                    <span className={styles.groupLabel}>Bulk Ingestion (filtered)</span>
                    <div className={styles.bulkGrid}>
                        <TextField
                            label='Project ID'
                            placeholder='e.g. 17423'
                            value={bulk.projectId}
                            onChange={handleBulkChange('projectId')}
                            disabled={bulkDisabled}
                        />
                        <Field label='Track'>
                            <InputSelect
                                name='track'
                                label=''
                                options={BULK_TRACK_OPTIONS}
                                value={bulk.track}
                                onChange={handleBulkChange('track')}
                                disabled={bulkDisabled}
                                tabIndex={0}
                            />
                        </Field>
                        <Field label='Type'>
                            <InputSelect
                                name='type'
                                label=''
                                options={BULK_TYPE_OPTIONS}
                                value={bulk.type}
                                onChange={handleBulkChange('type')}
                                disabled={bulkDisabled}
                                tabIndex={0}
                            />
                        </Field>
                        <Field label='Status'>
                            <InputSelect
                                name='status'
                                label=''
                                options={BULK_STATUS_OPTIONS}
                                value={bulk.status}
                                onChange={handleBulkChange('status')}
                                disabled={bulkDisabled}
                                tabIndex={0}
                            />
                        </Field>
                        <TextField
                            label='Updated Since'
                            placeholder='YYYY-MM-DD'
                            value={bulk.updatedSince}
                            onChange={handleBulkChange('updatedSince')}
                            disabled={bulkDisabled}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.actionsRow}>
                <div className={styles.dryRun}>
                    <FormToggleSwitch
                        name='dryRun'
                        value={dryRun}
                        onChange={handleDryRunChange}
                        disabled={isRunning}
                    />
                    <span className={styles.dryRunLabel}>
                        Dry run — chunk &amp; embed without writing to the index
                    </span>
                </div>
                <div className={styles.actions}>
                    <Button
                        secondary
                        size='lg'
                        label='Reset'
                        onClick={handleReset}
                        disabled={isRunning || !hasAnyInput}
                    />
                    <Button
                        primary
                        size='lg'
                        label={isRunning ? 'Running…' : 'Run Ingestion'}
                        onClick={handleRunClick}
                        disabled={!canRun}
                    />
                </div>
            </div>

            {lastRun && <IngestionRunSummary run={lastRun} />}
        </section>
    )
}

export default IngestChallengesPanel
