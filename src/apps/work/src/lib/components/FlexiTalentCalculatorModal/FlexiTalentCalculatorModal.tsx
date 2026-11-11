import {
    ChangeEvent,
    FC,
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { copyTextToClipboard } from '~/libs/shared'
import {
    BaseModal,
    Button,
    IconOutline,
    InputSelect,
    InputSelectOption,
    InputText,
    Tooltip,
} from '~/libs/ui'

import { EngagementLead } from '../../models/EngagementLead.model'
import {
    createEngagementLeadCalculation,
    deleteEngagementLeadCalculation,
    fetchEngagementLeadCalculations,
    updateEngagementLeadCalculation,
} from '../../services/engagement-leads.service'
import {
    extractErrorMessage,
    showErrorToast,
    showSuccessToast,
} from '../../utils'
import {
    buildCostProposal,
    calculateFlexiTalentCosts,
    CommercialInputField,
    FlexiTalentCalculatorResult,
    FLEXI_TALENT_SMU_OPTIONS,
    formatCalculatorAmount,
    formatCalculatorInputValue,
    getSmuOption,
    MemberInputField,
    parseCalculatorNumber,
} from '../../utils/flexi-talent-calculator.utils'
import {
    CalculatorDraft,
    createDraftFromCalculation,
    createDraftFromLead,
    DraftInput,
    getDraftCalculatorInputs,
    getDraftLabel,
    getDraftSavePayload,
    hasUnsavedChanges,
} from '../../utils/flexi-talent-calculator-drafts.utils'
import { ErrorMessage } from '../ErrorMessage'
import { LoadingSpinner } from '../LoadingSpinner'

import styles from './FlexiTalentCalculatorModal.module.scss'

/** How long after the last edit a calculation is saved. */
export const AUTOSAVE_DELAY_MS = 500

const noop = (): void => undefined

type SaveStatus = 'error' | 'saved' | 'saving'

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
    error: 'Not saved. It will be retried on your next change.',
    saved: 'All changes saved',
    saving: 'Saving…',
}

interface AmountFieldDefinition<TField extends string> {
    field: TField
    label: string
}

const MEMBER_FIELDS: ReadonlyArray<AmountFieldDefinition<MemberInputField>> = [
    { field: 'memberRate', label: 'Member Rate / Hour (USD)' },
    { field: 'memberCost', label: 'Member Cost (USD)' },
]

const COMMERCIAL_FIELDS: ReadonlyArray<AmountFieldDefinition<CommercialInputField>> = [
    { field: 'bookingCost', label: 'Booking Cost (USD)' },
    { field: 'bookingRate', label: 'Booking Rate / Hour (USD)' },
    { field: 'actualCost', label: 'Actual Cost (USD)' },
    { field: 'actualRate', label: 'Actual Rate / Hour (USD)' },
    { field: 'tcMarginAmount', label: 'TC Margin Amount (USD)' },
    { field: 'tcMarginPercent', label: 'TC Margin %' },
]

const SMU_SELECT_OPTIONS: ReadonlyArray<InputSelectOption> = FLEXI_TALENT_SMU_OPTIONS.map(option => ({
    label: `${option.label} (${(option.costTransferRate * 100).toFixed(2)}%)`,
    value: option.code,
}))

const REFERRAL_OPTIONS: ReadonlyArray<InputSelectOption> = [
    { label: 'No', value: 'no' },
    { label: 'Yes', value: 'yes' },
]

function getFieldValue<TField extends string>(
    field: TField,
    draft: DraftInput<TField> | undefined,
    result: FlexiTalentCalculatorResult,
): string {
    if (draft?.field === field) {
        return draft.raw
    }

    return formatCalculatorInputValue(result[field as keyof FlexiTalentCalculatorResult])
}

export interface FlexiTalentCalculatorModalProps {
    lead: EngagementLead
    onClose: () => void
}

/**
 * Works out member cost, TC margin, cost transfer and booking cost for a lead, and builds a cost
 * proposal to share with the customer. A lead can have several calculations (e.g. one per
 * resource). They save themselves as they are edited, overwriting the previous values.
 */
export const FlexiTalentCalculatorModal: FC<FlexiTalentCalculatorModalProps> = (
    props: FlexiTalentCalculatorModalProps,
) => {
    const lead = props.lead

    const [drafts, setDrafts] = useState<CalculatorDraft[]>([])
    const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [loadError, setLoadError] = useState<string | undefined>(undefined)
    const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({})
    const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<boolean>(false)
    // Not saved: the role always comes from the lead.
    const [roleTitle, setRoleTitle] = useState<string>(lead.roleTitle || '')

    // Autosave runs outside React's render cycle, so it reads the latest state from refs.
    const draftsRef = useRef<CalculatorDraft[]>([])
    const savedIdsRef = useRef<Map<string, string>>(new Map())
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
    const inFlightRef = useRef<Map<string, Promise<void>>>(new Map())
    const resaveRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        draftsRef.current = drafts
    }, [drafts])

    const loadCalculations = useCallback(async (): Promise<void> => {
        setLoading(true)
        setLoadError(undefined)

        try {
            const calculations = await fetchEngagementLeadCalculations(lead.id)
            const loaded = calculations.length
                ? calculations.map(createDraftFromCalculation)
                : [createDraftFromLead(lead)]

            calculations.forEach(calculation => {
                savedIdsRef.current.set(calculation.id, calculation.id)
            })
            draftsRef.current = loaded
            setDrafts(loaded)
            setActiveKey(loaded[0].key)
        } catch (err: unknown) {
            setLoadError(extractErrorMessage(err, 'Unable to load the saved cost calculations.'))
        } finally {
            setLoading(false)
        }
    }, [lead])

    useEffect(() => {
        loadCalculations()
            .catch(() => undefined)
    }, [loadCalculations])

    const clearAutosaveTimer = useCallback((key: string): void => {
        const timer = timersRef.current.get(key)

        if (timer) {
            clearTimeout(timer)
            timersRef.current.delete(key)
        }
    }, [])

    /**
     * Saves a draft if it has unsaved edits. Only one save per draft runs at a time; edits made
     * meanwhile are saved once it finishes, so a new calculation is never created twice.
     */
    const saveDraft = useCallback(async function save(key: string): Promise<void> {
        clearAutosaveTimer(key)

        const running = inFlightRef.current.get(key)
        if (running) {
            resaveRef.current.add(key)
            return running
        }

        const draft = draftsRef.current.find(item => item.key === key)
        if (!draft || !hasUnsavedChanges(draft)) {
            return undefined
        }

        const revision = draft.revision
        const savedId = savedIdsRef.current.get(key)

        setSaveStatuses(current => ({ ...current, [key]: 'saving' }))

        const request = (async (): Promise<void> => {
            try {
                const payload = getDraftSavePayload(draft)
                const saved = savedId
                    ? await updateEngagementLeadCalculation(lead.id, savedId, payload)
                    : await createEngagementLeadCalculation(lead.id, payload)

                savedIdsRef.current.set(key, saved.id)
                // What the user typed stays on screen; only record what is saved.
                setDrafts(current => current.map(item => (
                    item.key === key
                        ? { ...item, id: saved.id, savedRevision: Math.max(item.savedRevision, revision) }
                        : item
                )))
                setSaveStatuses(current => ({ ...current, [key]: 'saved' }))
            } catch (err: unknown) {
                setSaveStatuses(current => ({ ...current, [key]: 'error' }))
                showErrorToast(extractErrorMessage(err, 'Unable to save the cost calculation.'))
            }
        })()

        inFlightRef.current.set(key, request)

        try {
            await request
        } finally {
            inFlightRef.current.delete(key)
        }

        if (resaveRef.current.delete(key)) {
            await save(key)
        }

        return undefined
    }, [clearAutosaveTimer, lead.id])

    const scheduleSave = useCallback((key: string): void => {
        clearAutosaveTimer(key)
        timersRef.current.set(key, setTimeout(() => {
            timersRef.current.delete(key)
            saveDraft(key)
                .catch(() => undefined)
        }, AUTOSAVE_DELAY_MS))
    }, [clearAutosaveTimer, saveDraft])

    // Closing the calculator saves whatever is still waiting for the autosave delay.
    useEffect(() => () => {
        Array.from(timersRef.current.keys())
            .forEach(key => {
                saveDraft(key)
                    .catch(() => undefined)
            })
    }, [saveDraft])

    const activeDraft = drafts.find(draft => draft.key === activeKey)

    const result = useMemo(
        () => calculateFlexiTalentCosts(activeDraft ? getDraftCalculatorInputs(activeDraft) : { referral: false }),
        [activeDraft],
    )

    const proposal = useMemo(() => buildCostProposal({
        accountName: activeDraft?.accountName,
        durationWeeks: parseCalculatorNumber(activeDraft?.durationWeeksRaw),
        hoursPerDay: parseCalculatorNumber(activeDraft?.hoursPerDayRaw),
        memberName: activeDraft?.memberName,
        result,
        roleTitle,
        smuCode: activeDraft?.smuCode,
    }), [activeDraft, result, roleTitle])

    const updateActiveDraft = useCallback((patch: Partial<CalculatorDraft>): void => {
        if (!activeKey) {
            return
        }

        const nextDrafts = draftsRef.current.map(draft => (
            draft.key === activeKey ? { ...draft, ...patch, revision: draft.revision + 1 } : draft
        ))

        // Updated straight away so a save triggered before the next render sees this edit.
        draftsRef.current = nextDrafts
        setDrafts(nextDrafts)
        scheduleSave(activeKey)
    }, [activeKey, scheduleSave])

    const handleFieldBlur = useCallback((): void => {
        if (activeKey && timersRef.current.has(activeKey)) {
            saveDraft(activeKey)
                .catch(() => undefined)
        }
    }, [activeKey, saveDraft])

    const handleMemberNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({ memberName: event.target.value })
    }, [updateActiveDraft])

    const handleAccountNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({ accountName: event.target.value })
    }, [updateActiveDraft])

    const handleRoleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setRoleTitle(event.target.value)
    }, [])

    const handleSmuChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({ smuCode: event.target.value })
    }, [updateActiveDraft])

    const handleHoursPerDayChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({ hoursPerDayRaw: event.target.value })
    }, [updateActiveDraft])

    const handleDurationChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({ durationWeeksRaw: event.target.value })
    }, [updateActiveDraft])

    const handleReferralChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({ referral: event.target.value === 'yes' })
    }, [updateActiveDraft])

    const handleMemberFieldChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({
            memberDraft: {
                field: event.target.name as MemberInputField,
                raw: event.target.value,
            },
        })
    }, [updateActiveDraft])

    const handleCommercialFieldChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        updateActiveDraft({
            commercialDraft: {
                field: event.target.name as CommercialInputField,
                raw: event.target.value,
            },
        })
    }, [updateActiveDraft])

    const handleSelectDraft = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        // Leaving a calculation saves it without waiting for the autosave delay.
        if (activeKey) {
            saveDraft(activeKey)
                .catch(() => undefined)
        }

        setActiveKey(event.currentTarget.dataset.key)
        setConfirmingDelete(false)
    }, [activeKey, saveDraft])

    const handleAddCalculation = useCallback((): void => {
        if (activeKey) {
            saveDraft(activeKey)
                .catch(() => undefined)
        }

        const draft = createDraftFromLead(lead)

        draftsRef.current = [...draftsRef.current, draft]
        setDrafts(draftsRef.current)
        setActiveKey(draft.key)
        setConfirmingDelete(false)
    }, [activeKey, lead, saveDraft])

    const handleDelete = useCallback(async (): Promise<void> => {
        if (!activeDraft) {
            return
        }

        const key = activeDraft.key

        clearAutosaveTimer(key)
        resaveRef.current.delete(key)
        setDeleting(true)

        try {
            // A calculation still being created has to exist before it can be deleted.
            await inFlightRef.current.get(key)

            const savedId = savedIdsRef.current.get(key)
            if (savedId) {
                await deleteEngagementLeadCalculation(lead.id, savedId)
                savedIdsRef.current.delete(key)
            }

            const index = draftsRef.current.findIndex(draft => draft.key === key)
            const remaining = draftsRef.current.filter(draft => draft.key !== key)
            // There is always a calculation to work on, so deleting the last one starts a new one.
            const nextDrafts = remaining.length ? remaining : [createDraftFromLead(lead)]

            draftsRef.current = nextDrafts
            setDrafts(nextDrafts)
            setActiveKey(nextDrafts[Math.min(index, nextDrafts.length - 1)].key)
            setConfirmingDelete(false)

            if (savedId) {
                showSuccessToast('Cost calculation deleted.')
            }
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to delete the cost calculation.'))
        } finally {
            setDeleting(false)
        }
    }, [activeDraft, clearAutosaveTimer, lead])

    const handleDeleteClick = useCallback((): void => {
        setConfirmingDelete(true)
    }, [])

    const handleDeleteCancel = useCallback((): void => {
        setConfirmingDelete(false)
    }, [])

    const handleDeleteConfirm = useCallback((): void => {
        handleDelete()
            .catch(() => undefined)
    }, [handleDelete])

    const handleCopyProposal = useCallback((): void => {
        copyTextToClipboard(proposal)
            .then(() => showSuccessToast('Cost proposal copied to clipboard.'))
            .catch((err: unknown) => showErrorToast(extractErrorMessage(err, 'Unable to copy the cost proposal.')))
    }, [proposal])

    const handleRetryLoad = useCallback((): void => {
        loadCalculations()
            .catch(() => undefined)
    }, [loadCalculations])

    const selectedSmu = getSmuOption(activeDraft?.smuCode)
    const activeSaveStatus = activeKey ? saveStatuses[activeKey] : undefined

    function renderCalculationActions(): JSX.Element {
        return (
            <div className={styles.calculationActions}>
                <span
                    aria-live='polite'
                    className={classNames(
                        styles.saveStatus,
                        activeSaveStatus === 'error' && styles.saveStatusError,
                    )}
                >
                    {activeSaveStatus ? SAVE_STATUS_LABELS[activeSaveStatus] : ''}
                </span>
                {confirmingDelete
                    ? (
                        <div className={styles.deleteConfirm}>
                            <span>Delete this calculation?</span>
                            <Button
                                disabled={deleting}
                                label='Cancel'
                                onClick={handleDeleteCancel}
                                secondary
                                size='sm'
                            />
                            <Button
                                disabled={deleting}
                                label='Delete'
                                onClick={handleDeleteConfirm}
                                primary
                                size='sm'
                                variant='danger'
                            />
                        </div>
                    )
                    : (
                        <Button
                            disabled={deleting}
                            label='Delete Calculation'
                            onClick={handleDeleteClick}
                            secondary
                            size='sm'
                            variant='danger'
                        />
                    )}
            </div>
        )
    }

    function renderCalculator(draft: CalculatorDraft): JSX.Element {
        return (
            <>
                {renderCalculationActions()}

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Engagement</h4>
                    <div className={styles.grid}>
                        <InputText
                            forceUpdateValue
                            label='Member Name'
                            name='memberName'
                            onBlur={handleFieldBlur}
                            onChange={handleMemberNameChange}
                            placeholder='Enter member name'
                            tabIndex={0}
                            type='text'
                            value={draft.memberName}
                        />
                        <InputText
                            forceUpdateValue
                            label='Account Name'
                            name='accountName'
                            onBlur={handleFieldBlur}
                            onChange={handleAccountNameChange}
                            tabIndex={0}
                            type='text'
                            value={draft.accountName}
                        />
                    </div>
                    <div className={styles.grid}>
                        {/* <InputText
                            forceUpdateValue
                            label='Role'
                            name='roleTitle'
                            onChange={handleRoleTitleChange}
                            placeholder='Enter role'
                            tabIndex={0}
                            type='text'
                            value={roleTitle}
                        /> */}
                        <InputSelect
                            label='SMU'
                            name='smu'
                            onChange={handleSmuChange}
                            options={SMU_SELECT_OPTIONS}
                            placeholder='Select SMU'
                            value={draft.smuCode}
                        />
                        <InputText
                            forceUpdateValue
                            label='Duration (Weeks)'
                            name='durationWeeks'
                            onBlur={handleFieldBlur}
                            onChange={handleDurationChange}
                            placeholder={lead.engagementDuration || undefined}
                            tabIndex={0}
                            type='text'
                            value={draft.durationWeeksRaw}
                        />
                        <InputText
                            forceUpdateValue
                            label='Hours per Day'
                            name='hoursPerDay'
                            onBlur={handleFieldBlur}
                            onChange={handleHoursPerDayChange}
                            tabIndex={0}
                            type='text'
                            value={draft.hoursPerDayRaw}
                        />
                        <InputSelect
                            label='Referral'
                            name='referral'
                            onChange={handleReferralChange}
                            options={REFERRAL_OPTIONS}
                            value={draft.referral ? 'yes' : 'no'}
                        />
                        {/* <InputText
                            forceUpdateValue
                            label='Total Billing Hours'
                            name='totalBillingHours'
                            onChange={noop}
                            readonly
                            tabIndex={-1}
                            type='text'
                            value={formatCalculatorAmount(result.totalBillingHours)}
                        /> */}
                    </div>
                </section>

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Member</h4>
                    <div className={styles.grid}>
                        {MEMBER_FIELDS.map(definition => (
                            <InputText
                                classNameWrapper={classNames(
                                    draft.memberDraft?.field === definition.field && styles.activeField,
                                )}
                                forceUpdateValue
                                key={definition.field}
                                label={definition.label}
                                name={definition.field}
                                onBlur={handleFieldBlur}
                                onChange={handleMemberFieldChange}
                                tabIndex={0}
                                type='text'
                                value={getFieldValue(definition.field, draft.memberDraft, result)}
                            />
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Commercials</h4>
                    <div className={styles.grid}>
                        {COMMERCIAL_FIELDS.map(definition => (
                            <InputText
                                classNameWrapper={classNames(
                                    draft.commercialDraft?.field === definition.field && styles.activeField,
                                )}
                                forceUpdateValue
                                key={definition.field}
                                label={definition.label}
                                name={definition.field}
                                onBlur={handleFieldBlur}
                                onChange={handleCommercialFieldChange}
                                tabIndex={0}
                                type='text'
                                value={getFieldValue(definition.field, draft.commercialDraft, result)}
                            />
                        ))}
                    </div>
                    {result.tcMarginPercent !== undefined && result.tcMarginPercent < 0 && (
                        <p className={styles.warning}>
                            The actual cost is lower than the total member cost, so the TC margin is negative.
                        </p>
                    )}
                    {!selectedSmu && (
                        <p className={styles.hint}>Select an SMU to calculate the booking cost.</p>
                    )}
                </section>

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Member Cost</h4>
                    <div className={styles.cards}>
                        <div className={styles.card}>
                            <span className={styles.cardLabel}>Member Cost</span>
                            <span className={styles.cardValue}>
                                {`USD ${formatCalculatorAmount(result.memberCost)}`}
                            </span>
                        </div>
                        <div className={styles.card}>
                            <span className={styles.cardLabel}>Referral Fee</span>
                            <span className={styles.cardValue}>
                                {`USD ${formatCalculatorAmount(result.referralFee)}`}
                            </span>
                        </div>
                        <div className={styles.card}>
                            <span className={styles.cardLabel}>Total Member Cost</span>
                            <span className={styles.cardValue}>
                                {`USD ${formatCalculatorAmount(result.totalMemberCost)}`}
                            </span>
                        </div>
                    </div>
                    <p className={styles.smallPrint}>
                        {`Member Weekly Rate: USD ${formatCalculatorAmount(result.memberWeeklyRate)}`}
                        {' · '}
                        {`Member Monthly Rate: USD ${formatCalculatorAmount(result.memberMonthlyRate)}`}
                        {' · '}
                        {`Member Hourly Rate (based on Actual Cost): USD ${
                            formatCalculatorAmount(result.actualRate)
                        }`}
                    </p>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>Cost Proposal</h4>
                        <Tooltip content='Copy to clipboard' triggerOn='click-hover'>
                            <button
                                aria-label='Copy cost proposal'
                                className={styles.copyButton}
                                onClick={handleCopyProposal}
                                type='button'
                            >
                                <IconOutline.ClipboardCopyIcon aria-hidden className={styles.copyIcon} />
                            </button>
                        </Tooltip>
                    </div>
                    <pre className={styles.proposal} data-testid='cost-proposal'>{proposal}</pre>
                </section>
            </>
        )
    }

    return (
        <BaseModal
            open
            onClose={props.onClose}
            size='body'
            title='Flexi Talent Cost Calculator'
            buttons={(
                <Button
                    label='Close'
                    onClick={props.onClose}
                    secondary
                />
            )}
        >
            <div className={styles.content}>
                <p className={styles.subtitle}>
                    {`Lead ${lead.id}. Enter any one commercial value; the others are calculated from it.`}
                </p>

                {loading && <LoadingSpinner />}

                {!loading && loadError && (
                    <ErrorMessage message={loadError} onRetry={handleRetryLoad} />
                )}

                {!loading && !loadError && (
                    <div className={styles.tabs} role='tablist' aria-label='Cost calculations'>
                        {drafts.map((draft, index) => (
                            <button
                                aria-selected={draft.key === activeKey}
                                className={classNames(styles.tab, draft.key === activeKey && styles.activeTab)}
                                data-key={draft.key}
                                key={draft.key}
                                onClick={handleSelectDraft}
                                role='tab'
                                type='button'
                            >
                                {getDraftLabel(draft, index)}
                            </button>
                        ))}
                        <button
                            className={styles.addTab}
                            onClick={handleAddCalculation}
                            type='button'
                        >
                            + Add Calculation
                        </button>
                    </div>
                )}

                {!loading && !loadError && activeDraft && renderCalculator(activeDraft)}
            </div>
        </BaseModal>
    )
}

export default FlexiTalentCalculatorModal
