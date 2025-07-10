/**
 * Terms Users Page.
 */
import { FC, useContext, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    Button,
    colWidthType,
    LinkButton,
    LoadingSpinner,
    PageDivider,
} from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'

import {
    AdminAppContext,
    DialogAddTermUser,
    PageWrapper,
    TableLoading,
    TableNoRecord,
    TermsUsersFilters,
    TermsUsersTable,
} from '../../../lib'
import {
    useAutoScrollTopWhenInit,
    useManageTermsUsers,
    useManageTermsUsersProps,
} from '../../../lib/hooks'
import { AdminAppContextType } from '../../../lib/models'
import {
    useTableSelection,
    useTableSelectionProps,
} from '../../../lib/hooks/useTableSelection'

import styles from './TermsUsersPage.module.scss'

interface Props {
    className?: string
}

export const TermsUsersPage: FC<Props> = (props: Props) => {
    const [showDialogAddUser, setShowDialogAddUser] = useState<boolean>()
    useAutoScrollTopWhenInit()
    const { id = '' }: { id?: string } = useParams<{
        id?: string
    }>()
    const { loadUser, cancelLoadUser, usersMapping }: AdminAppContextType
        = useContext(AdminAppContext)
    const [colWidth, setColWidth] = useState<colWidthType>({})

    /**
     * Hook for manage term users
     */
    const {
        isAdding,
        isRemovingBool,
        isRemoving,
        isLoading: isLoadingUserTerms,
        isLoadingTerm,
        datas,
        totalPages,
        page,
        setPage,
        setFilterCriteria,
        doAddTermUser,
        doRemoveTermUser,
        doRemoveTermUsers,
        termInfo,
    }: useManageTermsUsersProps = useManageTermsUsers(
        id,
        loadUser,
        cancelLoadUser,
    )
    const isLoading = isLoadingUserTerms || isLoadingTerm

    /**
     * Get list of term user id for the selection
     */
    const datasIds = useMemo(() => datas.map(item => item.userId), [datas])

    const {
        selectedDatas,
        selectedDatasArray,
        toggleSelect,
        hasSelected,
        forceSelect,
        forceUnSelect,
        unselectAll,
    }: useTableSelectionProps<number> = useTableSelection<number>(datasIds)

    return (
        <PageWrapper
            pageTitle={termInfo?.title ?? ''}
            className={classNames(styles.container, props.className)}
            headerActions={(
                <>
                    <Button
                        primary
                        size='lg'
                        icon={PlusIcon}
                        iconToLeft
                        label='Add User'
                        onClick={function onClick() {
                            setShowDialogAddUser(true)
                        }}
                    />
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </>
            )}
        >
            <TermsUsersFilters
                isLoading={isLoading}
                onSubmitForm={setFilterCriteria}
            />
            <PageDivider />
            {isLoading ? (
                <TableLoading />
            ) : (
                <>
                    {datas.length === 0 ? (
                        <TableNoRecord />
                    ) : (
                        <div className={styles.blockTableContainer}>
                            <TermsUsersTable
                                datas={datas}
                                totalPages={totalPages}
                                page={page}
                                setPage={setPage}
                                colWidth={colWidth}
                                setColWidth={setColWidth}
                                usersMapping={usersMapping}
                                toggleSelect={toggleSelect}
                                forceSelect={forceSelect}
                                forceUnSelect={forceUnSelect}
                                isRemoving={isRemoving}
                                isRemovingBool={isRemovingBool}
                                doRemoveTermUser={doRemoveTermUser}
                                selectedDatas={selectedDatas}
                            />

                            {isRemovingBool && (
                                <div className={styles.blockActionLoading}>
                                    <LoadingSpinner
                                        className={styles.spinner}
                                    />
                                </div>
                            )}
                            <div
                                className={
                                    styles.removeSelectionButtonContainer
                                }
                            >
                                <Button
                                    primary
                                    variant='danger'
                                    disabled={!hasSelected || isRemovingBool}
                                    size='lg'
                                    onClick={function onClick() {
                                        doRemoveTermUsers(
                                            selectedDatasArray,
                                            () => {
                                                unselectAll()
                                            },
                                        )
                                    }}
                                >
                                    Remove Selected
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {showDialogAddUser && termInfo && (
                <DialogAddTermUser
                    open
                    setOpen={function setOpen() {
                        if (!isAdding) {
                            setShowDialogAddUser(false)
                        }
                    }}
                    termInfo={termInfo}
                    isAdding={isAdding}
                    doAddTermUser={doAddTermUser}
                />
            )}
        </PageWrapper>
    )
}

export default TermsUsersPage
