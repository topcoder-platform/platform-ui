/**
 * Form Add SSO Login.
 */
import { FC, useCallback, useEffect, useMemo } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, InputSelectReact, InputText } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormAddSSOLoginData } from '../../models/FormAddSSOLoginData.model'
import { SSOLoginProvider, SSOUserLogin } from '../../models'
import { formAddSSOLoginSchema } from '../../utils'

import styles from './FormAddSSOLogin.module.scss'

interface Props {
    className?: string
    isAdding: boolean
    onSubmit: (data: FormAddSSOLoginData) => void
    onCancel: () => void
    providers: SSOLoginProvider[]
    editingData?: SSOUserLogin
}

export const FormAddSSOLogin: FC<Props> = (props: Props) => {
    const isEditing = !!props.editingData
    const providerOptions = useMemo(
        () => props.providers.map(item => ({
            label: item.name,
            value: item.name,
        })),
        [props.providers],
    )
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isValid, isDirty },
    }: UseFormReturn<FormAddSSOLoginData> = useForm({
        defaultValues: {
            email: '',
            name: '',
            provider: '',
            userId: '',
        },
        mode: 'all',
        resolver: yupResolver(formAddSSOLoginSchema),
    })
    const onSubmit = useCallback(
        (data: FormAddSSOLoginData) => {
            props.onSubmit(data)
        },
        [props.onSubmit],
    )

    useEffect(() => {
        if (props.editingData) {
            reset({
                email: props.editingData.email,
                name: props.editingData.name,
                provider: props.editingData.provider,
                userId: props.editingData.userId,
            })
        }
    }, [props.editingData])

    return (
        <form
            className={classNames(styles.container, props.className)}
            onSubmit={handleSubmit(onSubmit)}
        >
            <span>
                {isEditing ? 'Edit' : 'Add'}
                {' '}
                SSO Login
            </span>
            <div>
                <InputText
                    type='text'
                    name='userId'
                    label='User Id'
                    placeholder='Enter'
                    tabIndex={0}
                    forceUpdateValue
                    onChange={_.noop}
                    error={_.get(errors, 'userId.message')}
                    inputControl={register('userId')}
                    dirty
                    disabled={props.isAdding}
                />
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
                    disabled={props.isAdding}
                />
                <Controller
                    name='provider'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormAddSSOLoginData,
                            'provider'
                        >
                    }) {
                        return (
                            <InputSelectReact
                                name='provider'
                                label='Provider'
                                placeholder='Select'
                                options={providerOptions}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                classNameWrapper={styles.inputField}
                                disabled={props.isAdding || isEditing}
                                dirty
                                error={_.get(errors, 'provider.message')}
                            />
                        )
                    }}
                />
                <InputText
                    type='text'
                    name='email'
                    label='Email'
                    placeholder='Enter'
                    tabIndex={0}
                    forceUpdateValue
                    onChange={_.noop}
                    error={_.get(errors, 'email.message')}
                    inputControl={register('email')}
                    dirty
                    disabled={props.isAdding}
                />
            </div>
            <div className={styles.actionButtons}>
                <Button
                    secondary
                    size='lg'
                    onClick={props.onCancel}
                    disabled={props.isAdding}
                >
                    Cancel
                </Button>
                <Button
                    type='submit'
                    primary
                    size='lg'
                    disabled={props.isAdding || !isValid || !isDirty}
                >
                    Save
                </Button>
            </div>
        </form>
    )
}

export default FormAddSSOLogin
