import { FC, useEffect, useMemo } from 'react'
import { noop } from 'lodash'
import { useForm, UseFormReturn } from 'react-hook-form'
import { object, ObjectSchema, string } from 'yup'

import { yupResolver } from '@hookform/resolvers/yup'
import { BaseModal, Button, InputText, LoadingSpinner } from '~/libs/ui'

import styles from './ChangeEmailModal.module.scss'

interface ChangeEmailForm {
    email: string
}

interface ChangeEmailModalProps {
    currentEmail: string
    error?: string
    isOpen: boolean
    isSubmitting: boolean
    onClose: () => void
    onSubmit: (email: string) => Promise<void>
}

/**
 * Shows the member's current address and collects a different valid address.
 */
const ChangeEmailModal: FC<ChangeEmailModalProps> = (
    props: ChangeEmailModalProps,
) => {
    const schema: ObjectSchema<ChangeEmailForm> = useMemo(() => object({
        email: string()
            .trim()
            .email('Enter a valid email address.')
            .required('New email is required.')
            .test(
                'different-email',
                'The new email must be different from your current email.',
                value => value?.toLowerCase() !== props.currentEmail.toLowerCase(),
            ),
    }), [props.currentEmail])

    const {
        formState: { errors, isValid },
        handleSubmit,
        register,
        reset,
    }: UseFormReturn<ChangeEmailForm> = useForm<ChangeEmailForm>({
        defaultValues: { email: '' },
        mode: 'all',
        resolver: yupResolver(schema),
    })

    useEffect(() => {
        if (props.isOpen) {
            reset({ email: '' })
        }
    }, [props.isOpen, reset])

    /**
     * Normalizes and forwards a valid proposed email.
     * @param values validated modal form values.
     * @returns a promise resolved after the validation email request completes.
     */
    async function submit(values: ChangeEmailForm): Promise<void> {
        await props.onSubmit(values.email.trim()
            .toLowerCase())
    }

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            open={props.isOpen}
            size='lg'
            title='Change Email'
            onClose={props.onClose}
        >
            <form
                className={styles.container}
                onSubmit={handleSubmit(submit)}
            >
                <p>
                    We&apos;ll send a validation link to the new address. Your
                    primary email will stay unchanged until that link is used.
                </p>

                <InputText
                    disabled
                    forceUpdateValue
                    label='Current Email'
                    name='currentEmail'
                    type='text'
                    value={props.currentEmail}
                    onChange={noop}
                />
                <InputText
                    autoFocus
                    dirty
                    disabled={props.isSubmitting}
                    error={errors.email?.message ?? props.error}
                    forceUpdateValue
                    inputControl={register('email')}
                    label='New Email'
                    name='email'
                    placeholder='Enter your new email address'
                    type='text'
                    onChange={noop}
                />

                <div className={styles.actions}>
                    {props.isSubmitting && (
                        <LoadingSpinner className={styles.spinner} />
                    )}
                    <Button
                        disabled={props.isSubmitting}
                        label='Cancel'
                        secondary
                        size='lg'
                        onClick={props.onClose}
                    />
                    <Button
                        disabled={props.isSubmitting || !isValid}
                        label='Send Validation Email'
                        primary
                        size='lg'
                        type='submit'
                    />
                </div>
            </form>
        </BaseModal>
    )
}

export default ChangeEmailModal
