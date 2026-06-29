/* eslint-disable no-use-before-define, react/jsx-no-bind */
import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { BaseModal, Button, ConfirmModal } from '~/libs/ui'

import {
    Contract,
    Renewal,
    RenewalMutationPayload,
    RenewalStage,
    RenewalStageMetadata,
} from '../../lib/models'
import {
    createRenewal,
    deleteRenewal,
    getContracts,
    getRenewals,
    getRenewalStages,
    moveRenewalStage,
    updateRenewal,
} from '../../lib/services'
import { getProcurementApiErrorMessage } from '../../lib/utils/api.utils'
import {
    formatBusinessDate,
    formatMoney,
    toDateInputValue,
} from '../../lib/utils/format.utils'

import styles from './ProcurementRenewalsPage.module.scss'

type RenewalFormField = keyof RenewalFormState
type RenewalModalMode = 'create' | 'edit'
type RenewalViewMode = 'board' | 'list'

interface RenewalBoardProps {
    isMovingStage: string
    onDelete: (renewal: Renewal) => void
    onEdit: (renewal: Renewal) => void
    onMove: (renewal: Renewal, targetStage: RenewalStage) => void
    renewals: Renewal[]
    stages: RenewalStageMetadata[]
}

interface RenewalFormModalProps {
    contracts: Contract[]
    errorMessage: string
    form: RenewalFormState
    isSaving: boolean
    mode: RenewalModalMode
    onChange: (field: RenewalFormField, value: string) => void
    onClose: () => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
    open: boolean
}

interface RenewalFormState {
    assignee: string
    contractId: string
    newEndDate: string
    newStartDate: string
    newValue: string
    notes: string
    renewalTermMonths: string
}

type RenewalListProps = RenewalBoardProps

const emptyRenewalForm: RenewalFormState = {
    assignee: '',
    contractId: '',
    newEndDate: '',
    newStartDate: '',
    newValue: '',
    notes: '',
    renewalTermMonths: '12',
}

/**
 * Renewals screen with backend-stage board/list views and adjacent workflow moves.
 */
export const ProcurementRenewalsPage: FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [deleteTarget, setDeleteTarget] = useState<Renewal | undefined>()
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [form, setForm] = useState<RenewalFormState>(emptyRenewalForm)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isMovingStage, setIsMovingStage] = useState<string>('')
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [modalMode, setModalMode] = useState<RenewalModalMode | undefined>()
    const [renewals, setRenewals] = useState<Renewal[]>([])
    const [selectedRenewal, setSelectedRenewal] = useState<Renewal | undefined>()
    const [stages, setStages] = useState<RenewalStageMetadata[]>([])
    const [viewMode, setViewMode] = useState<RenewalViewMode>('board')

    const orderedStages: RenewalStageMetadata[] = useMemo(
        () => getOrderedStages(stages),
        [stages],
    )

    const loadRenewals = useCallback(async (): Promise<void> => {
        setErrorMessage('')
        setIsLoading(true)

        try {
            const [nextRenewals, nextStages, nextContracts]: [
                Renewal[],
                RenewalStageMetadata[],
                Contract[],
            ] = await Promise.all([
                getRenewals(),
                getRenewalStages(),
                getContracts(),
            ])

            setContracts(nextContracts)
            setRenewals(nextRenewals)
            setStages(nextStages)
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadRenewals()
    }, [loadRenewals])

    const closeDeleteModal = useCallback((): void => {
        setDeleteTarget(undefined)
    }, [])

    const closeFormModal = useCallback((): void => {
        setErrorMessage('')
        setForm(emptyRenewalForm)
        setModalMode(undefined)
        setSelectedRenewal(undefined)
    }, [])

    const handleChange = useCallback((field: RenewalFormField, value: string): void => {
        setForm((previousForm: RenewalFormState) => ({
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
            await deleteRenewal(deleteTarget.id)
            closeDeleteModal()
            await loadRenewals()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsDeleting(false)
        }
    }, [closeDeleteModal, deleteTarget, loadRenewals])

    const handleMoveStage = useCallback(async (renewal: Renewal, targetStage: RenewalStage): Promise<void> => {
        setErrorMessage('')
        setIsMovingStage(renewal.id)

        try {
            await moveRenewalStage(renewal.id, targetStage)
            await loadRenewals()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsMovingStage('')
        }
    }, [loadRenewals])

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        setErrorMessage('')
        setIsSaving(true)

        try {
            const payload: RenewalMutationPayload = toRenewalPayload(form)

            if (modalMode === 'edit' && selectedRenewal) {
                await updateRenewal(selectedRenewal.id, payload)
            } else {
                await createRenewal(payload)
            }

            closeFormModal()
            await loadRenewals()
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }, [closeFormModal, form, loadRenewals, modalMode, selectedRenewal])

    const openCreateModal = useCallback((): void => {
        setErrorMessage('')
        setForm({
            ...emptyRenewalForm,
            contractId: contracts[0]?.id || '',
        })
        setModalMode('create')
        setSelectedRenewal(undefined)
    }, [contracts])

    const openEditModal = useCallback((renewal: Renewal): void => {
        setErrorMessage('')
        setForm(toRenewalForm(renewal))
        setModalMode('edit')
        setSelectedRenewal(renewal)
    }, [])

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <div>
                    <h2>Renewals</h2>
                    <p>Move renewals through backend-defined workflow stages.</p>
                </div>
                <Button label='Add renewal' onClick={openCreateModal} primary size='lg' />
            </div>

            <div className={styles.viewToggle} role='tablist'>
                <button
                    className={classNames(styles.toggleButton, { [styles.activeToggle]: viewMode === 'board' })}
                    onClick={() => setViewMode('board')}
                    type='button'
                >
                    Board
                </button>
                <button
                    className={classNames(styles.toggleButton, { [styles.activeToggle]: viewMode === 'list' })}
                    onClick={() => setViewMode('list')}
                    type='button'
                >
                    List
                </button>
            </div>

            {!!errorMessage && (
                <div className={styles.error} role='alert'>
                    {errorMessage}
                </div>
            )}

            {isLoading ? (
                <div className={styles.state}>Loading renewals...</div>
            ) : viewMode === 'board' ? (
                <RenewalBoard
                    isMovingStage={isMovingStage}
                    onDelete={setDeleteTarget}
                    onEdit={openEditModal}
                    onMove={handleMoveStage}
                    renewals={renewals}
                    stages={orderedStages}
                />
            ) : (
                <RenewalList
                    isMovingStage={isMovingStage}
                    onDelete={setDeleteTarget}
                    onEdit={openEditModal}
                    onMove={handleMoveStage}
                    renewals={renewals}
                    stages={orderedStages}
                />
            )}

            {!!modalMode && (
                <RenewalFormModal
                    contracts={contracts}
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
                title='Delete renewal'
            >
                <p>
                    Delete renewal for
                    {' '}
                    <strong>{deleteTarget?.contract.contractNumber}</strong>
                    ?
                </p>
            </ConfirmModal>
        </div>
    )
}

/**
 * Sorts backend stage metadata into workflow order.
 *
 * @param stages Backend stage metadata.
 * @returns Ordered stage metadata.
 */
function getOrderedStages(stages: RenewalStageMetadata[]): RenewalStageMetadata[] {
    return [...stages].sort((first: RenewalStageMetadata, second: RenewalStageMetadata) => first.order - second.order)
}

/**
 * Finds an adjacent workflow target for a renewal.
 *
 * @param direction Direction to move in the workflow.
 * @param renewal Renewal row being moved.
 * @param stages Ordered stage metadata.
 * @returns Adjacent target stage when the move is legal.
 */
function getAdjacentStage(
    renewal: Renewal,
    stages: RenewalStageMetadata[],
    direction: -1 | 1,
): RenewalStage | undefined {
    const currentIndex: number = stages.findIndex((stage: RenewalStageMetadata) => stage.stage === renewal.stage)
    const currentStage: RenewalStageMetadata | undefined = stages[currentIndex]
    const targetStage: RenewalStageMetadata | undefined = stages[currentIndex + direction]

    if (!currentStage || currentStage.terminal || !targetStage) {
        return undefined
    }

    return targetStage.stage
}

/**
 * Converts renewal form state into the API mutation payload.
 *
 * @param formState Controlled renewal form state.
 * @returns Renewal mutation payload.
 */
function toRenewalPayload(formState: RenewalFormState): RenewalMutationPayload {
    return {
        assignee: formState.assignee,
        contractId: formState.contractId,
        newEndDate: formState.newEndDate,
        newStartDate: formState.newStartDate,
        newValue: parseOptionalNumber(formState.newValue),
        notes: formState.notes,
        renewalTermMonths: Number(formState.renewalTermMonths) || 1,
    }
}

/**
 * Converts a renewal response into controlled form state.
 *
 * @param renewal Renewal row selected for editing.
 * @returns Renewal form state with absent optional read values kept blank.
 */
function toRenewalForm(renewal: Renewal): RenewalFormState {
    return {
        assignee: renewal.assignee || '',
        contractId: renewal.contractId,
        newEndDate: toDateInputValue(renewal.newEndDate),
        newStartDate: toDateInputValue(renewal.newStartDate),
        newValue: typeof renewal.newValue === 'number' ? String(renewal.newValue) : '',
        notes: renewal.notes || '',
        renewalTermMonths: String(renewal.renewalTermMonths),
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
 * Renders renewals grouped by backend-provided workflow stage metadata.
 *
 * @param props Board props.
 * @returns Renewal board view.
 */
const RenewalBoard: FC<RenewalBoardProps> = props => (
    <div className={styles.board}>
        {props.stages.map((stage: RenewalStageMetadata) => {
            const stageRenewals: Renewal[] = props.renewals
                .filter((renewal: Renewal) => renewal.stage === stage.stage)

            return (
                <section className={styles.column} key={stage.stage}>
                    <header>
                        <h3>{stage.label}</h3>
                        <span>{stageRenewals.length}</span>
                    </header>

                    <div className={styles.columnBody}>
                        {stageRenewals.length === 0 && <div className={styles.emptyColumn}>No renewals</div>}
                        {stageRenewals.map((renewal: Renewal) => (
                            <RenewalCard
                                isMovingStage={props.isMovingStage}
                                key={renewal.id}
                                onDelete={props.onDelete}
                                onEdit={props.onEdit}
                                onMove={props.onMove}
                                renewal={renewal}
                                stages={props.stages}
                            />
                        ))}
                    </div>
                </section>
            )
        })}
    </div>
)

/**
 * Renders a single renewal card for the workflow board.
 *
 * @param props Card props.
 * @returns Renewal card.
 */
const RenewalCard: FC<{
    isMovingStage: string
    onDelete: (renewal: Renewal) => void
    onEdit: (renewal: Renewal) => void
    onMove: (renewal: Renewal, targetStage: RenewalStage) => void
    renewal: Renewal
    stages: RenewalStageMetadata[]
}> = props => {
    const previousStage: RenewalStage | undefined = getAdjacentStage(props.renewal, props.stages, -1)
    const nextStage: RenewalStage | undefined = getAdjacentStage(props.renewal, props.stages, 1)
    const isMoving: boolean = props.isMovingStage === props.renewal.id

    return (
        <article className={styles.card}>
            <strong>{props.renewal.contract.contractNumber}</strong>
            <span>{props.renewal.contract.title}</span>
            <span>{props.renewal.contract.vendor.name}</span>
            <dl>
                <div>
                    <dt>Term</dt>
                    <dd>
                        {formatBusinessDate(props.renewal.newStartDate)}
                        {' - '}
                        {formatBusinessDate(props.renewal.newEndDate)}
                    </dd>
                </div>
                <div>
                    <dt>Value</dt>
                    <dd>{typeof props.renewal.newValue === 'number' ? formatMoney(props.renewal.newValue) : '-'}</dd>
                </div>
                <div>
                    <dt>Assignee</dt>
                    <dd>{props.renewal.assignee || '-'}</dd>
                </div>
            </dl>
            <RenewalActions
                isMoving={isMoving}
                nextStage={nextStage}
                onDelete={() => props.onDelete(props.renewal)}
                onEdit={() => props.onEdit(props.renewal)}
                onMove={targetStage => props.onMove(props.renewal, targetStage)}
                previousStage={previousStage}
            />
        </article>
    )
}

/**
 * Renders renewals in a flat workflow list.
 *
 * @param props List props.
 * @returns Renewal list view.
 */
const RenewalList: FC<RenewalListProps> = props => (
    <div className={styles.tableWrap}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Contract</th>
                    <th>Vendor</th>
                    <th>Stage</th>
                    <th>New term</th>
                    <th>Value</th>
                    <th>Assignee</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {props.renewals.length === 0 && (
                    <tr>
                        <td colSpan={7}>No renewals found.</td>
                    </tr>
                )}
                {props.renewals.map((renewal: Renewal) => {
                    const previousStage: RenewalStage | undefined = getAdjacentStage(renewal, props.stages, -1)
                    const nextStage: RenewalStage | undefined = getAdjacentStage(renewal, props.stages, 1)

                    return (
                        <tr key={renewal.id}>
                            <td>
                                <strong>{renewal.contract.contractNumber}</strong>
                                <span>{renewal.contract.title}</span>
                            </td>
                            <td>{renewal.contract.vendor.name}</td>
                            <td>{renewal.stageLabel}</td>
                            <td>
                                {formatBusinessDate(renewal.newStartDate)}
                                {' - '}
                                {formatBusinessDate(renewal.newEndDate)}
                            </td>
                            <td>{typeof renewal.newValue === 'number' ? formatMoney(renewal.newValue) : '-'}</td>
                            <td>{renewal.assignee || '-'}</td>
                            <td>
                                <RenewalActions
                                    isMoving={props.isMovingStage === renewal.id}
                                    nextStage={nextStage}
                                    onDelete={() => props.onDelete(renewal)}
                                    onEdit={() => props.onEdit(renewal)}
                                    onMove={targetStage => props.onMove(renewal, targetStage)}
                                    previousStage={previousStage}
                                />
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
)

/**
 * Renders edit/delete and adjacent stage controls for a renewal.
 *
 * @param props Action props.
 * @returns Renewal row or card actions.
 */
const RenewalActions: FC<{
    isMoving: boolean
    nextStage?: RenewalStage
    onDelete: () => void
    onEdit: () => void
    onMove: (targetStage: RenewalStage) => void
    previousStage?: RenewalStage
}> = props => (
    <div className={styles.actions}>
        {!!props.previousStage && (
            <Button
                disabled={props.isMoving}
                label='Back'
                onClick={() => props.onMove(props.previousStage as RenewalStage)}
                secondary
                size='sm'
            />
        )}
        {!!props.nextStage && (
            <Button
                disabled={props.isMoving}
                label='Next'
                onClick={() => props.onMove(props.nextStage as RenewalStage)}
                secondary
                size='sm'
            />
        )}
        <Button label='Edit' onClick={props.onEdit} secondary size='sm' />
        <Button label='Delete' onClick={props.onDelete} secondary size='sm' />
    </div>
)

/**
 * Renders create and edit controls for renewal mutations.
 *
 * @param props Modal props.
 * @returns Renewal form modal.
 */
const RenewalFormModal: FC<RenewalFormModalProps> = props => (
    <BaseModal
        onClose={props.onClose}
        open={props.open}
        title={props.mode === 'create' ? 'Add renewal' : 'Edit renewal'}
    >
        <form className={styles.form} onSubmit={props.onSubmit}>
            {!!props.errorMessage && (
                <div className={styles.error} role='alert'>
                    {props.errorMessage}
                </div>
            )}

            <label htmlFor='renewal-contract'>
                Contract
                <select
                    id='renewal-contract'
                    onChange={event => props.onChange('contractId', event.target.value)}
                    required
                    value={props.form.contractId}
                >
                    <option value=''>Select contract</option>
                    {props.contracts.map((contract: Contract) => (
                        <option key={contract.id} value={contract.id}>
                            {contract.contractNumber}
                            {' - '}
                            {contract.title}
                        </option>
                    ))}
                </select>
            </label>

            <label htmlFor='renewal-term-months'>
                Term months
                <input
                    id='renewal-term-months'
                    min='1'
                    onChange={event => props.onChange('renewalTermMonths', event.target.value)}
                    required
                    type='number'
                    value={props.form.renewalTermMonths}
                />
            </label>

            <label htmlFor='renewal-new-start'>
                New start date
                <input
                    id='renewal-new-start'
                    onChange={event => props.onChange('newStartDate', event.target.value)}
                    required
                    type='date'
                    value={props.form.newStartDate}
                />
            </label>

            <label htmlFor='renewal-new-end'>
                New end date
                <input
                    id='renewal-new-end'
                    onChange={event => props.onChange('newEndDate', event.target.value)}
                    required
                    type='date'
                    value={props.form.newEndDate}
                />
            </label>

            <label htmlFor='renewal-new-value'>
                New value
                <input
                    id='renewal-new-value'
                    min='0'
                    onChange={event => props.onChange('newValue', event.target.value)}
                    step='0.01'
                    type='number'
                    value={props.form.newValue}
                />
            </label>

            <label htmlFor='renewal-assignee'>
                Assignee
                <input
                    id='renewal-assignee'
                    onChange={event => props.onChange('assignee', event.target.value)}
                    type='text'
                    value={props.form.assignee}
                />
            </label>

            <label className={styles.fullWidth} htmlFor='renewal-notes'>
                Notes
                <textarea
                    id='renewal-notes'
                    onChange={event => props.onChange('notes', event.target.value)}
                    value={props.form.notes}
                />
            </label>

            <div className={styles.modalActions}>
                <Button disabled={props.isSaving} label='Cancel' onClick={props.onClose} secondary size='lg' />
                <Button
                    disabled={props.isSaving}
                    label={props.mode === 'create' ? 'Create renewal' : 'Save renewal'}
                    loading={props.isSaving}
                    primary
                    size='lg'
                    type='submit'
                />
            </div>
        </form>
    </BaseModal>
)
