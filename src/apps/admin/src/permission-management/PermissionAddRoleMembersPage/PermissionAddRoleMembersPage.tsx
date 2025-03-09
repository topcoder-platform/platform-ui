/**
 * Permission add role members page.
 */
import { FC, useCallback, useContext } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    Button,
    LinkButton,
    LoadingSpinner,
    PageDivider,
    PageTitle,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { useManageAddRoleMembers, useManageAddRoleMembersProps } from '../../lib/hooks'
import { InputHandlesSelector } from '../../lib/components/InputHandlesSelector'
import { AdminAppContext, PageContent, PageHeader } from '../../lib'
import { AdminAppContextType } from '../../lib/models'
import { FormAddRoleMembers } from '../../lib/models/FormAddRoleMembers.type'
import { formAddRoleMembersSchema } from '../../lib/utils'

import styles from './PermissionAddRoleMembersPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Add Role Members'

export const PermissionAddRoleMembersPage: FC<Props> = (props: Props) => {
    const navigate: NavigateFunction = useNavigate()
    const { setUserFromSearch }: AdminAppContextType
        = useContext(AdminAppContext)
    const {
        control,
        handleSubmit,
        formState: { isValid },
    }: UseFormReturn<FormAddRoleMembers> = useForm({
        defaultValues: {
            userHandles: [],
        },
        mode: 'all',
        resolver: yupResolver(formAddRoleMembersSchema),
    })
    const { roleId = '' }: { roleId?: string } = useParams<{
        roleId: string
    }>()
    const {
        isLoading,
        roleInfo,
        isAdding,
        doAddRole,
    }: useManageAddRoleMembersProps = useManageAddRoleMembers(roleId)
    const onSubmit = useCallback(
        (data: FormAddRoleMembers) => {
            setUserFromSearch(data.userHandles)
            doAddRole(data.userHandles, () => {
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
            {isLoading ? (
                <PageContent>
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                    <div className={styles.blockForm}>
                        <div className={styles.blockBtns}>
                            <LinkButton secondary to='./..' size='lg'>
                                Cancel
                            </LinkButton>
                        </div>
                    </div>
                </PageContent>
            ) : (
                <PageContent>
                    <h4 className={styles.textTableTitle}>
                        {roleInfo?.roleName}
                    </h4>
                    <PageDivider />
                    <form
                        className={styles.blockForm}
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <Controller
                            name='userHandles'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<
                                    FormAddRoleMembers,
                                    'userHandles'
                                >
                            }) {
                                return (
                                    <InputHandlesSelector
                                        disabled={isAdding}
                                        label='User Handles'
                                        placeholder='Enter handles you are searching for...'
                                        onChange={controlProps.field.onChange}
                                        value={controlProps.field.value}
                                    />
                                )
                            }}
                        />

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
            )}
        </div>
    )
}

export default PermissionAddRoleMembersPage
