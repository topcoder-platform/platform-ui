/**
 * Permission add group members page.
 */
import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
} from 'react'
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
    InputRadio,
    LinkButton,
    LoadingSpinner,
    PageDivider,
    PageTitle,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { InputGroupSelector } from '../../lib/components/InputGroupSelector'
import { InputHandlesSelector } from '../../lib/components/InputHandlesSelector'
import { useManagePermissionGroups, useManagePermissionGroupsProps } from '../../lib/hooks'
import { AdminAppContext, PageContent, PageHeader } from '../../lib'
import {
    AdminAppContextType,
    FormAddGroupMembers,
    SelectOption,
} from '../../lib/models'
import { formAddGroupMembersSchema } from '../../lib/utils'
import { useManageAddGroupMembers, useManageAddGroupMembersProps } from '../../lib/hooks/useManageAddGroupMembers'

import styles from './PermissionAddGroupMembersPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Add Group Members'

const membershipTypes: ('user' | 'group')[] = ['user', 'group']

export const PermissionAddGroupMembersPage: FC<Props> = (props: Props) => {
    const navigate: NavigateFunction = useNavigate()
    const { groupId = '' }: { groupId?: string } = useParams<{
        groupId: string
    }>()
    const {
        control,
        handleSubmit,
        watch,
        formState: { isValid },
    }: UseFormReturn<FormAddGroupMembers> = useForm({
        defaultValues: {
            groupIds: [],
            membershipType: 'user',
            userHandles: [],
        },
        mode: 'all',
        resolver: yupResolver(formAddGroupMembersSchema),
    })
    const membershipType = watch('membershipType')

    const {
        usersMapping,
        setUserFromSearch,
        setGroupFromSearch,
        loadGroup,
        groupsMapping,
    }: AdminAppContextType = useContext(AdminAppContext)

    const loadingGroup = useMemo(
        () => !groupsMapping[groupId],
        [groupsMapping, groupId],
    )

    useEffect(() => {
        loadGroup(groupId)
    }, [groupId, loadGroup])

    const { isLoading: isLoadingGroups, groups }: useManagePermissionGroupsProps = useManagePermissionGroups(
        _.noop,
        _.noop,
        usersMapping,
    )
    const { isAdding, doAddGroup }: useManageAddGroupMembersProps = useManageAddGroupMembers(groupId)

    const groupsOptions = useMemo<SelectOption[]>(
        () => groups.map(item => ({
            label: item.id,
            value: item.name,
        })),
        [groups],
    )
    const onSubmit = useCallback(
        (data: FormAddGroupMembers) => {
            let ids: string[] = []
            if (data.membershipType === 'user' && data.userHandles) {
                setUserFromSearch(data.userHandles)
                ids = data.userHandles.map(item => `${item.userId}`)
            }

            if (data.membershipType === 'group' && data.groupIds) {
                setGroupFromSearch(data.groupIds)
                ids = data.groupIds.map(item => `${item.label}`)
            }

            doAddGroup(data.membershipType, ids, () => {
                navigate('./..')
            })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )
    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>
            {loadingGroup ? (
                <PageContent>
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                </PageContent>
            ) : (
                <PageContent>
                    <h4 className={styles.textTableTitle}>
                        {groupsMapping[groupId]}
                    </h4>
                    <PageDivider />
                    <form
                        className={styles.blockForm}
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div className={styles.blockFormFields}>
                            <div className={styles.blockFieldRadio}>
                                <span className={styles.textRadiosLabel}>
                                    Add member of type
                                </span>
                                <Controller
                                    name='membershipType'
                                    control={control}
                                    render={function render(controlProps: {
                                        field: ControllerRenderProps<
                                            FormAddGroupMembers,
                                            'membershipType'
                                        >
                                    }) {
                                        return (
                                            <div
                                                className={styles.formRadioBtn}
                                            >
                                                {membershipTypes.map(item => (
                                                    <InputRadio
                                                        key={item}
                                                        label={item}
                                                        name='membershipType'
                                                        id={item}
                                                        value={item}
                                                        checked={item === controlProps.field.value}
                                                        onChange={function t() {
                                                            controlProps.field.onChange(
                                                                item,
                                                            )
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )
                                    }}
                                />
                            </div>
                            {membershipType === 'user' && (
                                <Controller
                                    name='userHandles'
                                    control={control}
                                    render={function render(controlProps: {
                                        field: ControllerRenderProps<
                                            FormAddGroupMembers,
                                            'userHandles'
                                        >
                                    }) {
                                        return (
                                            <InputHandlesSelector
                                                label='User Handles'
                                                placeholder='Enter handles you are searching for...'
                                                value={controlProps.field.value}
                                                onChange={
                                                    controlProps.field.onChange
                                                }
                                            />
                                        )
                                    }}
                                />
                            )}
                            {membershipType === 'group' && (
                                <Controller
                                    name='groupIds'
                                    control={control}
                                    render={function render(controlProps: {
                                        field: ControllerRenderProps<
                                            FormAddGroupMembers,
                                            'groupIds'
                                        >
                                    }) {
                                        return (
                                            <InputGroupSelector
                                                label='Group IDs'
                                                placeholder='Enter group ids you are searching for...'
                                                value={controlProps.field.value}
                                                onChange={
                                                    controlProps.field.onChange
                                                }
                                                options={groupsOptions}
                                                isLoading={isLoadingGroups}
                                            />
                                        )
                                    }}
                                />
                            )}
                        </div>

                        <div className={styles.blockBtns}>
                            <Button
                                primary
                                size='lg'
                                type='submit'
                                disabled={!isValid || isAdding}
                            >
                                Add Members
                            </Button>
                            <LinkButton
                                disabled={isAdding}
                                secondary
                                to='./..'
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

export default PermissionAddGroupMembersPage
