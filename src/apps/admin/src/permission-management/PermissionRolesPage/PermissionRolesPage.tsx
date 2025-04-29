/**
 * Permission roles page.
 */
import { FC, useContext } from 'react'
import classNames from 'classnames'

import { LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'

import {
    useManagePermissionRoles,
    useManagePermissionRolesProps,
} from '../../lib/hooks'
import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { AdminAppContext, PageContent, PageHeader } from '../../lib'
import { AdminAppContextType, TableRolesFilter } from '../../lib/models'
import { RolesFilter } from '../../lib/components/RolesFilter'
import { RolesTable } from '../../lib/components/RolesTable'

import styles from './PermissionRolesPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Roles'

export const PermissionRolesPage: FC<Props> = (props: Props) => {
    const { loadUser, usersMapping }: AdminAppContextType
        = useContext(AdminAppContext)
    const {
        isLoading,
        roles,
        doAddRole,
        isAdding,
        doFilterRole,
    }: useManagePermissionRolesProps = useManagePermissionRoles(
        loadUser,
        usersMapping,
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>
            <PageContent>
                <RolesFilter
                    isLoading={isLoading}
                    isAdding={isAdding}
                    setFilters={function setFilters(
                        filterDatas: TableRolesFilter,
                    ) {
                        doFilterRole(filterDatas)
                    }}
                    doAddRole={doAddRole}
                    roles={roles}
                />
                <PageDivider />
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        {roles.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <RolesTable
                                datas={roles}
                                usersMapping={usersMapping}
                            />
                        )}
                    </>
                )}
            </PageContent>
        </div>
    )
}

export default PermissionRolesPage
