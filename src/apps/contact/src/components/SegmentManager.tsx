/* Form callbacks capture the selected segment. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useState } from 'react'

import { Button } from '~/libs/ui/lib/components/button'

import { Segment } from '../contact.models'
import { contactError } from '../contact.service'

import { SegmentDeleteModal } from './SegmentDeleteModal'
import { SegmentEditorModal } from './SegmentEditorModal'
import { SegmentMembersModal } from './SegmentMembersModal'
import styles from './SegmentManager.module.scss'

interface Props {
    segments: Segment[]
    onSaved: (segment: Segment) => void
    onDeleted: (id: string) => void
    onRefresh: () => Promise<void>
}

type SegmentDialog = { kind: 'editor'; segment?: Segment }
    | { kind: 'delete' | 'members'; segment: Segment }

/**
 * Formats a server creation instant as a UTC calendar date for the segment table.
 * @param value ISO creation timestamp returned by the segment API.
 * @returns a readable date or an explicit unknown-date fallback for invalid input.
 * @throws Does not throw for invalid timestamps.
 */
function createdDate(value: string): string {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? 'Unknown date'
        : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC', year: 'numeric' })
}

/**
 * Lists saved criteria and opens focused dialogs to create, edit, delete or inspect matching members.
 * @param props current API segments, parent inventory reconciliation callbacks and library refresh callback.
 * @returns an administrative table with canonical member counts, not consented send-audience counts.
 * @throws Request failures appear in dialogs or a retryable library alert; successful writes are not repeated.
 */
export const SegmentManager: FC<Props> = props => {
    const [dialog, setDialog] = useState<SegmentDialog>()
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const actionsDisabled = refreshing || !!error

    /** Close the active dialog; takes no inputs, returns void and performs no API write. */
    function close(): void {
        setDialog(undefined)
    }

    /**
     * Reconciles the authoritative saved segment before closing the editor and refreshing counts.
     * @param segment saved API response used by the parent even if refresh fails or this tab unmounts.
     * @param success message describing the completed save.
     * @returns completion after the refresh attempt; transport failures remain retryable.
     * @throws Does not throw; refresh errors are displayed in the library.
     */
    async function saved(segment: Segment, success: string): Promise<void> {
        props.onSaved(segment)
        await refresh(success)
    }

    /**
     * Removes a confirmed deletion from parent state before closing the modal and refreshing.
     * @param id exact segment ID whose DELETE request completed successfully.
     * @returns completion after the refresh attempt; no repeated DELETE request is issued.
     * @throws Does not throw; refresh errors are displayed in the library.
     */
    async function deleted(id: string): Promise<void> {
        props.onDeleted(id)
        await refresh('Segment deleted.')
    }

    /**
     * Refreshes the table after a confirmed mutation or an explicit retry.
     * @param success optional successful-operation message; closes the dialog before refreshing.
     * @returns completion after refresh or a displayed failure, without repeating the preceding write.
     * @throws Does not throw; a failed table refresh leaves a separate retry action.
     */
    async function refresh(success?: string): Promise<void> {
        if (success) {
            close()
            setMessage(success)
        }

        setError('')
        setRefreshing(true)
        try {
            await props.onRefresh()
        } catch (failure) {
            setError(`The segment list could not be refreshed. ${contactError(failure)}`)
        } finally {
            setRefreshing(false)
        }
    }

    return (
        <section className={styles.library} aria-labelledby='contact-segments-heading'>
            <header className={styles.header}>
                <div>
                    <h2 id='contact-segments-heading'>Segments</h2>
                    <p>
                        Save member criteria for your campaigns. Counts include all matching active members;
                        subscription consent and delivery eligibility are checked before sending.
                    </p>
                </div>
                <Button
                    primary
                    size='lg'
                    label='Add segment'
                    disabled={actionsDisabled}
                    onClick={() => setDialog({ kind: 'editor' })}
                />
            </header>
            {message && <p className={styles.success} role='status'>{message}</p>}
            {error && (
                <div className={styles.error} role='alert'>
                    <p>{error}</p>
                    <Button secondary label='Retry loading segments' disabled={refreshing} onClick={() => refresh()} />
                </div>
            )}
            <div className={styles.tableScroll}>
                <table className={styles.table} aria-label='Saved segments' aria-busy={refreshing}>
                    <thead>
                        <tr>
                            <th scope='col'>Segment name</th>
                            <th scope='col'>Created date</th>
                            <th scope='col'>Creator handle</th>
                            <th scope='col'>Member count</th>
                            <th scope='col'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.segments.map(segment => (
                            <tr key={segment.id}>
                                <th scope='row'>{segment.name}</th>
                                <td><time dateTime={segment.createdAt}>{createdDate(segment.createdAt)}</time></td>
                                <td>{segment.createdByHandle || 'Unknown member'}</td>
                                <td className={styles.count}>{segment.memberCount.toLocaleString()}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <Button
                                            secondary
                                            size='sm'
                                            disabled={actionsDisabled}
                                            onClick={() => setDialog({ kind: 'members', segment })}
                                        >
                                            View members
                                            <span className={styles.srOnly}>
                                                {` in ${segment.name}`}
                                            </span>
                                        </Button>
                                        <Button
                                            secondary
                                            size='sm'
                                            disabled={actionsDisabled}
                                            onClick={() => setDialog({ kind: 'editor', segment })}
                                        >
                                            Edit segment
                                            <span className={styles.srOnly}>
                                                {` ${segment.name}`}
                                            </span>
                                        </Button>
                                        <Button
                                            secondary
                                            size='sm'
                                            variant='danger'
                                            disabled={actionsDisabled}
                                            onClick={() => setDialog({ kind: 'delete', segment })}
                                        >
                                            Delete segment
                                            <span className={styles.srOnly}>
                                                {` ${segment.name}`}
                                            </span>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!props.segments.length && (
                            <tr>
                                <td colSpan={5} className={styles.empty}>
                                    No saved segments yet. Add your first segment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {dialog?.kind === 'editor' && (
                <SegmentEditorModal segment={dialog.segment} onClose={close} onSaved={saved} />
            )}
            {dialog?.kind === 'delete' && (
                <SegmentDeleteModal segment={dialog.segment} onClose={close} onDeleted={deleted} />
            )}
            {dialog?.kind === 'members' && <SegmentMembersModal segment={dialog.segment} onClose={close} />}
        </section>
    )
}
