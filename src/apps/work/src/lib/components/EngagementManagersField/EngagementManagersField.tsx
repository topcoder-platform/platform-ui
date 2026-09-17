import {
    FC,
    useCallback,
    useState,
} from 'react'
import {
    FormProvider,
    useForm,
    UseFormReturn,
    useWatch,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import { AssignEngagementManagerPayload, EngagementManager, User } from '../../models'
import {
    assignEngagementManager,
    removeEngagementManager,
} from '../../services'
import { FormUserAutocomplete } from '../form'

import styles from './EngagementManagersField.module.scss'

type SelectedManager = AssignEngagementManagerPayload

export interface EngagementManagersFieldProps {
    /** Administrators and privileged managers may assign and remove; others see the list read-only. */
    canEdit?: boolean
    engagementId: number | string
    isLoading?: boolean
    managers: EngagementManager[]
    /** Called after a successful change so the caller can refresh its copy of the list. */
    onChange?: () => void
}

interface ManagerFieldFormData {
    managerUserId: string
}

const MANAGER_USER_ID_FIELD = 'managerUserId'

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
            // Handle existence, account status, and duplicate checks all live in the API, so its
            // message is the one that tells the operator what actually went wrong. The picker only
            // narrows the input to real handles; it does not know who is already a manager here.
            setError(extractErrorMessage(assignError, 'Failed to assign manager.'))
        } finally {
            setIsAssigning(false)
        }
    }, [formMethods, props])

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
                <FormProvider {...formMethods}>
                    <AddManagerForm
                        formMethods={formMethods}
                        isAssigning={isAssigning}
                        onAssign={handleAssign}
                    />
                </FormProvider>
            )}

            {error && <span className={styles.error} role='alert'>{error}</span>}
        </section>
    )
}

export default EngagementManagersField
