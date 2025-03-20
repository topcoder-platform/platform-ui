/* eslint-disable complexity */
/**
 * Billing account add page.
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

import { FieldClientSelect } from '../../lib/components/FieldClientSelect'
import { useManageAddBillingAccount, useManageAddBillingAccountProps } from '../../lib/hooks'
import { BILLING_ACCOUNT_STATUS_EDIT_OPTIONS } from '../../config/index.config'
import { PageContent, PageHeader } from '../../lib'
import { FormEditBillingAccount, SelectOption } from '../../lib/models'
import { formEditBillingAccountSchema } from '../../lib/utils'

import styles from './BillingAccountNewPage.module.scss'

interface Props {
    className?: string
}

export const BillingAccountNewPage: FC<Props> = (props: Props) => {
    const navigate: NavigateFunction = useNavigate()
    const maxDate = useMemo(() => moment()
        .add(20, 'y')
        .toDate(), [])
    const { accountId = '' }: { accountId?: string } = useParams<{
        accountId: string
    }>()
    const {
        isLoading,
        isAdding,
        isUpdating,
        doAddBillingAccount,
        doUpdateBillingAccount,
        billingAccount,
    }: useManageAddBillingAccountProps = useManageAddBillingAccount(accountId)
    const pageTitle = useMemo(
        () => (accountId ? 'Edit Billing Account' : 'New Billing Account'),
        [accountId],
    )
    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors, isDirty },
    }: UseFormReturn<FormEditBillingAccount> = useForm({
        defaultValues: {
            salesTax: 0,
            status: 'Active',
        },
        mode: 'all',
        resolver: yupResolver(formEditBillingAccountSchema),
    })

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
    const onSubmit = useCallback(
        (data: FormEditBillingAccount) => {
            if (accountId) {
                doUpdateBillingAccount(data, () => {
                    navigate('./../..')
                })
            } else {
                doAddBillingAccount(data, () => {
                    navigate('./..')
                })
            }
        },
        [
            doAddBillingAccount,
            accountId,
            doUpdateBillingAccount,
            navigate,
        ],
    )

    useEffect(() => {
        if (billingAccount) {
            reset({
                budgetAmount: billingAccount.budgetAmount,
                client: billingAccount.client
                    ? {
                        id: billingAccount.client.id,
                        name: billingAccount.client.name,
                    }
                    : undefined,
                companyId: billingAccount.companyId,
                description: billingAccount.description,
                endDate: billingAccount.endDate,
                name: billingAccount.name,
                paymentTerms: billingAccount.paymentTerms
                    ? parseInt(billingAccount.paymentTerms, 10) ?? 0
                    : undefined,
                poNumber: billingAccount.poNumber,
                salesTax: billingAccount.salesTax,
                startDate: billingAccount.startDate,
                status: billingAccount.status,
                subscriptionNumber: billingAccount.subscriptionNumber
                    ? parseInt(billingAccount.subscriptionNumber, 10)
                    : undefined,
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billingAccount])

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
                                to={accountId ? './../..' : './..'}
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
                                disabled={isAdding || isUpdating}
                                error={_.get(errors, 'name.message')}
                                dirty
                            />
                            <InputText
                                type='number'
                                name='companyId'
                                label='Customer Number'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('companyId')}
                                disabled={isAdding || isUpdating}
                                error={_.get(errors, 'companyId.message')}
                                dirty
                            />
                            <Controller
                                name='startDate'
                                control={control}
                                render={function render(controlProps: {
                                    field: ControllerRenderProps<
                                        FormEditBillingAccount,
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
                                            disabled={isAdding || isUpdating}
                                            placeholder='Select date'
                                            isClearable
                                            error={_.get(
                                                errors,
                                                'startDate.message',
                                            )}
                                            dirty
                                            maxDate={maxStartDate}
                                        />
                                    )
                                }}
                            />
                            <Controller
                                name='endDate'
                                control={control}
                                render={function render(controlProps: {
                                    field: ControllerRenderProps<
                                        FormEditBillingAccount,
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
                                            disabled={isAdding || isUpdating}
                                            placeholder='Select date'
                                            isClearable
                                            error={_.get(
                                                errors,
                                                'endDate.message',
                                            )}
                                            dirty
                                            minDate={minEndDate}
                                            maxDate={maxDate}
                                        />
                                    )
                                }}
                            />
                            <Controller
                                name='status'
                                control={control}
                                render={function render(controlProps: {
                                    field: ControllerRenderProps<
                                        FormEditBillingAccount,
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
                            <InputText
                                type='number'
                                name='budgetAmount'
                                label='Amount'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('budgetAmount')}
                                disabled={isAdding || isUpdating}
                                error={_.get(errors, 'budgetAmount.message')}
                                dirty
                            />
                            <InputText
                                type='text'
                                name='poNumber'
                                label='PO Number'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('poNumber')}
                                disabled={isAdding || isUpdating}
                                error={_.get(errors, 'poNumber.message')}
                                dirty
                            />
                            <InputText
                                type='number'
                                name='subscriptionNumber'
                                label='Subscription Number'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('subscriptionNumber')}
                                disabled={isAdding || isUpdating}
                                error={_.get(
                                    errors,
                                    'subscriptionNumber.message',
                                )}
                                dirty
                            />
                            <InputText
                                type='textarea'
                                name='description'
                                label='Description'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('description')}
                                disabled={isAdding || isUpdating}
                                error={_.get(errors, 'description.message')}
                                dirty
                            />
                            <InputText
                                type='number'
                                name='paymentTerms'
                                label='Payment Terms'
                                placeholder='Enter'
                                tabIndex={0}
                                onChange={_.noop}
                                classNameWrapper={styles.field}
                                inputControl={register('paymentTerms')}
                                disabled={isAdding || isUpdating}
                                error={_.get(errors, 'paymentTerms.message')}
                                dirty
                            />

                            <Controller
                                name='client'
                                control={control}
                                render={function render(controlProps: {
                                    field: ControllerRenderProps<
                                        FormEditBillingAccount,
                                        'client'
                                    >
                                }) {
                                    return (
                                        <FieldClientSelect
                                            label='Client (Start typing...)'
                                            placeholder='Enter client you are searching for...'
                                            onChange={function onChange(item: SelectOption) {
                                                controlProps.field.onChange({
                                                    id: item.value as number,
                                                    name: item.label,
                                                })
                                            }}
                                            value={
                                                controlProps.field.value
                                                    ? {
                                                        label: controlProps
                                                            .field.value.name,
                                                        value: controlProps
                                                            .field.value.id,
                                                    }
                                                    : controlProps.field.value
                                            }
                                            error={_.get(
                                                errors,
                                                'client.message',
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
                                    isAdding
                                    || isUpdating
                                    || !isDirty
                                }
                            >
                                Save Changes
                            </Button>

                            <LinkButton
                                secondary
                                to={accountId ? './../..' : './..'}
                                size='lg'
                            >
                                Cancel
                            </LinkButton>
                        </div>

                        {(isAdding || isUpdating) && (
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

export default BillingAccountNewPage
