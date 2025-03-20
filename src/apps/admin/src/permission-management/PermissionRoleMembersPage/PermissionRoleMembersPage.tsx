/**
 * Permission role members page.
 */
import { FC } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { LinkButton, LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'

import { useManagePermissionRoleMembers, useManagePermissionRoleMembersProps } from '../../lib/hooks'
import { PageContent, PageHeader } from '../../lib'
import { RoleMembersFilters } from '../../lib/components/RoleMembersFilters'
import { RoleMembersTable } from '../../lib/components/RoleMembersTable'

import styles from './PermissionRoleMembersPage.module.scss'

interface Props {
    className?: string
}
const pageTitle = 'Role Members'

export const PermissionRoleMembersPage: FC<Props> = (props: Props) => {
    const { roleId = '' }: { roleId?: string } = useParams<{
        roleId: string
    }>()
    const {
        isLoading,
        roleInfo,
        roleMembers,
        doFilterRoleMembers,
        isFiltering,
        isRemoving,
        isRemovingBool,
        doRemoveRoleMember,
        doRemoveRoleMembers,
    }: useManagePermissionRoleMembersProps = useManagePermissionRoleMembers(roleId)

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
                <div className={styles.headerActions}>
                    <LinkButton
                        primary
                        size='lg'
                        to='add'
                        icon={PlusIcon}
                        iconToLeft
                        label='add members'
                    />
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </div>
            </PageHeader>
            {isLoading ? (
                <PageContent>
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                </PageContent>
            ) : (
                <PageContent>
                    <h4 className={styles.textTableTitle}>
                        {roleInfo?.roleName}
                    </h4>
                    <PageDivider />
                    <RoleMembersFilters
                        isLoading={isFiltering || isRemovingBool}
                        onSubmitForm={doFilterRoleMembers}
                    />
                    <PageDivider />
                    {isFiltering ? (
                        <div className={styles.loadingSpinnerContainer}>
                            <LoadingSpinner className={styles.spinner} />
                        </div>
                    ) : (
                        <>
                            {roleMembers.length === 0 ? (
                                <p className={styles.noRecordFound}>
                                    No members
                                </p>
                            ) : (
                                <div className={styles.blockTableContainer}>
                                    <RoleMembersTable
                                        isRemoving={isRemoving}
                                        isRemovingBool={isRemovingBool}
                                        datas={roleMembers}
                                        doRemoveRoleMember={doRemoveRoleMember}
                                        doRemoveRoleMembers={doRemoveRoleMembers}
                                    />

                                    {isRemovingBool && (
                                        <div className={styles.blockActionLoading}>
                                            <LoadingSpinner className={styles.spinner} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </PageContent>
            )}
        </div>
    )
}

export default PermissionRoleMembersPage
