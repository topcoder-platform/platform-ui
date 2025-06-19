/**
 * Dialog add group.
 */
import { FC, useCallback } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    InputCheckbox,
    InputText,
    InputTextarea,
    LoadingSpinner,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormAddGroup } from '../../models'
import { formAddGroupSchema } from '../../utils'

import styles from './DialogAddGroup.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    onSubmitForm?: (filter: FormAddGroup) => void
    isLoading?: boolean
}

export const DialogAddGroup: FC<Props> = (props: Props) => {
    const handleClose = useCallback(() => {
        if (!props.isLoading) {
            props.setOpen(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.isLoading])
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid },
    }: UseFormReturn<FormAddGroup> = useForm({
        defaultValues: {
            description: '',
            name: '',
            privateGroup: false,
            selfRegister: false,
        },
        mode: 'all',
        resolver: yupResolver(formAddGroupSchema),
    })
    const onSubmit = useCallback(
        (data: FormAddGroup) => {
            props.onSubmitForm?.(data)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.onSubmitForm],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            focusTrapped={false}
            title='Add Group'
            onClose={handleClose}
            open={props.open}
            classNames={{
                modal: classNames(styles.modal),
            }}
        >
            <form
                className={classNames(styles.container, props.className)}
                onSubmit={handleSubmit(onSubmit)}
            >
                <div>
                    <InputText
                        type='text'
                        name='name'
                        label='Name'
                        placeholder='Enter'
                        tabIndex={0}
                        forceUpdateValue
                        onChange={_.noop}
                        error={_.get(errors, 'name.message')}
                        inputControl={register('name')}
                        dirty
                        disabled={props.isLoading}
                    />
                    <InputTextarea
                        name='description'
                        label='Description'
                        placeholder='Enter'
                        tabIndex={0}
                        onChange={_.noop}
                        inputControl={register('description')}
                        dirty
                        disabled={props.isLoading}
                    />
                    <div className={styles.blockRadios}>
                        <Controller
                            name='privateGroup'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<
                                    FormAddGroup,
                                    'privateGroup'
                                >
                            }) {
                                return (
                                    <InputCheckbox
                                        name='privateGroup'
                                        label='Private Group'
                                        onChange={controlProps.field.onChange}
                                        checked={controlProps.field.value}
                                        disabled={props.isLoading}
                                    />
                                )
                            }}
                        />
                    </div>
                </div>
                <div className={styles.actionButtons}>
                    <Button
                        secondary
                        size='lg'
                        onClick={handleClose}
                        disabled={props.isLoading}
                    >
                        Close
                    </Button>
                    <Button
                        type='submit'
                        primary
                        size='lg'
                        disabled={props.isLoading || !isValid}
                    >
                        Save
                    </Button>
                </div>

                {props.isLoading && (
                    <div className={styles.dialogLoadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
            </form>
        </BaseModal>
    )
}

export default DialogAddGroup
