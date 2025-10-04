/**
 * Billing account resources page.
 */
import { FC, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { PlusIcon } from '@heroicons/react/solid'
import { BaseModal, Button, LinkButton, LoadingSpinner, PageTitle } from '~/libs/ui'

import { BillingAccountResourcesTable } from '../../lib/components/BillingAccountResourcesTable'
import { useManageBillingAccountResources, useManageBillingAccountResourcesProps } from '../../lib/hooks'
import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { PageContent, PageHeader } from '../../lib'
import { ConfirmModal } from '../../lib/components/common/ConfirmModal/ConfirmModal'
import { createBillingAccountResource } from '../../lib/services/billing-accounts.service'
import { FieldHandleSelect } from '../../lib/components/FieldHandleSelect'
import { SelectOption } from '../../lib/models/SelectOption.model'

import styles from './BillingAccountResourcesPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Billing Account Resources'

export const BillingAccountResourcesPage: FC<Props> = (props: Props) => {
    const { accountId = '' }: { accountId?: string } = useParams<{
        accountId: string
    }>()
    const {
        billingAccountResources,
        isLoading,
        isRemoving,
        isRemovingBool,
        doRemoveBillingAccountResource,
        refresh,
    }: useManageBillingAccountResourcesProps = useManageBillingAccountResources(accountId)

    // Remove confirmation state
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingRemoveHandle, setPendingRemoveHandle] = useState<string | undefined>(undefined)

    const handleRequestRemove = useCallback((item: { id: number; name: string }) => {
        setPendingRemoveHandle(item.name)
        setConfirmOpen(true)
    }, [])

    const handleConfirmRemove = useCallback(() => {
        if (pendingRemoveHandle) {
            // doRemove expects a BillingAccountResource-like item
            doRemoveBillingAccountResource({ id: -1, name: pendingRemoveHandle, status: 'active' })
        }

        setConfirmOpen(false)

        setPendingRemoveHandle(undefined)
    }, [pendingRemoveHandle, doRemoveBillingAccountResource])

    // Add resource modal state
    const [addOpen, setAddOpen] = useState(false)
    const [addSelection, setAddSelection] = useState<SelectOption | undefined>(undefined)
    const [isAdding, setIsAdding] = useState(false)

    // Using FieldHandleSelect below which wraps async autocomplete

    const handleAddResource = useCallback(async () => {
        if (!addSelection?.value) return
        try {
            setIsAdding(true)
            await createBillingAccountResource(accountId, {
                name: '',
                status: 'active',
                userId: String(addSelection.value),
            })
            setAddOpen(false)
            setAddSelection(undefined)
            refresh()
        } finally {
            setIsAdding(false)
        }
    }, [accountId, addSelection, refresh])

    const openAddModal = useCallback(() => setAddOpen(true), [])
    const closeAddModal = useCallback(() => setAddOpen(false), [])
    const closeConfirmModal = useCallback(() => setConfirmOpen(false), [])

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
                <div className={styles.headerActions}>
                    <Button
                        primary
                        size='lg'
                        onClick={openAddModal}
                        icon={PlusIcon}
                        iconToLeft
                    >
                        add resource
                    </Button>
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </div>
            </PageHeader>
            <PageContent>
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        {billingAccountResources.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <div className={styles.blockTableContainer}>
                                <BillingAccountResourcesTable
                                    isRemoving={isRemoving}
                                    datas={billingAccountResources}
                                    doRemoveItem={handleRequestRemove}
                                />

                                {isRemovingBool && (
                                    <div className={styles.blockActionLoading}>
                                        <LoadingSpinner
                                            className={styles.spinner}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </PageContent>

            {/* Remove confirmation */}
            <ConfirmModal
                title='Remove Resource'
                open={confirmOpen}
                onClose={closeConfirmModal}
                onConfirm={handleConfirmRemove}
                action='Yes'
            >
                Are you sure you want to remove&nbsp;
                {pendingRemoveHandle}
                &nbsp;from this billing account?
            </ConfirmModal>

            {/* Add Resource Modal */}
            <BaseModal title='Add Resource' open={addOpen} onClose={closeAddModal}>
                <div className={styles.blockForm}>
                    <FieldHandleSelect
                        label='Member Handle'
                        placeholder='Start typing a handle'
                        value={addSelection}
                        onChange={setAddSelection}
                        disabled={isAdding}
                        isLoading={isAdding}
                    />
                    <div className={styles.blockBtns}>
                        <Button secondary size='lg' onClick={closeAddModal} disabled={isAdding}>
                            Cancel
                        </Button>
                        <Button primary size='lg' onClick={handleAddResource} disabled={!addSelection || isAdding}>
                            Add
                        </Button>
                    </div>
                    {isAdding && (
                        <div className={styles.blockActionLoading}>
                            <LoadingSpinner className={styles.spinner} />
                        </div>
                    )}
                </div>
            </BaseModal>
        </div>
    )
}

export default BillingAccountResourcesPage
