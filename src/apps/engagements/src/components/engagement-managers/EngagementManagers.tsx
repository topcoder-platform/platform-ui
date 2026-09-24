import { FC, useCallback, useState } from 'react'
import {
    FormProvider,
    useForm,
    UseFormReturn,
    useWatch,
} from 'react-hook-form'

import { Button, IconOutline, LoadingSpinner } from '~/libs/ui'
import { FormUserAutocomplete } from '~/apps/work/src/lib/components/form'
import type { User } from '~/apps/work/src/lib/models'

import type { AssignEngagementManagerRequest, EngagementManager } from '../../lib/models'
import {
    assignEngagementManager,
    removeEngagementManager,
} from '../../lib/services/engagement-managers.service'

import styles from './EngagementManagers.module.scss'

type SelectedManager = AssignEngagementManagerRequest

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

interface ManagerFieldFormData {
    managerUserId: string
}

const MANAGER_USER_ID_FIELD = 'managerUserId'

const extractErrorMessage = (error: unknown, fallback: string): string => {
    const typedError = error as {
        message?: string
        response?: { data?: { message?: string } }
    }

    return typedError?.response?.data?.message || typedError?.message || fallback
}

interface AddManagerFormProps {
    formMethods: UseFormReturn<ManagerFieldFormData>
    isAssigning: boolean
    onAssign: (manager: SelectedManager) => void
}

/**
 * Handle picker plus the add action. Lives inside the form provider because
 * `FormUserAutocomplete` - the same member picker the challenge reviewer and screener fields use -
 * reads its value through react-hook-form context.
 */
const AddManagerForm: FC<AddManagerFormProps> = (props: AddManagerFormProps) => {
    const [selectedManager, setSelectedManager] = useState<SelectedManager | undefined>()
    const selectedUserId = useWatch({
        control: props.formMethods.control,
        name: MANAGER_USER_ID_FIELD,
    }) as string | undefined

    // The picker hands back the member it selected, so the user id and the handle both come from one
    // selection. Nothing has to look the member up again - not here, and not on the server.
    const handleSelectionChange = useCallback((value: string, user?: User) => {
        setSelectedManager(value && user
            ? {
                handle: user.handle,
                name: [user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || undefined,
                userId: value,
            }
            : undefined)
    }, [])

    const handleSubmit = props.formMethods.handleSubmit(() => {
        if (!selectedManager || selectedManager.userId !== selectedUserId) {
            return
        }

        props.onAssign(selectedManager)
    })

    return (
        <form className={styles.addForm} onSubmit={handleSubmit}>
            <div className={styles.addFormField}>
                <FormUserAutocomplete
                    disabled={props.isAssigning}
                    label='Add manager'
                    name={MANAGER_USER_ID_FIELD}
                    onValueChange={handleSelectionChange}
                    placeholder='Search user handles'
                    valueField='userId'
                />
            </div>
            <Button
                disabled={props.isAssigning || !selectedManager}
                label={props.isAssigning ? 'Adding...' : 'Add Manager'}
                primary
                size='sm'
                type='submit'
            />
        </form>
    )
}

/**
 * Manager list with assign/remove controls for administrators.
 *
 * Reads and writes the engagement-manager endpoints directly, which are the same endpoints the Work
 * App's assignees page uses. That shared endpoint is what makes a manager added in either app visible
 * in the other - there is one list, not two copies to reconcile.
 */
const EngagementManagers: FC<EngagementManagersProps> = (props: EngagementManagersProps) => {
    const [error, setError] = useState<string | undefined>()
    const [isAssigning, setIsAssigning] = useState<boolean>(false)
    const [removingUserId, setRemovingUserId] = useState<string | undefined>()

    const canEdit = props.canEdit ?? false
    const formMethods = useForm<ManagerFieldFormData>({
        defaultValues: { managerUserId: '' },
        mode: 'onChange',
    })

    const handleAssign = useCallback(async (manager: SelectedManager) => {
        setError(undefined)
        setIsAssigning(true)

        try {
            await assignEngagementManager(props.engagementId, manager)
            formMethods.reset({ managerUserId: '' })
            props.onChange?.()
        } catch (assignError) {
            // The API is the only place handle existence, account status, and duplicates are
            // checked, so its message is the one worth showing. The picker narrows the input to real
            // handles; it does not know who is already a manager on this engagement.
            setError(extractErrorMessage(assignError, 'Failed to assign manager.'))
        } finally {
            setIsAssigning(false)
        }
    }, [formMethods, props])

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
                        <FormProvider {...formMethods}>
                            <AddManagerForm
                                formMethods={formMethods}
                                isAssigning={isAssigning}
                                onAssign={handleAssign}
                            />
                        </FormProvider>
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
