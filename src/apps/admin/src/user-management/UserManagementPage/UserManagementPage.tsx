/**
 * Page ui for user management.
 */
import { FC, useState } from 'react'
import classNames from 'classnames'

import { LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'

import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { PageContent, PageHeader } from '../../lib'
import { UsersFilters } from '../../lib/components/UsersFilters'
import { UsersTable } from '../../lib/components/UsersTable'
import { useManageUsers, useManageUsersProps } from '../../lib/hooks'

import styles from './UserManagementPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'User Management'

export const UserManagementPage: FC<Props> = (props: Props) => {
    const [isSearched, setIsSearched] = useState(false)
    const {
        users,
        doSearchUsers,
        isLoading,
        updatingStatus,
        doUpdateStatus,
        page,
        totalPages,
        onPageChange,
    }: useManageUsersProps = useManageUsers()

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>
            <PageContent>
                <UsersFilters
                    onFindMembers={function onFindMembers(filter: string) {
                        doSearchUsers(filter)
                        setIsSearched(true)
                    }}
                    isLoading={isLoading}
                />
                <PageDivider />
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        {users.length === 0 && isSearched ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <UsersTable
                                allUsers={users}
                                page={page}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                                updatingStatus={updatingStatus}
                                doUpdateStatus={doUpdateStatus}
                            />
                        )}
                    </>
                )}
            </PageContent>
        </div>
    )
}

export default UserManagementPage
