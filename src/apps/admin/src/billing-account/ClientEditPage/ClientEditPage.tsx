/**
 * Billing account client edit page.
 */
import { FC, useCallback, useEffect, useMemo } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import {
    Button,
    InputDatePicker,
    InputSelect,
    InputText,
    LinkButton,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { useManageAddClient, useManageAddClientProps } from '../../lib/hooks'
import { BILLING_ACCOUNT_STATUS_EDIT_OPTIONS } from '../../config/index.config'
import { FormEditClient } from '../../lib/models'
import { PageContent, PageHeader } from '../../lib'
import { formEditClientSchema } from '../../lib/utils'

import styles from './ClientEditPage.module.scss'

interface Props {
    className?: string
}

export const ClientEditPage: FC<Props> = (props: Props) => {
    const navigate: NavigateFunction = useNavigate()
    const maxDate = useMemo(() => moment()
        .add(20, 'y')
        .toDate(), [])
    const { clientId = '' }: { clientId?: string } = useParams<{
        clientId: string
    }>()
    const pageTitle = useMemo(
        () => (clientId ? 'Edit Client' : 'New Client'),
        [clientId],
    )
    const {
        isLoading,
        isAdding,
        isUpdating,
        doAddClientInfo,
        doUpdateClientInfo,
        clientInfo,
    }: useManageAddClientProps = useManageAddClient(clientId)
    const {
        register,
        handleSubmit,
        control,
        formState: { isValid, errors, isDirty },
        watch,
        reset,
    }: UseFormReturn<FormEditClient> = useForm({
        defaultValues: {
            status: 'Active',
        },
        mode: 'all',
        resolver: yupResolver(formEditClientSchema),
    })

    useEffect(() => {
        if (clientInfo) {
            reset({
                codeName: clientInfo.codeName,
                endDate: clientInfo.endDate,
                name: clientInfo.name,
                startDate: clientInfo.startDate,
                status: clientInfo.status,
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientInfo])

    const endDate = watch('endDate')
    const startDate = watch('startDate')
    const maxStartDate = useMemo(
        () => (endDate ?? maxDate),
        [maxDate, endDate],
    )
    const minEndDate = useMemo(
        () => (startDate ?? new Date()),
        [startDate],
    )
    const onSubmit = useCallback((data: FormEditClient) => {
        if (clientId) {
            doUpdateClientInfo(data, () => {
                navigate('./../..')
            })
        } else {
            doAddClientInfo(data, () => {
                navigate('./..')
            })
        }
    }, [
        clientId,
        doAddClientInfo,
        doUpdateClientInfo,
        navigate,
    ])

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>
            {isLoading ? (
                <PageContent>
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                    <div className={styles.blockForm}>
                        <div className={styles.blockBottom}>
                            <LinkButton
                                secondary
                                to={clientId ? './../..' : './..'}
                                size='lg'
                            >
                                Cancel
                            </LinkButton>
                        </div>
                    </div>
                </PageContent>
            ) : (
                <PageContent>
                    <form
                        className={styles.blockForm}
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div className={styles.blockFields}>
                            <InputText
                                type='text'
                                name='name'
                                label='Name'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('name')}
                                error={_.get(errors, 'name.message')}
                                dirty
                                disabled={isAdding || isUpdating}
                            />
                            <InputText
                                type='text'
                                name='codeName'
                                label='Code Name'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('codeName')}
                                error={_.get(errors, 'name.message')}
                                dirty
                                disabled={isAdding || isUpdating}
                            />
                            <Controller
                                name='startDate'
                                control={control}
                                render={function render(controlProps: {
                                    field: ControllerRenderProps<
                                        FormEditClient,
                                        'startDate'
                                    >
                                }) {
                                    return (
                                        <InputDatePicker
                                            label='Start Date'
                                            date={controlProps.field.value}
                                            onChange={
                                                controlProps.field.onChange
                                            }
                                            placeholder='Select date'
                                            isClearable
                                            error={_.get(
                                                errors,
                                                'startDate.message',
                                            )}
                                            maxDate={maxStartDate}
                                            dirty
                                            disabled={isAdding || isUpdating}
                                        />
                                    )
                                }}
                            />
                            <Controller
                                name='endDate'
                                control={control}
                                render={function render(controlProps: {
                                    field: ControllerRenderProps<
                                        FormEditClient,
                                        'endDate'
                                    >
                                }) {
                                    return (
                                        <InputDatePicker
                                            label='End Date'
                                            date={controlProps.field.value}
                                            onChange={
                                                controlProps.field.onChange
                                            }
                                            placeholder='Select date'
                                            isClearable
                                            error={_.get(
                                                errors,
                                                'endDate.message',
                                            )}
                                            minDate={minEndDate}
                                            maxDate={maxDate}
                                            dirty
                                            disabled={isAdding || isUpdating}
                                        />
                                    )
                                }}
                            />
                            <Controller
                                name='status'
                                control={control}
                                render={function render(controlProps: {
                                    field: ControllerRenderProps<
                                        FormEditClient,
                                        'status'
                                    >
                                }) {
                                    return (
                                        <InputSelect
                                            name='status'
                                            label='Status'
                                            placeholder='Select'
                                            options={
                                                BILLING_ACCOUNT_STATUS_EDIT_OPTIONS
                                            }
                                            value={controlProps.field.value}
                                            onChange={
                                                controlProps.field.onChange
                                            }
                                            classNameWrapper={styles.field}
                                            error={_.get(
                                                errors,
                                                'status.message',
                                            )}
                                            dirty
                                            disabled={isAdding || isUpdating}
                                        />
                                    )
                                }}
                            />
                        </div>

                        <div className={styles.blockBottom}>
                            <Button
                                primary
                                size='lg'
                                type='submit'
                                disabled={
                                    !isValid
                                    || isAdding
                                    || isUpdating
                                    || !isDirty
                                }
                            >
                                Save Changes
                            </Button>

                            <LinkButton
                                secondary
                                to={clientId ? './../..' : './..'}
                                size='lg'
                            >
                                Cancel
                            </LinkButton>
                        </div>

                        {isAdding && (
                            <div className={styles.blockActionLoading}>
                                <LoadingSpinner className={styles.spinner} />
                            </div>
                        )}
                    </form>
                </PageContent>
            )}
        </div>
    )
}

export default ClientEditPage
