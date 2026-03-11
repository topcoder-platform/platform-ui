/**
 * Permission group members page.
 */
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import {
    Button,
    LinkButton,
    LoadingSpinner,
    PageDivider,
    PageTitle,
} from '~/libs/ui'
import { downloadBlob } from '~/libs/shared/lib/utils/files'
import { PlusIcon } from '@heroicons/react/solid'

import { GroupMembersFilters } from '../../lib/components/GroupMembersFilters'
import { GroupMembersTable } from '../../lib/components/GroupMembersTable'
import { useManagePermissionGroupMembers, useManagePermissionGroupMembersProps } from '../../lib/hooks'
import { AdminAppContext, PageContent, PageHeader } from '../../lib'
import { AdminAppContextType, FormGroupMembersFilters, UserGroupMember } from '../../lib/models'
import { useTableSelection, useTableSelectionProps } from '../../lib/hooks/useTableSelection'
import { exportGroupUsersCsv } from '../../lib/services'
import { handleError } from '../../lib/utils'

import styles from './PermissionGroupMembersPage.module.scss'

interface Props {
    className?: string
}
const pageTitle = 'Group Members'

const normalizeFileNameSegment = (value: string): string => (
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
)

const buildGroupExportFileName = (groupName: string | undefined, groupId: string): string => {
    const normalizedName = normalizeFileNameSegment(groupName || groupId)
    return `group-users-${normalizedName || groupId}.csv`
}

export const PermissionGroupMembersPage: FC<Props> = (props: Props) => {
    const memberTypes = useMemo(() => ['group', 'user'], [])
    const { groupId = '' }: { groupId?: string } = useParams<{
        groupId: string
    }>()
    const {
        loadGroup,
        groupsMapping,
        loadUser,
        usersMapping,
        cancelLoadUser,
        cancelLoadGroup,
    }: AdminAppContextType = useContext(AdminAppContext)
    const {
        isLoading,
        groupMembers,
        isFiltering,
        doFilterGroupMembers,
        isRemoving,
        isRemovingBool,
        doRemoveGroupMember,
        doRemoveGroupMembers,
    }: useManagePermissionGroupMembersProps = useManagePermissionGroupMembers(
        groupId,
        loadUser,
        cancelLoadUser,
        usersMapping,
        loadGroup,
        cancelLoadGroup,
        groupsMapping,
    )
    const [isExporting, setIsExporting] = useState<boolean>(false)
    const [datasIdsMapping, setDatasIdsMapping] = useState<{
        [memberType: string]: number[]
    }>({
        group: [],
        user: [],
    })
    const datasIds = useMemo<number[]>(
        () => _.reduce(
            datasIdsMapping,
            (acc: number[], datas: number[]) => [...acc, ...datas],
            [],
        ),
        [datasIdsMapping],
    )
    const {
        selectedDatas,
        selectedDatasArray,
        toggleSelect,
        hasSelected,
        forceSelect,
        forceUnSelect,
        unselectAll,
    }: useTableSelectionProps<number> = useTableSelection<number>(datasIds)

    useEffect(() => {
        loadGroup(groupId)
    }, [groupId, loadGroup])

    const loadingGroup = useMemo(
        () => !groupsMapping[groupId],
        [groupsMapping, groupId],
    )
    const handleExport = useCallback(() => {
        if (!groupId || isExporting) {
            return
        }

        setIsExporting(true)
        exportGroupUsersCsv(groupId)
            .then(blob => {
                downloadBlob(
                    blob,
                    buildGroupExportFileName(groupsMapping[groupId], groupId),
                )
            })
            .catch(error => {
                handleError(error)
            })
            .finally(() => {
                setIsExporting(false)
            })
    }, [groupId, groupsMapping, isExporting])

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
                <div className={styles.headerActions}>
                    <Button
                        primary
                        size='lg'
                        disabled={!groupId || loadingGroup || isExporting}
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
                    <div className={styles.blockSections}>
                        {memberTypes.map(memberType => (
                            <div key={memberType}>
                                <span className={styles.textSectionTitle}>
                                    {_.startCase(`${memberType}s`)}
                                </span>
                                <GroupMembersFilters
                                    memberType={memberType}
                                    isLoading={isLoading}
                                    onSubmitForm={function onSubmitForm(filter: FormGroupMembersFilters) {
                                        doFilterGroupMembers(filter, memberType)
                                    }}
                                />
                                {isLoading || isFiltering[memberType] ? (
                                    <div
                                        className={
                                            styles.loadingSpinnerContainer
                                        }
                                    >
                                        <LoadingSpinner
                                            className={styles.spinner}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {(groupMembers[memberType] || [])
                                            .length === 0 ? (
                                                <p className={styles.noRecordFound}>
                                                    No groups
                                                </p>
                                            ) : (
                                                <div className={styles.blockTableContainer}>
                                                    <GroupMembersTable
                                                        doRemoveGroupMember={
                                                            doRemoveGroupMember
                                                        }
                                                        toggleSelect={toggleSelect}
                                                        forceSelect={forceSelect}
                                                        forceUnSelect={forceUnSelect}
                                                        isRemoving={isRemoving}
                                                        isRemovingBool={isRemovingBool}
                                                        selectedDatas={selectedDatas}
                                                        memberType={memberType}
                                                        usersMapping={usersMapping}
                                                        groupsMapping={groupsMapping}
                                                        datas={
                                                            groupMembers[memberType] || []
                                                        }
                                                        onChangeDatas={function onChangeDatas(
                                                            datas: UserGroupMember[],
                                                        ) {
                                                            setDatasIdsMapping(
                                                                prev => ({
                                                                    ...prev,
                                                                    [memberType]: datas.map(
                                                                        item => item.memberId,
                                                                    ),
                                                                }),
                                                            )
                                                        }}
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
                            </div>
                        ))}
                    </div>
                    <div className={styles.removeSelectionButtonContainer}>
                        <Button
                            primary
                            variant='danger'
                            disabled={!hasSelected || isRemovingBool}
                            size='lg'
                            onClick={function onClick() {
                                doRemoveGroupMembers(selectedDatasArray, () => {
                                    unselectAll()
                                })
                            }}
                        >
                            Remove Selected
                        </Button>
                    </div>
                </PageContent>
            )}
        </div>
    )
}

export default PermissionGroupMembersPage
