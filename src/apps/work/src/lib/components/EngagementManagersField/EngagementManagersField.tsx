import {
    FC,
    FocusEvent,
    FormEvent,
    useCallback,
    useState,
} from 'react'

import { Button, InputText } from '~/libs/ui'

import { EngagementManager } from '../../models'
import {
    assignEngagementManager,
    removeEngagementManager,
} from '../../services'

import styles from './EngagementManagersField.module.scss'

export interface EngagementManagersFieldProps {
    /** Administrators and privileged managers may assign and remove; others see the list read-only. */
    canEdit?: boolean
    engagementId: number | string
    isLoading?: boolean
    managers: EngagementManager[]
    /** Called after a successful change so the caller can refresh its copy of the list. */
    onChange?: () => void
}

function extractErrorMessage(error: unknown, fallback: string): string {
    const typedError = error as {
        message?: string
        response?: { data?: { message?: string } }
    }

    return typedError?.response?.data?.message || typedError?.message || fallback
}

function formatManager(manager: EngagementManager): string {
    return manager.name ? `${manager.name} (${manager.handle})` : manager.handle
}

/**
 * Managers field for the engagement assignees page.
 *
 * Writes through the engagements API's manager endpoints - the same endpoints the Engagements Portal
 * timesheet page uses. Both apps therefore read and write one list, which is what keeps them in step
 * without any replication between them. The assigned managers are exactly the people who may approve
 * this engagement's timesheets.
 */
export const EngagementManagersField: FC<EngagementManagersFieldProps> = (
    props: EngagementManagersFieldProps,
) => {
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
            // Handle existence, account status, and duplicate checks all live in the API, so its
            // message is the one that tells the operator what actually went wrong.
            setError(extractErrorMessage(assignError, 'Failed to assign manager.'))
        } finally {
            setIsAssigning(false)
        }
    }, [handle, props])

    const handleRemove = useCallback(async (manager: EngagementManager) => {
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
        <section className={styles.managers}>
            <div className={styles.header}>
                <span className={styles.label}>Managers</span>
                <span className={styles.hint}>
                    Managers assigned here can approve timesheets for this engagement.
                </span>
            </div>

            {props.isLoading && (
                <span className={styles.loading}>Loading managers...</span>
            )}

            {!props.isLoading && props.managers.length === 0 && (
                <span className={styles.empty}>No managers assigned.</span>
            )}

            {!props.isLoading && props.managers.length > 0 && (
                <ul className={styles.list}>
                    {props.managers.map(manager => (
                        <li className={styles.item} key={manager.userId}>
                            <span className={styles.name}>{formatManager(manager)}</span>
                            {canEdit && (
                                <Button
                                    disabled={removingUserId === manager.userId}
                                    label={removingUserId === manager.userId ? 'Removing...' : 'Remove'}
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
                        name='engagementManagerHandle'
                        onChange={function onHandleChange(event: FocusEvent<HTMLInputElement>) {
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

            {error && <span className={styles.error} role='alert'>{error}</span>}
        </section>
    )
}

export default EngagementManagersField
