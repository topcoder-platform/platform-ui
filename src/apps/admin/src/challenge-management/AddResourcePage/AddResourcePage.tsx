/**
 * Add Resource Page.
 */
import { FC, useCallback, useContext } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, LinkButton } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import {
    useManageAddChallengeResource,
    useManageAddChallengeResourceProps,
    useOnComponentDidMount,
    useSearchUserInfo,
    useSearchUserInfoProps,
} from '../../lib/hooks'
import {
    ChallengeManagementContext,
    ChallengeManagementContextType,
    FieldHandleSelect,
    FieldSingleSelect,
    FormAddWrapper,
    InputTextAdmin,
    PageWrapper,
} from '../../lib'
import { FormAddResource, SelectOption } from '../../lib/models'
import { formAddResourceSchema } from '../../lib/utils'

import styles from './AddResourcePage.module.scss'

interface Props {
    className?: string
}

export const AddResourcePage: FC<Props> = (props: Props) => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()

    const { isLoading, doSearchUserInfo, setUserInfo }: useSearchUserInfoProps
        = useSearchUserInfo()

    const { resourceRoles, loadResourceRoles, resourceRolesLoading }: ChallengeManagementContextType
        = useContext(ChallengeManagementContext)

    const {
        doAddChallengeResource,
        isAdding,
    }: useManageAddChallengeResourceProps = useManageAddChallengeResource(challengeId)

    const navigate: NavigateFunction = useNavigate()
    const {
        control,
        handleSubmit,
        register,
        formState: { errors, isDirty },
        setValue,
    }: UseFormReturn<FormAddResource> = useForm({
        defaultValues: {
            handle: undefined,
            resourceRole: undefined,
            userId: '',
        },
        mode: 'all',
        resolver: yupResolver(formAddResourceSchema),
    })
    const onSubmit = useCallback((data: FormAddResource) => {
        doAddChallengeResource(data, () => {
            navigate('./..')
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useOnComponentDidMount(() => {
        loadResourceRoles()
    })

    return (
        <PageWrapper
            pageTitle='Add Resource'
            className={classNames(styles.container, props.className)}
        >
            <FormAddWrapper
                onSubmit={handleSubmit(onSubmit)}
                isAdding={isAdding}
                actions={(
                    <>
                        <Button
                            primary
                            size='lg'
                            type='submit'
                            disabled={isAdding || isLoading || !isDirty}
                        >
                            Add Resource
                        </Button>
                        <LinkButton
                            disabled={isAdding}
                            secondary
                            to='./..'
                            size='lg'
                        >
                            Cancel
                        </LinkButton>
                    </>
                )}
            >
                <InputTextAdmin
                    type='text'
                    name='userId'
                    label='User ID (Unfocus this field to fetch user handle)'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('userId', {
                        onBlur: e => {
                            doSearchUserInfo(
                                e.target.value,
                                userInfo => {
                                    setValue(
                                        'handle',
                                        {
                                            label: userInfo.handle,
                                            value: userInfo.userId,
                                        },
                                        {
                                            shouldValidate: true,
                                        },
                                    )
                                },
                                () => {
                                    // eslint-disable-next-line unicorn/no-null
                                    setValue('handle', null as any, { // only null value work in this place
                                        shouldValidate: true,
                                    })
                                },
                            )
                        },
                    })}
                    disabled={isAdding}
                    error={_.get(errors, 'userId.message')}
                    dirty
                    isLoading={isLoading}
                />
                <Controller
                    name='handle'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<FormAddResource, 'handle'>
                    }) {
                        return (
                            <FieldHandleSelect
                                label='Handle'
                                value={controlProps.field.value}
                                onChange={function onChange(result: SelectOption) {
                                    controlProps.field.onChange(result)
                                    const userId = `${result.value}`
                                    setUserInfo({
                                        handle: result.label as string,
                                        userId,
                                    })
                                    setValue('userId', userId, {
                                        shouldValidate: true,
                                    })
                                }}
                                onBlur={controlProps.field.onBlur}
                                error={_.get(errors, 'handle.message')}
                                dirty
                                isLoading={isLoading}
                                disabled={isAdding}
                            />
                        )
                    }}
                />
                <Controller
                    name='resourceRole'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormAddResource,
                            'resourceRole'
                        >
                    }) {
                        return (
                            <FieldSingleSelect
                                options={resourceRoles.map(resourceRole => ({
                                    label: resourceRole.name,
                                    value: resourceRole.id,
                                }))}
                                label='Resource Role'
                                placeholder='Select'
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                error={_.get(errors, 'resourceRole.message')}
                                dirty
                                disabled={isAdding}
                                isLoading={resourceRolesLoading}
                            />
                        )
                    }}
                />
            </FormAddWrapper>
        </PageWrapper>
    )
}

export default AddResourcePage
