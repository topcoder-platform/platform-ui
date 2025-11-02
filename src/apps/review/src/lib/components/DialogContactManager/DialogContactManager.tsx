/**
 * Dialog Contact Manager.
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { toast } from 'react-toastify'
import { get, noop } from 'lodash'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    InputSelectReact,
    InputTextarea,
    LoadingSpinner,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'
import { handleError } from '~/apps/admin/src/lib/utils'

import { filterResources, formContactManagerSchema } from '../../utils'
import { ChallengeDetailContextModel, FormContactManager } from '../../models'
import { useRole, useRoleProps } from '../../hooks'
import { ChallengeDetailContext } from '../../contexts'
import { createContactRequest } from '../../services'
import { REVIEWER, SUBMITTER } from '../../../config/index.config'

import styles from './DialogContactManager.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
}

export const DialogContactManager: FC<Props> = (props: Props) => {
    const className = props.className
    const open = props.open
    const setOpen = props.setOpen
    const { myChallengeResources }: useRoleProps = useRole()
    const { challengeId }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )

    // get category dropdown options
    const categoryOptions = useMemo(
        () => [
            {
                label: 'Select',
                value: '',
            },
            ...['Question', 'Comment', 'Complaint', 'Other'].map(item => ({
                label: item,
                value: item,
            })),
        ],
        [],
    )
    const [isLoading, setIsLoading] = useState(false)
    // close this dialog
    const handleClose = useCallback(() => {
        if (!isLoading) {
            setOpen(false)
        }
    }, [isLoading, setOpen])

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid, isDirty },
    }: UseFormReturn<FormContactManager> = useForm({
        defaultValues: {
            category: '',
            message: '',
        },
        mode: 'all',
        resolver: yupResolver(formContactManagerSchema),
    })

    // handle submit form
    const onSubmit = useCallback(
        (data: FormContactManager) => {
            setIsLoading(true)
            const reviewerSubmitterResources = filterResources(
                [SUBMITTER, REVIEWER],
                myChallengeResources,
            )
            createContactRequest(
                challengeId ?? '',
                reviewerSubmitterResources[0]?.id ?? '',
                data,
            )
                .then(() => {
                    toast.success('Message sent successfully', {
                        toastId: 'Contact manager',
                    })
                    setIsLoading(false)
                    handleClose()
                })
                .catch(e => {
                    setIsLoading(false)
                    handleError(e)
                })
        },
        [myChallengeResources, challengeId, handleClose],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title='Contact Manager'
            onClose={handleClose}
            open={open}
            classNames={{
                modal: classNames(styles.modal),
            }}
        >
            <form
                className={classNames(styles.container, className)}
                onSubmit={handleSubmit(onSubmit)}
            >
                <div>
                    <Controller
                        name='category'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormContactManager,
                                'category'
                            >
                        }) {
                            return (
                                <InputSelectReact
                                    name='category'
                                    label='Category'
                                    placeholder='Select'
                                    options={categoryOptions}
                                    value={controlProps.field.value}
                                    onChange={controlProps.field.onChange}
                                    classNameWrapper={styles.inputField}
                                    disabled={isLoading}
                                />
                            )
                        }}
                    />
                    <InputTextarea
                        name='message'
                        label='Message'
                        placeholder='Enter'
                        tabIndex={0}
                        onChange={noop}
                        error={get(errors, 'message.message')}
                        inputControl={register('message')}
                        dirty
                        disabled={isLoading}
                        rows={4}
                    />
                </div>
                <div className={styles.actionButtons}>
                    <Button
                        secondary
                        size='lg'
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        primary
                        size='lg'
                        disabled={isLoading || !isValid || !isDirty}
                    >
                        Submit
                    </Button>
                </div>

                {isLoading && (
                    <div className={styles.dialogLoadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
            </form>
        </BaseModal>
    )
}

export default DialogContactManager
