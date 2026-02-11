import * as yup from 'yup'
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

import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from '~/libs/ui'

import { PROJECT_ROLES } from '../../constants/project-roles.constants'
import {
    ProjectInvite,
    ProjectMember,
} from '../../models'
import { inviteMemberToProject } from '../../services'
import { FormTextField } from '../form'

import styles from './InviteUserModal.module.scss'

interface InviteUserFormData {
    email: string
}

export interface InviteUserModalProps {
    invitedMembers: ProjectInvite[]
    projectId: string
    projectMembers: ProjectMember[]
    onClose: () => void
    onSuccess: () => Promise<void> | void
}

const inviteUserSchema: yup.ObjectSchema<InviteUserFormData> = yup.object({
    email: yup
        .string()
        .trim()
        .required('Please enter an email address.')
        .email('Please enter a valid email address.'),
})

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

function normalizeEmail(value: string): string {
    return value.trim()
        .toLowerCase()
}

export const InviteUserModal: FC<InviteUserModalProps> = (props: InviteUserModalProps) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    const formMethods = useForm<InviteUserFormData>({
        defaultValues: {
            email: '',
        },
        mode: 'onChange',
        resolver: yupResolver(inviteUserSchema) as any,
    })

    const email = formMethods.watch('email')

    const invitedEmails = useMemo(
        () => new Set(
            props.invitedMembers
                .map(invite => invite.email)
                .filter((inviteEmail): inviteEmail is string => !!inviteEmail)
                .map(inviteEmail => normalizeEmail(inviteEmail)),
        ),
        [props.invitedMembers],
    )

    const memberEmails = useMemo(
        () => new Set(
            props.projectMembers
                .map(member => member.email)
                .filter((memberEmail): memberEmail is string => !!memberEmail)
                .map(memberEmail => normalizeEmail(memberEmail)),
        ),
        [props.projectMembers],
    )

    const handleContainerClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            event.stopPropagation()
        },
        [],
    )

    const onSubmit = formMethods.handleSubmit(async formData => {
        if (isSubmitting) {
            return
        }

        setIsSubmitting(true)
        setErrorMessage(undefined)

        try {
            const normalizedEmail = normalizeEmail(formData.email)

            if (invitedEmails.has(normalizedEmail)) {
                setErrorMessage('Email is already invited.')
                return
            }

            if (memberEmails.has(normalizedEmail)) {
                setErrorMessage('Member is already part of this project.')
                return
            }

            const response = await inviteMemberToProject(props.projectId, {
                emails: [normalizedEmail],
                role: PROJECT_ROLES.CUSTOMER,
            })

            if (response.failed?.length) {
                const firstFailure = response.failed[0] as {
                    message?: string
                }

                setErrorMessage(firstFailure.message || 'Unable to invite user')
                return
            }

            await props.onSuccess()
            props.onClose()
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to invite user'))
        } finally {
            setIsSubmitting(false)
        }
    })

    return (
        <div className={styles.overlay} onClick={props.onClose} role='presentation'>
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Invite User</h4>
                </header>

                <FormProvider {...formMethods}>
                    <div className={styles.body}>
                        <FormTextField
                            label='Email'
                            name='email'
                            placeholder='Enter member email'
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
                        label='Close'
                        onClick={props.onClose}
                        secondary
                        size='lg'
                    />
                    <Button
                        disabled={!email || isSubmitting}
                        label={isSubmitting ? 'Inviting user...' : 'Invite User'}
                        onClick={onSubmit}
                        primary
                        size='lg'
                    />
                </footer>
            </div>
        </div>
    )
}

export default InviteUserModal
