/* eslint-disable no-use-before-define, react/jsx-no-bind */
import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { BaseModal, Button, ConfirmModal } from '~/libs/ui'

import {
    Contract,
    Invoice,
    InvoiceMutationPayload,
    InvoiceStatus,
    Vendor,
} from '../../lib/models'
import {
    createInvoice,
    deleteInvoice,
    getContracts,
    getInvoices,
    getVendors,
    InvoiceStateFilter,
    updateInvoice,
} from '../../lib/services'
import { getProcurementApiErrorMessage } from '../../lib/utils/api.utils'
import {
    formatBusinessDate,
    formatMoney,
    formatStatusLabel,
    toDateInputValue,
} from '../../lib/utils/format.utils'

import styles from './ProcurementInvoicesPage.module.scss'

type InvoiceFilter = 'all' | InvoiceStateFilter
type InvoiceFormField = Exclude<keyof InvoiceFormState, 'status'>
type InvoiceModalMode = 'create' | 'edit'

interface InvoiceFilterOption {
    label: string
    value: InvoiceFilter
}

interface InvoiceFormModalProps {
    contracts: Contract[]
    errorMessage: string
    form: InvoiceFormState
    isSaving: boolean
    mode: InvoiceModalMode
    onChange: (field: InvoiceFormField, value: string) => void
    onClose: () => void
    onStatusChange: (value: InvoiceStatus) => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
    onVendorChange: (value: string) => void
    open: boolean
    vendors: Vendor[]
}

interface InvoiceFormState {
    amount: string
    contractId: string
    description: string
    dueDate: string
    invoiceDate: string
    invoiceNumber: string
    paidDate: string
    status: InvoiceStatus
    vendorId: string
}

const invoiceFilters: InvoiceFilterOption[] = [
    {
        label: 'All',
        value: 'all',
    },
    {
        label: 'Pending',
        value: 'pending',
    },
    {
        label: 'Overdue',
        value: 'overdue',
    },
    {
        label: 'Paid',
        value: 'paid',
    },
]

const invoiceStatuses: InvoiceStatus[] = [
    'draft',
    'issued',
    'paid',
    'cancelled',
]

const emptyInvoiceForm: InvoiceFormState = {
    amount: '',
    contractId: '',
    description: '',
    dueDate: '',
    invoiceDate: '',
    invoiceNumber: '',
    paidDate: '',
    status: 'issued',
    vendorId: '',
}

/**
 * Invoices screen with payment-state filtering, modal CRUD, and mark-paid updates.
 */
export const ProcurementInvoicesPage: FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [deleteTarget, setDeleteTarget] = useState<Invoice | undefined>()
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [filter, setFilter] = useState<InvoiceFilter>('all')
    const [form, setForm] = useState<InvoiceFormState>(emptyInvoiceForm)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isMarkingPaid, setIsMarkingPaid] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [modalMode, setModalMode] = useState<InvoiceModalMode | undefined>()
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>()
    const [vendors, setVendors] = useState<Vendor[]>([])

    const selectedVendorContracts: Contract[] = useMemo(
        () => getContractsForVendor(contracts, form.vendorId),
        [contracts, form.vendorId],
    )

    const loadInvoices = useCallback(async (): Promise<void> => {
        setErrorMessage('')
        setIsLoading(true)

        try {
            const stateFilter: InvoiceStateFilter | undefined = filter === 'all' ? undefined : filter
            const [nextInvoices, nextVendors, nextContracts]: [Invoice[], Vendor[], Contract[]] = await Promise.all([
                getInvoices(stateFilter),
                getVendors(),
                getContracts(),
            ])

            setContracts(nextContracts)
            setInvoices(nextInvoices)
            setVendors(nextVendors)
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }, [filter])

    useEffect(() => {
        loadInvoices()
    }, [loadInvoices])

    const closeDeleteModal = useCallback((): void => {
        setDeleteTarget(undefined)
    }, [])

    const closeFormModal = useCallback((): void => {
        setErrorMessage('')
        setForm(emptyInvoiceForm)
        setModalMode(undefined)
        setSelectedInvoice(undefined)
    }, [])

    const handleChange = useCallback((field: InvoiceFormField, value: string): void => {
        setForm((previousForm: InvoiceFormState) => ({
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
            await deleteInvoice(deleteTarget.id)
            closeDeleteModal()
            await loadInvoices()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsDeleting(false)
        }
    }, [closeDeleteModal, deleteTarget, loadInvoices])

    const handleFilterChange = useCallback((nextFilter: InvoiceFilter): void => {
        setFilter(nextFilter)
    }, [])

    const handleMarkPaid = useCallback(async (invoice: Invoice): Promise<void> => {
        if (!isPayableInvoice(invoice)) {
            return
        }

        setErrorMessage('')
        setIsMarkingPaid(true)

        try {
            await updateInvoice(invoice.id, toMarkPaidPayload(invoice))
            await loadInvoices()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsMarkingPaid(false)
        }
    }, [loadInvoices])

    const handleStatusChange = useCallback((value: InvoiceStatus): void => {
        setForm((previousForm: InvoiceFormState) => ({
            ...previousForm,
            status: value,
        }))
    }, [])

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        setErrorMessage('')
        setIsSaving(true)

        try {
            const payload: InvoiceMutationPayload = toInvoicePayload(form)

            if (modalMode === 'edit' && selectedInvoice) {
                await updateInvoice(selectedInvoice.id, payload)
            } else {
                await createInvoice(payload)
            }

            closeFormModal()
            await loadInvoices()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }, [closeFormModal, form, loadInvoices, modalMode, selectedInvoice])

    const handleVendorChange = useCallback((value: string): void => {
        setForm((previousForm: InvoiceFormState) => ({
            ...previousForm,
            contractId: '',
            vendorId: value,
        }))
    }, [])

    const openCreateModal = useCallback((): void => {
        setErrorMessage('')
        setForm({
            ...emptyInvoiceForm,
            vendorId: vendors[0]?.id || '',
        })
        setModalMode('create')
        setSelectedInvoice(undefined)
    }, [vendors])

    const openEditModal = useCallback((invoice: Invoice): void => {
        setErrorMessage('')
        setForm(toInvoiceForm(invoice))
        setModalMode('edit')
        setSelectedInvoice(invoice)
    }, [])

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <div>
                    <h2>Invoices</h2>
                    <p>Filter by backend payment state and manage invoice records.</p>
                </div>
                <Button label='Add invoice' onClick={openCreateModal} primary size='lg' />
            </div>

            <div className={styles.filterBar} role='tablist'>
                {invoiceFilters.map((option: InvoiceFilterOption) => (
                    <button
                        className={classNames(styles.filterButton, {
                            [styles.activeFilter]: filter === option.value,
                        })}
                        key={option.value}
                        onClick={() => handleFilterChange(option.value)}
                        type='button'
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {!!errorMessage && (
                <div className={styles.error} role='alert'>
                    {errorMessage}
                </div>
            )}

            {isLoading ? (
                <div className={styles.state}>Loading invoices...</div>
            ) : (
                <InvoicesTable
                    invoices={invoices}
                    isMarkingPaid={isMarkingPaid}
                    onDelete={setDeleteTarget}
                    onEdit={openEditModal}
                    onMarkPaid={handleMarkPaid}
                />
            )}

            {!!modalMode && (
                <InvoiceFormModal
                    contracts={selectedVendorContracts}
                    errorMessage={errorMessage}
                    form={form}
                    isSaving={isSaving}
                    mode={modalMode}
                    onChange={handleChange}
                    onClose={closeFormModal}
                    onStatusChange={handleStatusChange}
                    onSubmit={handleSubmit}
                    onVendorChange={handleVendorChange}
                    open
                    vendors={vendors}
                />
            )}

            <ConfirmModal
                action='Delete'
                isProcessing={isDeleting}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                open={!!deleteTarget}
                title='Delete invoice'
            >
                <p>
                    Delete invoice
                    {' '}
                    <strong>{deleteTarget?.invoiceNumber}</strong>
                    ?
                </p>
            </ConfirmModal>
        </div>
    )
}

/**
 * Returns contracts belonging to the selected invoice vendor.
 *
 * @param contracts Contract options loaded from the API.
 * @param vendorId Selected vendor identifier.
 * @returns Filtered contract options.
 */
function getContractsForVendor(contracts: Contract[], vendorId: string): Contract[] {
    return contracts.filter((contract: Contract) => contract.vendorId === vendorId)
}

/**
 * Converts invoice form state into the API mutation payload.
 *
 * @param formState Controlled invoice form state.
 * @returns Invoice mutation payload.
 */
function toInvoicePayload(formState: InvoiceFormState): InvoiceMutationPayload {
    return {
        amount: Number(formState.amount) || 0,
        contractId: formState.contractId || undefined,
        description: formState.description,
        dueDate: formState.dueDate,
        invoiceDate: formState.invoiceDate,
        invoiceNumber: formState.invoiceNumber,
        paidDate: formState.paidDate || undefined,
        status: formState.status,
        vendorId: formState.vendorId,
    }
}

/**
 * Converts an invoice response into controlled form state.
 *
 * @param invoice Invoice row selected for editing.
 * @returns Invoice form state.
 */
function toInvoiceForm(invoice: Invoice): InvoiceFormState {
    return {
        amount: String(invoice.amount),
        contractId: invoice.contractId || '',
        description: invoice.description || '',
        dueDate: toDateInputValue(invoice.dueDate),
        invoiceDate: toDateInputValue(invoice.invoiceDate),
        invoiceNumber: invoice.invoiceNumber,
        paidDate: toDateInputValue(invoice.paidDate),
        status: invoice.status,
        vendorId: invoice.vendorId,
    }
}

/**
 * Builds a full invoice update payload that marks the invoice as paid.
 *
 * @param invoice Invoice row selected for payment.
 * @returns Full invoice mutation payload with paid status and date.
 */
function toMarkPaidPayload(invoice: Invoice): InvoiceMutationPayload {
    return {
        amount: invoice.amount,
        contractId: invoice.contractId,
        description: invoice.description || '',
        dueDate: toDateInputValue(invoice.dueDate),
        invoiceDate: toDateInputValue(invoice.invoiceDate),
        invoiceNumber: invoice.invoiceNumber,
        paidDate: new Date()
            .toISOString()
            .slice(0, 10),
        status: 'paid',
        vendorId: invoice.vendorId,
    }
}

/**
 * Checks whether an invoice is in a backend-derived state that can be marked paid.
 *
 * @param invoice Invoice row selected for payment.
 * @returns `true` when the invoice payment state is pending or overdue.
 */
function isPayableInvoice(invoice: Invoice): boolean {
    return invoice.paymentState === 'pending' || invoice.paymentState === 'overdue'
}

/**
 * Renders the invoices table and row actions.
 *
 * @param props Table props.
 * @returns Invoices table.
 */
const InvoicesTable: FC<{
    invoices: Invoice[]
    isMarkingPaid: boolean
    onDelete: (invoice: Invoice) => void
    onEdit: (invoice: Invoice) => void
    onMarkPaid: (invoice: Invoice) => void
}> = props => (
    <div className={styles.tableWrap}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Invoice</th>
                    <th>Vendor</th>
                    <th>Contract</th>
                    <th>Due date</th>
                    <th>Amount</th>
                    <th>State</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {props.invoices.length === 0 && (
                    <tr>
                        <td colSpan={7}>No invoices found.</td>
                    </tr>
                )}
                {props.invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id}>
                        <td>
                            <strong>{invoice.invoiceNumber}</strong>
                            <span>{formatStatusLabel(invoice.status)}</span>
                        </td>
                        <td>{invoice.vendor.name}</td>
                        <td>{invoice.contract?.contractNumber || '-'}</td>
                        <td>{formatBusinessDate(invoice.dueDate)}</td>
                        <td>{formatMoney(invoice.amount)}</td>
                        <td>
                            <span className={styles.badge}>{formatStatusLabel(invoice.paymentState)}</span>
                        </td>
                        <td>
                            <div className={styles.actions}>
                                <Button label='Edit' onClick={() => props.onEdit(invoice)} secondary size='sm' />
                                <Button
                                    disabled={props.isMarkingPaid || !isPayableInvoice(invoice)}
                                    label='Mark paid'
                                    onClick={() => props.onMarkPaid(invoice)}
                                    secondary
                                    size='sm'
                                />
                                <Button label='Delete' onClick={() => props.onDelete(invoice)} secondary size='sm' />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

/**
 * Renders create and edit controls for invoice mutations.
 *
 * @param props Modal props.
 * @returns Invoice form modal.
 */
const InvoiceFormModal: FC<InvoiceFormModalProps> = props => (
    <BaseModal
        onClose={props.onClose}
        open={props.open}
        title={props.mode === 'create' ? 'Add invoice' : 'Edit invoice'}
    >
        <form className={styles.form} onSubmit={props.onSubmit}>
            {!!props.errorMessage && (
                <div className={styles.error} role='alert'>
                    {props.errorMessage}
                </div>
            )}

            <label htmlFor='invoice-vendor'>
                Vendor
                <select
                    id='invoice-vendor'
                    onChange={event => props.onVendorChange(event.target.value)}
                    required
                    value={props.form.vendorId}
                >
                    <option value=''>Select vendor</option>
                    {props.vendors.map((vendor: Vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                        </option>
                    ))}
                </select>
            </label>

            <label htmlFor='invoice-contract'>
                Contract
                <select
                    id='invoice-contract'
                    onChange={event => props.onChange('contractId', event.target.value)}
                    value={props.form.contractId}
                >
                    <option value=''>No contract</option>
                    {props.contracts.map((contract: Contract) => (
                        <option key={contract.id} value={contract.id}>
                            {contract.contractNumber}
                            {' - '}
                            {contract.title}
                        </option>
                    ))}
                </select>
            </label>

            <label htmlFor='invoice-number'>
                Invoice number
                <input
                    id='invoice-number'
                    onChange={event => props.onChange('invoiceNumber', event.target.value)}
                    required
                    type='text'
                    value={props.form.invoiceNumber}
                />
            </label>

            <label htmlFor='invoice-status'>
                Status
                <select
                    id='invoice-status'
                    onChange={event => props.onStatusChange(event.target.value as InvoiceStatus)}
                    value={props.form.status}
                >
                    {invoiceStatuses.map((status: InvoiceStatus) => (
                        <option key={status} value={status}>
                            {formatStatusLabel(status)}
                        </option>
                    ))}
                </select>
            </label>

            <label htmlFor='invoice-date'>
                Invoice date
                <input
                    id='invoice-date'
                    onChange={event => props.onChange('invoiceDate', event.target.value)}
                    required
                    type='date'
                    value={props.form.invoiceDate}
                />
            </label>

            <label htmlFor='invoice-due-date'>
                Due date
                <input
                    id='invoice-due-date'
                    onChange={event => props.onChange('dueDate', event.target.value)}
                    required
                    type='date'
                    value={props.form.dueDate}
                />
            </label>

            <label htmlFor='invoice-paid-date'>
                Paid date
                <input
                    id='invoice-paid-date'
                    onChange={event => props.onChange('paidDate', event.target.value)}
                    type='date'
                    value={props.form.paidDate}
                />
            </label>

            <label htmlFor='invoice-amount'>
                Amount
                <input
                    id='invoice-amount'
                    min='0'
                    onChange={event => props.onChange('amount', event.target.value)}
                    required
                    step='0.01'
                    type='number'
                    value={props.form.amount}
                />
            </label>

            <label className={styles.fullWidth} htmlFor='invoice-description'>
                Description
                <textarea
                    id='invoice-description'
                    onChange={event => props.onChange('description', event.target.value)}
                    value={props.form.description}
                />
            </label>

            <div className={styles.modalActions}>
                <Button disabled={props.isSaving} label='Cancel' onClick={props.onClose} secondary size='lg' />
                <Button
                    disabled={props.isSaving}
                    label={props.mode === 'create' ? 'Create invoice' : 'Save invoice'}
                    loading={props.isSaving}
                    primary
                    size='lg'
                    type='submit'
                />
            </div>
        </form>
    </BaseModal>
)
