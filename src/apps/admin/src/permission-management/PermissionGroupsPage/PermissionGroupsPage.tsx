/**
 * Permission groups page.
 */
import { ChangeEvent, FC, useContext, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Button, InputText, LoadingSpinner, PageTitle } from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'

import { DialogAddGroup } from '../../lib/components/DialogAddGroup'
import { GroupsTable } from '../../lib/components/GroupsTable'
import { useManagePermissionGroups, useManagePermissionGroupsProps } from '../../lib/hooks'
import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { AdminAppContext, PageContent, PageHeader } from '../../lib'
import { AdminAppContextType, FormAddGroup } from '../../lib/models'

import styles from './PermissionGroupsPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Groups'

export const PermissionGroupsPage: FC<Props> = (props: Props) => {
    const [openDialogAddGroup, setOpenDialogAddGroup] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const { loadUser, cancelLoadUser, usersMapping }: AdminAppContextType
        = useContext(AdminAppContext)
    const {
        isLoading,
        groups,
        isAdding,
        doAddGroup,
    }: useManagePermissionGroupsProps = useManagePermissionGroups(
        loadUser,
        cancelLoadUser,
        usersMapping,
    )

    const filteredGroups = useMemo(() => {
        const normalized = searchTerm
            .trim()
            .toLowerCase()
        if (!normalized) {
            return groups
        }

        return groups.filter(group => {
            const id = group.id ? group.id.toLowerCase() : ''
            const name = group.name ? group.name.toLowerCase() : ''

            return id.includes(normalized) || name.includes(normalized)
        })
    }, [groups, searchTerm])
    const hasSearchTerm = useMemo(
        () => searchTerm.trim().length > 0,
        [searchTerm],
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>

            <PageContent>
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        <div className={styles.actions}>
                            <InputText
                                name='groupSearch'
                                type='text'
                                label='Search groups'
                                placeholder='Search by name or ID'
                                value={searchTerm}
                                onChange={function onChange(event: ChangeEvent<HTMLInputElement>) {
                                    setSearchTerm(event.target.value)
                                }}
                                forceUpdateValue
                                classNameWrapper={styles.searchField}
                            />
                            <Button
                                primary
                                size='lg'
                                icon={PlusIcon}
                                iconToLeft
                                label='new group'
                                onClick={function onClick() {
                                    setOpenDialogAddGroup(true)
                                }}
                                className={styles.btnNewGroup}
                            />
                        </div>
                        {filteredGroups.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {hasSearchTerm
                                    ? 'No groups match your search.'
                                    : MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <GroupsTable
                                datas={filteredGroups}
                                usersMapping={usersMapping}
                            />
                        )}
                    </>
                )}
            </PageContent>

            {openDialogAddGroup && (
                <DialogAddGroup
                    open
                    setOpen={function setOpen() {
                        setOpenDialogAddGroup(false)
                    }}
                    isLoading={isAdding}
                    onSubmitForm={function onSubmitForm(data: FormAddGroup) {
                        doAddGroup(data, () => {
                            setOpenDialogAddGroup(false)
                        })
                    }}
                />
            )}
        </div>
    )
}

export default PermissionGroupsPage
