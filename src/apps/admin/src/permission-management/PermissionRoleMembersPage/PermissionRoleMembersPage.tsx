/**
 * Permission role members page.
 */
import { FC, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { Button, LinkButton, LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'
import { downloadBlob } from '~/libs/shared/lib/utils/files'
import { PlusIcon } from '@heroicons/react/solid'

import { useManagePermissionRoleMembers, useManagePermissionRoleMembersProps } from '../../lib/hooks'
import { PageContent, PageHeader } from '../../lib'
import { RoleMembersFilters } from '../../lib/components/RoleMembersFilters'
import { RoleMembersTable } from '../../lib/components/RoleMembersTable'
import { exportRoleUsersCsv } from '../../lib/services'
import { handleError } from '../../lib/utils'

import styles from './PermissionRoleMembersPage.module.scss'

interface Props {
    className?: string
}
const pageTitle = 'Role Members'

const normalizeFileNameSegment = (value: string): string => (
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
)

const buildRoleExportFileName = (roleName: string | undefined, roleId: string): string => {
    const normalizedName = normalizeFileNameSegment(roleName || roleId)
    return `role-users-${normalizedName || roleId}.csv`
}

export const PermissionRoleMembersPage: FC<Props> = (props: Props) => {
    const { roleId = '' }: { roleId?: string } = useParams<{
        roleId: string
    }>()
    const [isExporting, setIsExporting] = useState<boolean>(false)
    const {
        isLoading,
        roleInfo,
        roleMembers,
        page,
        totalPages,
        onPageChange,
        doFilterRoleMembers,
        isFiltering,
        isRemoving,
        isRemovingBool,
        doRemoveRoleMember,
        doRemoveRoleMembers,
    }: useManagePermissionRoleMembersProps = useManagePermissionRoleMembers(roleId)

    const pageTitleWithRole = roleInfo?.roleName ? `${pageTitle}: ${roleInfo.roleName}` : pageTitle
    const handleExport = useCallback(() => {
        if (!roleId || isExporting) {
            return
        }

        setIsExporting(true)
        exportRoleUsersCsv(roleId)
            .then(blob => {
                downloadBlob(
                    blob,
                    buildRoleExportFileName(roleInfo?.roleName, roleId),
                )
            })
            .catch(error => {
                handleError(error)
            })
            .finally(() => {
                setIsExporting(false)
            })
    }, [isExporting, roleId, roleInfo?.roleName])

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitleWithRole}</PageTitle>
            <PageHeader>
                <h3>{pageTitleWithRole}</h3>
                <div className={styles.headerActions}>
                    <Button
                        primary
                        size='lg'
                        disabled={!roleId || isExporting}
                        onClick={handleExport}
                    >
                        {isExporting ? 'exporting...' : 'export'}
                    </Button>
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
                            {roleInfo?.roleName === 'Topcoder Talent' ? (
                                <p className={styles.noRecordFound}>
                                    This role has too many members to display
                                </p>
                            ) : roleMembers.length === 0 ? (
                                <p className={styles.noRecordFound}>No members</p>
                            ) : (
                                <div className={styles.blockTableContainer}>
                                    <RoleMembersTable
                                        isRemoving={isRemoving}
                                        isRemovingBool={isRemovingBool}
                                        datas={roleMembers}
                                        page={page}
                                        totalPages={totalPages}
                                        onPageChange={onPageChange}
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
