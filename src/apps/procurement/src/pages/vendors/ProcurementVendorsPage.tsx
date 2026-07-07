/* eslint-disable no-use-before-define, react/jsx-no-bind */
import { FC, FormEvent, useCallback, useEffect, useState } from 'react'

import { BaseModal, Button, ConfirmModal } from '~/libs/ui'

import { Vendor, VendorMutationPayload } from '../../lib/models'
import {
    createVendor,
    deleteVendor,
    getVendors,
    updateVendor,
} from '../../lib/services'
import { getProcurementApiErrorMessage } from '../../lib/utils/api.utils'
import { formatDate } from '../../lib/utils/format.utils'

import styles from './ProcurementVendorsPage.module.scss'

type VendorModalMode = 'create' | 'edit'

interface VendorFormModalProps {
    errorMessage: string
    form: VendorMutationPayload
    isSaving: boolean
    mode: VendorModalMode
    onChange: (field: keyof VendorMutationPayload, value: string) => void
    onClose: () => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
    open: boolean
}

const emptyVendorForm: VendorMutationPayload = {
    address: '',
    category: '',
    contactEmail: '',
    contactName: '',
    contactPhone: '',
    name: '',
    notes: '',
}

/**
 * Vendors screen with table-based CRUD for procurement suppliers.
 */
export const ProcurementVendorsPage: FC = () => {
    const [deleteTarget, setDeleteTarget] = useState<Vendor | undefined>()
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [form, setForm] = useState<VendorMutationPayload>(emptyVendorForm)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [modalMode, setModalMode] = useState<VendorModalMode | undefined>()
    const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>()
    const [vendors, setVendors] = useState<Vendor[]>([])

    const loadVendors = useCallback(async (): Promise<void> => {
        setErrorMessage('')
        setIsLoading(true)

        try {
            setVendors(await getVendors())
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadVendors()
    }, [loadVendors])

    const closeFormModal = useCallback((): void => {
        setErrorMessage('')
        setForm(emptyVendorForm)
        setModalMode(undefined)
        setSelectedVendor(undefined)
    }, [])

    const closeDeleteModal = useCallback((): void => {
        setDeleteTarget(undefined)
    }, [])

    const handleChange = useCallback((field: keyof VendorMutationPayload, value: string): void => {
        setForm((previousForm: VendorMutationPayload) => ({
            ...previousForm,
            [field]: value,
        }))
    }, [])

    const handleDelete = useCallback(async (): Promise<void> => {
        if (!deleteTarget) {
            return
        }

        setErrorMessage('')
        setIsDeleting(true)

        try {
            await deleteVendor(deleteTarget.id)
            closeDeleteModal()
            await loadVendors()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsDeleting(false)
        }
    }, [closeDeleteModal, deleteTarget, loadVendors])

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        setErrorMessage('')
        setIsSaving(true)

        try {
            if (modalMode === 'edit' && selectedVendor) {
                await updateVendor(selectedVendor.id, form)
            } else {
                await createVendor(form)
            }

            closeFormModal()
            await loadVendors()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }, [closeFormModal, form, loadVendors, modalMode, selectedVendor])

    const openCreateModal = useCallback((): void => {
        setErrorMessage('')
        setForm(emptyVendorForm)
        setModalMode('create')
        setSelectedVendor(undefined)
    }, [])

    const openEditModal = useCallback((vendor: Vendor): void => {
        setErrorMessage('')
        setForm(toVendorForm(vendor))
        setModalMode('edit')
        setSelectedVendor(vendor)
    }, [])

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <div>
                    <h2>Vendors</h2>
                    <p>Manage supplier profiles used by contracts and invoices.</p>
                </div>
                <Button label='Add vendor' onClick={openCreateModal} primary size='lg' />
            </div>

            {!!errorMessage && (
                <div className={styles.error} role='alert'>
                    {errorMessage}
                </div>
            )}

            {isLoading ? (
                <div className={styles.state}>Loading vendors...</div>
            ) : (
                <VendorsTable
                    onDelete={setDeleteTarget}
                    onEdit={openEditModal}
                    vendors={vendors}
                />
            )}

            {!!modalMode && (
                <VendorFormModal
                    errorMessage={errorMessage}
                    form={form}
                    isSaving={isSaving}
                    mode={modalMode}
                    onChange={handleChange}
                    onClose={closeFormModal}
                    onSubmit={handleSubmit}
                    open
                />
            )}

            <ConfirmModal
                action='Delete'
                isProcessing={isDeleting}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                open={!!deleteTarget}
                title='Delete vendor'
            >
                <p>
                    Delete
                    {' '}
                    <strong>{deleteTarget?.name}</strong>
                    ? Vendors referenced by contracts or invoices cannot be deleted.
                </p>
            </ConfirmModal>
        </div>
    )
}

/**
 * Converts a vendor response into controlled form state.
 *
 * @param vendor Vendor row selected for editing.
 * @returns Vendor form state.
 */
function toVendorForm(vendor: Vendor): VendorMutationPayload {
    return {
        address: vendor.address || '',
        category: vendor.category || '',
        contactEmail: vendor.contactEmail || '',
        contactName: vendor.contactName || '',
        contactPhone: vendor.contactPhone || '',
        name: vendor.name,
        notes: vendor.notes || '',
    }
}

/**
 * Renders the vendors table and row actions.
 *
 * @param props Table props.
 * @returns Vendors table.
 */
const VendorsTable: FC<{
    onDelete: (vendor: Vendor) => void
    onEdit: (vendor: Vendor) => void
    vendors: Vendor[]
}> = props => (
    <div className={styles.tableWrap}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Vendor</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {props.vendors.length === 0 && (
                    <tr>
                        <td colSpan={7}>No vendors found.</td>
                    </tr>
                )}
                {props.vendors.map((vendor: Vendor) => (
                    <tr key={vendor.id}>
                        <td>
                            <strong>{vendor.name}</strong>
                        </td>
                        <td>{vendor.contactName || '-'}</td>
                        <td>{vendor.contactEmail || '-'}</td>
                        <td>{vendor.contactPhone || '-'}</td>
                        <td>{vendor.category || '-'}</td>
                        <td>{formatDate(vendor.updatedAt)}</td>
                        <td>
                            <div className={styles.actions}>
                                <Button label='Edit' onClick={() => props.onEdit(vendor)} secondary size='sm' />
                                <Button label='Delete' onClick={() => props.onDelete(vendor)} secondary size='sm' />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

/**
 * Renders create and edit controls for vendor mutations.
 *
 * @param props Modal props.
 * @returns Vendor form modal.
 */
const VendorFormModal: FC<VendorFormModalProps> = props => (
    <BaseModal
        onClose={props.onClose}
        open={props.open}
        title={props.mode === 'create' ? 'Add vendor' : 'Edit vendor'}
    >
        <form className={styles.form} onSubmit={props.onSubmit}>
            {!!props.errorMessage && (
                <div className={styles.error} role='alert'>
                    {props.errorMessage}
                </div>
            )}

            <label htmlFor='vendor-name'>
                Vendor name
                <input
                    id='vendor-name'
                    onChange={event => props.onChange('name', event.target.value)}
                    required
                    type='text'
                    value={props.form.name}
                />
            </label>

            <label htmlFor='vendor-contact-name'>
                Contact
                <input
                    id='vendor-contact-name'
                    onChange={event => props.onChange('contactName', event.target.value)}
                    type='text'
                    value={props.form.contactName}
                />
            </label>

            <label htmlFor='vendor-contact-email'>
                Email
                <input
                    id='vendor-contact-email'
                    onChange={event => props.onChange('contactEmail', event.target.value)}
                    type='email'
                    value={props.form.contactEmail}
                />
            </label>

            <label htmlFor='vendor-contact-phone'>
                Phone
                <input
                    id='vendor-contact-phone'
                    onChange={event => props.onChange('contactPhone', event.target.value)}
                    type='text'
                    value={props.form.contactPhone}
                />
            </label>

            <label htmlFor='vendor-category'>
                Category
                <input
                    id='vendor-category'
                    onChange={event => props.onChange('category', event.target.value)}
                    type='text'
                    value={props.form.category}
                />
            </label>

            <label htmlFor='vendor-address'>
                Address
                <textarea
                    id='vendor-address'
                    onChange={event => props.onChange('address', event.target.value)}
                    value={props.form.address}
                />
            </label>

            <label htmlFor='vendor-notes'>
                Notes
                <textarea
                    id='vendor-notes'
                    onChange={event => props.onChange('notes', event.target.value)}
                    value={props.form.notes}
                />
            </label>

            <div className={styles.modalActions}>
                <Button disabled={props.isSaving} label='Cancel' onClick={props.onClose} secondary size='lg' />
                <Button
                    disabled={props.isSaving}
                    label={props.mode === 'create' ? 'Create vendor' : 'Save vendor'}
                    loading={props.isSaving}
                    primary
                    size='lg'
                    type='submit'
                />
            </div>
        </form>
    </BaseModal>
)
