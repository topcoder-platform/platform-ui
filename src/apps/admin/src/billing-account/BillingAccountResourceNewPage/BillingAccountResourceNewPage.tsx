/**
 * Billing account resource new page.
 */
import { FC, useCallback, useEffect, useRef } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import {
    Button,
    InputSelect,
    InputText,
    LinkButton,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { useManageAddBillingAccountResource, useManageAddBillingAccountResourceProps } from '../../lib/hooks'
import { BILLING_ACCOUNT_RESOURCE_STATUS_EDIT_OPTIONS } from '../../config/index.config'
import { FormNewBillingAccountResource } from '../../lib/models'
import { PageContent, PageHeader } from '../../lib'
import { formNewBillingAccountResourceSchema } from '../../lib/utils'

import styles from './BillingAccountResourceNewPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'New Billing Account Resource'

export const BillingAccountResourceNewPage: FC<Props> = (props: Props) => {
    const navigate: NavigateFunction = useNavigate()
    const { accountId = '' }: { accountId?: string } = useParams<{
        accountId: string
    }>()
    const {
        isLoading,
        isAdding,
        userInfo,
        doSearchUserInfo,
        doAddBillingAccountResource,
    }: useManageAddBillingAccountResourceProps = useManageAddBillingAccountResource(accountId)
    const shouldValidateUserId = useRef(false)
    const {
        control,
        handleSubmit,
        register,
        formState: { errors },
        setValue,
    }: UseFormReturn<FormNewBillingAccountResource> = useForm({
        defaultValues: {
            name: '',
            status: 'active',
            userId: '',
        },
        mode: 'all',
        resolver: yupResolver(formNewBillingAccountResourceSchema),
    })
    const onSubmit = useCallback(
        (data: FormNewBillingAccountResource) => {
            doAddBillingAccountResource(data, () => {
                navigate('./..')
            })
        },
        [doAddBillingAccountResource, navigate],
    )

    useEffect(() => {
        setValue('userId', userInfo?.id ?? '', {
            shouldValidate: shouldValidateUserId.current,
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo])

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>
            <PageContent>
                <form
                    className={styles.blockForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className={styles.blockFields}>
                        <InputText
                            type='text'
                            name='name'
                            label='TC Handle (Unfocus this field to fetch user id)'
                            placeholder='Enter'
                            tabIndex={0}
                            onChange={_.noop}
                            classNameWrapper={styles.field}
                            inputControl={register('name', {
                                onBlur: e => {
                                    shouldValidateUserId.current = true
                                    doSearchUserInfo(e.target.value)
                                },
                            })}
                            disabled={isAdding}
                            error={_.get(errors, 'name.message')}
                            dirty
                            isLoading={isLoading}
                        />
                        <Controller
                            name='status'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<
                                    FormNewBillingAccountResource,
                                    'status'
                                >
                            }) {
                                return (
                                    <InputSelect
                                        name='status'
                                        label='Status'
                                        placeholder='Select'
                                        options={
                                            BILLING_ACCOUNT_RESOURCE_STATUS_EDIT_OPTIONS
                                        }
                                        value={controlProps.field.value}
                                        onChange={controlProps.field.onChange}
                                        classNameWrapper={styles.field}
                                        error={_.get(errors, 'status.message')}
                                        dirty
                                    />
                                )
                            }}
                        />
                        <InputText
                            type='text'
                            name='userId'
                            label='User ID'
                            placeholder='User ID'
                            tabIndex={0}
                            onChange={_.noop}
                            classNameWrapper={styles.fieldUserId}
                            inputControl={register('userId')}
                            disabled
                            error={_.get(errors, 'userId.message')}
                            dirty
                            isLoading={isLoading}
                        />
                    </div>

                    <div className={styles.blockBtns}>
                        <Button
                            primary
                            size='lg'
                            type='submit'
                            disabled={isAdding || isLoading}
                        >
                            Save Changes
                        </Button>
                        <LinkButton
                            secondary
                            to='./..'
                            size='lg'
                            disabled={isAdding}
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
        </div>
    )
}

export default BillingAccountResourceNewPage
