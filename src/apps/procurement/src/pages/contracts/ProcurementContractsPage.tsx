/* eslint-disable no-use-before-define, react/jsx-no-bind */
import { FC, FormEvent, useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'

import { BaseModal, Button, ConfirmModal } from '~/libs/ui'

import {
    Contract,
    ContractMutationPayload,
    ContractStatus,
    Vendor,
} from '../../lib/models'
import {
    createContract,
    deleteContract,
    getContracts,
    getVendors,
    updateContract,
} from '../../lib/services'
import { getProcurementApiErrorMessage } from '../../lib/utils/api.utils'
import {
    formatBusinessDate,
    formatMoney,
    formatStatusLabel,
    toDateInputValue,
} from '../../lib/utils/format.utils'

import styles from './ProcurementContractsPage.module.scss'

type ContractFormField = Exclude<keyof ContractFormState, 'autoRenew'>
type ContractModalMode = 'create' | 'edit'

interface ContractFormModalProps {
    errorMessage: string
    form: ContractFormState
    isSaving: boolean
    mode: ContractModalMode
    onBooleanChange: (field: 'autoRenew', value: boolean) => void
    onChange: (field: ContractFormField, value: string) => void
    onClose: () => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
    open: boolean
    vendors: Vendor[]
}

interface ContractFormState {
    autoRenew: boolean
    contractNumber: string
    description: string
    endDate: string
    renewalNoticeDays: string
    startDate: string
    status: ContractStatus
    title: string
    value: string
    vendorId: string
}

const contractStatuses: ContractStatus[] = [
    'draft',
    'active',
    'expired',
    'terminated',
]

const emptyContractForm: ContractFormState = {
    autoRenew: false,
    contractNumber: '',
    description: '',
    endDate: '',
    renewalNoticeDays: '',
    startDate: '',
    status: 'active',
    title: '',
    value: '',
    vendorId: '',
}

/**
 * Contracts screen with modal CRUD and backend lifecycle/status visibility.
 */
export const ProcurementContractsPage: FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [deleteTarget, setDeleteTarget] = useState<Contract | undefined>()
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [form, setForm] = useState<ContractFormState>(emptyContractForm)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [modalMode, setModalMode] = useState<ContractModalMode | undefined>()
    const [selectedContract, setSelectedContract] = useState<Contract | undefined>()
    const [vendors, setVendors] = useState<Vendor[]>([])

    const loadContracts = useCallback(async (): Promise<void> => {
        setErrorMessage('')
        setIsLoading(true)

        try {
            const [nextContracts, nextVendors]: [Contract[], Vendor[]] = await Promise.all([
                getContracts(),
                getVendors(),
            ])

            setContracts(nextContracts)
            setVendors(nextVendors)
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadContracts()
    }, [loadContracts])

    const closeDeleteModal = useCallback((): void => {
        setDeleteTarget(undefined)
    }, [])

    const closeFormModal = useCallback((): void => {
        setErrorMessage('')
        setForm(emptyContractForm)
        setModalMode(undefined)
        setSelectedContract(undefined)
    }, [])

    const handleBooleanChange = useCallback((field: 'autoRenew', value: boolean): void => {
        setForm((previousForm: ContractFormState) => ({
            ...previousForm,
            [field]: value,
        }))
    }, [])

    const handleChange = useCallback((field: ContractFormField, value: string): void => {
        setForm((previousForm: ContractFormState) => ({
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
            await deleteContract(deleteTarget.id)
            closeDeleteModal()
            await loadContracts()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsDeleting(false)
        }
    }, [closeDeleteModal, deleteTarget, loadContracts])

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        setErrorMessage('')
        setIsSaving(true)

        try {
            const payload: ContractMutationPayload = toContractPayload(form)

            if (modalMode === 'edit' && selectedContract) {
                await updateContract(selectedContract.id, payload)
            } else {
                await createContract(payload)
            }

            closeFormModal()
            await loadContracts()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }, [closeFormModal, form, loadContracts, modalMode, selectedContract])

    const openCreateModal = useCallback((): void => {
        setErrorMessage('')
        setForm({
            ...emptyContractForm,
            vendorId: vendors[0]?.id || '',
        })
        setModalMode('create')
        setSelectedContract(undefined)
    }, [vendors])

    const openEditModal = useCallback((contract: Contract): void => {
        setErrorMessage('')
        setForm(toContractForm(contract))
        setModalMode('edit')
        setSelectedContract(contract)
    }, [])

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <div>
                    <h2>Contracts</h2>
                    <p>Track supplier contracts, stored status, and backend-derived lifecycle.</p>
                </div>
                <Button label='Add contract' onClick={openCreateModal} primary size='lg' />
            </div>

            {!!errorMessage && (
                <div className={styles.error} role='alert'>
                    {errorMessage}
                </div>
            )}

            {isLoading ? (
                <div className={styles.state}>Loading contracts...</div>
            ) : (
                <ContractsTable
                    contracts={contracts}
                    onDelete={setDeleteTarget}
                    onEdit={openEditModal}
                />
            )}

            {!!modalMode && (
                <ContractFormModal
                    errorMessage={errorMessage}
                    form={form}
                    isSaving={isSaving}
                    mode={modalMode}
                    onBooleanChange={handleBooleanChange}
                    onChange={handleChange}
                    onClose={closeFormModal}
                    onSubmit={handleSubmit}
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
                title='Delete contract'
            >
                <p>
                    Delete
                    {' '}
                    <strong>{deleteTarget?.contractNumber}</strong>
                    ? Contracts referenced by invoices or renewals cannot be deleted.
                </p>
            </ConfirmModal>
        </div>
    )
}

/**
 * Converts contract form state into the API mutation payload.
 *
 * @param formState Controlled contract form state.
 * @returns Contract mutation payload.
 */
function toContractPayload(formState: ContractFormState): ContractMutationPayload {
    return {
        autoRenew: formState.autoRenew,
        contractNumber: formState.contractNumber,
        description: formState.description,
        endDate: formState.endDate,
        renewalNoticeDays: parseOptionalNumber(formState.renewalNoticeDays),
        startDate: formState.startDate,
        status: formState.status,
        title: formState.title,
        value: Number(formState.value) || 0,
        vendorId: formState.vendorId,
    }
}

/**
 * Converts a contract response into controlled form state.
 *
 * @param contract Contract row selected for editing.
 * @returns Contract form state with absent optional read values kept blank.
 */
function toContractForm(contract: Contract): ContractFormState {
    return {
        autoRenew: contract.autoRenew,
        contractNumber: contract.contractNumber,
        description: contract.description || '',
        endDate: toDateInputValue(contract.endDate),
        renewalNoticeDays: typeof contract.renewalNoticeDays === 'number'
            ? String(contract.renewalNoticeDays)
            : '',
        startDate: toDateInputValue(contract.startDate),
        status: contract.status,
        title: contract.title,
        value: String(contract.value),
        vendorId: contract.vendorId,
    }
}

/**
 * Parses optional numeric form fields.
 *
 * @param value Numeric form value.
 * @returns Number when supplied.
 */
function parseOptionalNumber(value: string): number | undefined {
    return value.trim() ? Number(value) : undefined
}

/**
 * Renders the contracts table and row actions.
 *
 * @param props Table props.
 * @returns Contracts table.
 */
const ContractsTable: FC<{
    contracts: Contract[]
    onDelete: (contract: Contract) => void
    onEdit: (contract: Contract) => void
}> = props => (
    <div className={styles.tableWrap}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Contract</th>
                    <th>Vendor</th>
                    <th>Dates</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Lifecycle</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {props.contracts.length === 0 && (
                    <tr>
                        <td colSpan={7}>No contracts found.</td>
                    </tr>
                )}
                {props.contracts.map((contract: Contract) => (
                    <tr
                        className={classNames({
                            [styles.expiredRow]: contract.lifecycle === 'expired',
                            [styles.expiringRow]: contract.lifecycle === 'expiring',
                        })}
                        key={contract.id}
                    >
                        <td>
                            <strong>{contract.contractNumber}</strong>
                            <span>{contract.title}</span>
                        </td>
                        <td>{contract.vendor.name}</td>
                        <td>
                            {formatBusinessDate(contract.startDate)}
                            {' - '}
                            {formatBusinessDate(contract.endDate)}
                        </td>
                        <td>{formatMoney(contract.value)}</td>
                        <td>
                            <span className={styles.badge}>{formatStatusLabel(contract.status)}</span>
                        </td>
                        <td>
                            <span className={styles.badge}>{formatStatusLabel(contract.lifecycle)}</span>
                        </td>
                        <td>
                            <div className={styles.actions}>
                                <Button label='Edit' onClick={() => props.onEdit(contract)} secondary size='sm' />
                                <Button label='Delete' onClick={() => props.onDelete(contract)} secondary size='sm' />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

/**
 * Renders create and edit controls for contract mutations.
 *
 * @param props Modal props.
 * @returns Contract form modal.
 */
const ContractFormModal: FC<ContractFormModalProps> = props => (
    <BaseModal
        onClose={props.onClose}
        open={props.open}
        title={props.mode === 'create' ? 'Add contract' : 'Edit contract'}
    >
        <form className={styles.form} onSubmit={props.onSubmit}>
            {!!props.errorMessage && (
                <div className={styles.error} role='alert'>
                    {props.errorMessage}
                </div>
            )}

            <label htmlFor='contract-vendor'>
                Vendor
                <select
                    id='contract-vendor'
                    onChange={event => props.onChange('vendorId', event.target.value)}
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

            <label htmlFor='contract-number'>
                Contract number
                <input
                    id='contract-number'
                    onChange={event => props.onChange('contractNumber', event.target.value)}
                    required
                    type='text'
                    value={props.form.contractNumber}
                />
            </label>

            <label htmlFor='contract-title'>
                Title
                <input
                    id='contract-title'
                    onChange={event => props.onChange('title', event.target.value)}
                    required
                    type='text'
                    value={props.form.title}
                />
            </label>

            <label htmlFor='contract-status'>
                Status
                <select
                    id='contract-status'
                    onChange={event => props.onChange('status', event.target.value)}
                    value={props.form.status}
                >
                    {contractStatuses.map((status: ContractStatus) => (
                        <option key={status} value={status}>
                            {formatStatusLabel(status)}
                        </option>
                    ))}
                </select>
            </label>

            <label htmlFor='contract-start-date'>
                Start date
                <input
                    id='contract-start-date'
                    onChange={event => props.onChange('startDate', event.target.value)}
                    required
                    type='date'
                    value={props.form.startDate}
                />
            </label>

            <label htmlFor='contract-end-date'>
                End date
                <input
                    id='contract-end-date'
                    onChange={event => props.onChange('endDate', event.target.value)}
                    required
                    type='date'
                    value={props.form.endDate}
                />
            </label>

            <label htmlFor='contract-value'>
                Value
                <input
                    id='contract-value'
                    min='0'
                    onChange={event => props.onChange('value', event.target.value)}
                    required
                    step='0.01'
                    type='number'
                    value={props.form.value}
                />
            </label>

            <label htmlFor='contract-renewal-notice'>
                Renewal notice days
                <input
                    id='contract-renewal-notice'
                    min='0'
                    onChange={event => props.onChange('renewalNoticeDays', event.target.value)}
                    type='number'
                    value={props.form.renewalNoticeDays}
                />
            </label>

            <label className={styles.checkbox} htmlFor='contract-auto-renew'>
                <input
                    checked={props.form.autoRenew}
                    id='contract-auto-renew'
                    onChange={event => props.onBooleanChange('autoRenew', event.target.checked)}
                    type='checkbox'
                />
                Auto renew
            </label>

            <label className={styles.fullWidth} htmlFor='contract-description'>
                Description
                <textarea
                    id='contract-description'
                    onChange={event => props.onChange('description', event.target.value)}
                    value={props.form.description}
                />
            </label>

            <div className={styles.modalActions}>
                <Button disabled={props.isSaving} label='Cancel' onClick={props.onClose} secondary size='lg' />
                <Button
                    disabled={props.isSaving}
                    label={props.mode === 'create' ? 'Create contract' : 'Save contract'}
                    loading={props.isSaving}
                    primary
                    size='lg'
                    type='submit'
                />
            </div>
        </form>
    </BaseModal>
)
