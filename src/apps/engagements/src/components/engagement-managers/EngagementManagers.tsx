import { FC, FocusEvent, FormEvent, useCallback, useState } from 'react'

import { Button, IconOutline, InputText, LoadingSpinner } from '~/libs/ui'

import type { EngagementManager } from '../../lib/models'
import {
    assignEngagementManager,
    removeEngagementManager,
} from '../../lib/services/engagement-managers.service'

import styles from './EngagementManagers.module.scss'

interface EngagementManagersProps {
    /** Engagement whose managers are being listed. */
    engagementId: string
    managers: EngagementManager[]
    /** Administrators may assign and remove; everyone else sees the list read-only. */
    canEdit?: boolean
    loading?: boolean
    /** Called after a successful assign or remove so the caller can refresh its copy of the list. */
    onChange?: () => void
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
    const typedError = error as {
        message?: string
        response?: { data?: { message?: string } }
    }

    return typedError?.response?.data?.message || typedError?.message || fallback
}

/**
 * Manager list with assign/remove controls for administrators.
 *
 * Reads and writes the engagement-manager endpoints directly, which are the same endpoints the Work
 * App's assignees page uses. That shared endpoint is what makes a manager added in either app visible
 * in the other - there is one list, not two copies to reconcile.
 */
const EngagementManagers: FC<EngagementManagersProps> = (props: EngagementManagersProps) => {
    const [handle, setHandle] = useState<string>('')
    const [error, setError] = useState<string | undefined>()
    const [isAssigning, setIsAssigning] = useState<boolean>(false)
    const [removingUserId, setRemovingUserId] = useState<string | undefined>()

    const canEdit = props.canEdit ?? false

    const handleAssign = useCallback(async (event: FormEvent) => {
        event.preventDefault()

        const trimmedHandle = handle.trim()
        if (!trimmedHandle) {
            setError('Enter a Topcoder handle.')
            return
        }

        setError(undefined)
        setIsAssigning(true)

        try {
            await assignEngagementManager(props.engagementId, trimmedHandle)
            setHandle('')
            props.onChange?.()
        } catch (assignError) {
            // The API is the only place handle existence, account status, and duplicates are
            // checked, so its message is the one worth showing.
            setError(extractErrorMessage(assignError, 'Failed to assign manager.'))
        } finally {
            setIsAssigning(false)
        }
    }, [handle, props])

    const handleRemove = useCallback(async (manager: EngagementManager) => {
        /* eslint-disable-next-line no-restricted-globals, no-alert */
        const confirmed = window.confirm(
            `Remove ${manager.handle} as a manager? They will no longer be able to approve timesheets `
            + 'for this engagement. Approvals they already made are kept.',
        )

        if (!confirmed) {
            return
        }

        setError(undefined)
        setRemovingUserId(manager.userId)

        try {
            await removeEngagementManager(props.engagementId, manager.userId)
            props.onChange?.()
        } catch (removeError) {
            setError(extractErrorMessage(removeError, 'Failed to remove manager.'))
        } finally {
            setRemovingUserId(undefined)
        }
    }, [props])

    return (
        <div className={styles.managers}>
            <div className={styles.header}>
                <h3 className={styles.title}>Managers</h3>
                <span className={styles.hint}>
                    Managers assigned here can approve timesheets for this engagement.
                </span>
            </div>

            {props.loading ? (
                <div className={styles.loadingState} aria-live='polite'>
                    <LoadingSpinner className={styles.loadingSpinner} inline />
                    <span>Loading managers...</span>
                </div>
            ) : (
                <>
                    {props.managers.length === 0 ? (
                        <p className={styles.emptyState}>No managers assigned yet.</p>
                    ) : (
                        <ul className={styles.managerList}>
                            {props.managers.map(manager => (
                                <li className={styles.managerItem} key={manager.userId}>
                                    <span className={styles.managerName}>
                                        {manager.name
                                            ? `${manager.name} (${manager.handle})`
                                            : manager.handle}
                                    </span>
                                    {canEdit && (
                                        <Button
                                            disabled={removingUserId === manager.userId}
                                            icon={IconOutline.TrashIcon}
                                            iconToLeft
                                            label={removingUserId === manager.userId
                                                ? 'Removing...'
                                                : 'Remove'}
                                            onClick={function onRemove() {
                                                handleRemove(manager)
                                            }}
                                            secondary
                                            size='sm'
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {canEdit && (
                        <form className={styles.addForm} onSubmit={handleAssign}>
                            <InputText
                                label='Add manager by Topcoder handle'
                                name='managerHandle'
                                onChange={function onHandleChange(
                                    event: FocusEvent<HTMLInputElement>,
                                ) {
                                    setHandle(event.target.value)
                                    setError(undefined)
                                }}
                                placeholder='e.g. maryj'
                                type='text'
                                value={handle}
                            />
                            <Button
                                disabled={isAssigning || !handle.trim()}
                                label={isAssigning ? 'Adding...' : 'Add Manager'}
                                primary
                                size='sm'
                                type='submit'
                            />
                        </form>
                    )}

                    {error && (
                        <p className={styles.error} role='alert'>{error}</p>
                    )}
                </>
            )}
        </div>
    )
}

export default EngagementManagers
