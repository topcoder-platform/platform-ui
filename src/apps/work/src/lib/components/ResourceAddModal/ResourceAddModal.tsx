import {
    FC,
    MouseEvent,
    useCallback,
    useMemo,
    useState,
} from 'react'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import { ResourceRole } from '../../models'
import { createResource } from '../../services'
import {
    FormSelectField,
    FormSelectOption,
    FormUserAutocomplete,
} from '../form'

import styles from './ResourceAddModal.module.scss'

interface ResourceAddFormData {
    memberId: string
    roleId: string
}

export interface ResourceAddModalProps {
    challengeId: string
    onClose: () => void
    onSuccess: () => Promise<void> | void
    resourceRoles: ResourceRole[]
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return 'Failed to add resource'
}

function getRolePermissionLabel(resourceRole: ResourceRole): string {
    const readPermission = resourceRole.fullReadAccess === true
        ? 'Full read'
        : 'Limited read'
    const writePermission = resourceRole.fullWriteAccess === true
        ? 'Full write'
        : 'Limited write'

    return `${readPermission}, ${writePermission}`
}

export const ResourceAddModal: FC<ResourceAddModalProps> = (props: ResourceAddModalProps) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    const formMethods = useForm<ResourceAddFormData>({
        defaultValues: {
            memberId: '',
            roleId: '',
        },
        mode: 'onChange',
    })

    const memberId = formMethods.watch('memberId')
    const roleId = formMethods.watch('roleId')

    const roleOptions = useMemo<FormSelectOption[]>(() => props.resourceRoles
        .map(resourceRole => ({
            label: `${resourceRole.name} (${getRolePermissionLabel(resourceRole)})`,
            value: resourceRole.id,
        }))
        .filter(option => option.label.trim() && option.value.trim())
        .sort((optionA, optionB) => optionA.label.localeCompare(optionB.label)), [props.resourceRoles])

    const handleContainerClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            event.stopPropagation()
        },
        [],
    )

    const handleAddClick = formMethods.handleSubmit(async formData => {
        setErrorMessage(undefined)
        setIsSubmitting(true)

        try {
            await createResource({
                challengeId: props.challengeId,
                memberId: formData.memberId,
                roleId: formData.roleId,
            })

            await props.onSuccess()
            props.onClose()
        } catch (error) {
            setErrorMessage(getErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    })

    return (
        <div
            className={styles.overlay}
            onClick={props.onClose}
            role='presentation'
        >
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Add Resource</h4>
                </header>

                <FormProvider {...formMethods}>
                    <div className={styles.body}>
                        <FormUserAutocomplete
                            label='Member'
                            name='memberId'
                            placeholder='Search member'
                            required
                            valueField='userId'
                        />
                        <FormSelectField
                            label='Role'
                            name='roleId'
                            options={roleOptions}
                            placeholder='Select role'
                            required
                        />

                        {errorMessage
                            ? <p className={styles.errorMessage}>{errorMessage}</p>
                            : undefined}
                    </div>
                </FormProvider>

                <footer className={styles.footer}>
                    <Button
                        disabled={isSubmitting}
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                        size='lg'
                    />
                    <Button
                        disabled={!memberId || !roleId || isSubmitting}
                        label='Add'
                        onClick={handleAddClick}
                        primary
                        size='lg'
                    />
                </footer>
            </div>
        </div>
    )
}

export default ResourceAddModal
