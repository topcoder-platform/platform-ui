/**
 * Permission groups page.
 */
import { FC, useContext, useState } from 'react'
import classNames from 'classnames'

import { Button, LoadingSpinner, PageTitle } from '~/libs/ui'
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
                        {groups.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <GroupsTable
                                datas={groups}
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
