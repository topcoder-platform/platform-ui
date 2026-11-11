import {
    ChangeEvent,
    FC,
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { copyTextToClipboard } from '~/libs/shared'
import {
    BaseModal,
    Button,
    InputSelect,
    InputSelectOption,
    InputText,
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
} from '../../utils/flexi-talent-calculator-drafts.utils'
import { ErrorMessage } from '../ErrorMessage'
import { LoadingSpinner } from '../LoadingSpinner'

import styles from './FlexiTalentCalculatorModal.module.scss'

const noop = (): void => undefined

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
 * proposal to share with the customer. A lead can have several saved calculations (e.g. one per
 * resource); saving one overwrites its previous values.
 */
export const FlexiTalentCalculatorModal: FC<FlexiTalentCalculatorModalProps> = (
    props: FlexiTalentCalculatorModalProps,
) => {
    const lead = props.lead

    const [drafts, setDrafts] = useState<CalculatorDraft[]>([])
    const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [loadError, setLoadError] = useState<string | undefined>(undefined)
    const [saving, setSaving] = useState<boolean>(false)
    const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false)
    // Not saved: the role always comes from the lead.
    const [roleTitle, setRoleTitle] = useState<string>(lead.roleTitle || '')

    const loadCalculations = useCallback(async (): Promise<void> => {
        setLoading(true)
        setLoadError(undefined)

        try {
            const calculations = await fetchEngagementLeadCalculations(lead.id)
            const loaded = calculations.length
                ? calculations.map(createDraftFromCalculation)
                : [createDraftFromLead(lead)]

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
        setDrafts(current => current.map(draft => (
            draft.key === activeKey ? { ...draft, ...patch, dirty: true } : draft
        )))
    }, [activeKey])

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
        setActiveKey(event.currentTarget.dataset.key)
        setConfirmingDelete(false)
    }, [])

    const handleAddCalculation = useCallback((): void => {
        const draft = createDraftFromLead(lead)

        setDrafts(current => [...current, draft])
        setActiveKey(draft.key)
        setConfirmingDelete(false)
    }, [lead])

    const handleSave = useCallback(async (): Promise<void> => {
        if (!activeDraft) {
            return
        }

        setSaving(true)

        try {
            const payload = getDraftSavePayload(activeDraft)
            const saved = activeDraft.id
                ? await updateEngagementLeadCalculation(lead.id, activeDraft.id, payload)
                : await createEngagementLeadCalculation(lead.id, payload)

            // Keep what the user typed on screen; only record that it is now saved.
            setDrafts(current => current.map(draft => (
                draft.key === activeDraft.key ? { ...draft, dirty: false, id: saved.id } : draft
            )))
            showSuccessToast('Cost calculation saved.')
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to save the cost calculation.'))
        } finally {
            setSaving(false)
        }
    }, [activeDraft, lead.id])

    const handleDelete = useCallback(async (): Promise<void> => {
        if (!activeDraft) {
            return
        }

        setSaving(true)

        try {
            if (activeDraft.id) {
                await deleteEngagementLeadCalculation(lead.id, activeDraft.id)
            }

            const index = drafts.findIndex(draft => draft.key === activeDraft.key)
            const remaining = drafts.filter(draft => draft.key !== activeDraft.key)
            // There is always a calculation to work on, so deleting the last one starts a new one.
            const nextDrafts = remaining.length ? remaining : [createDraftFromLead(lead)]

            setDrafts(nextDrafts)
            setActiveKey(nextDrafts[Math.min(index, nextDrafts.length - 1)].key)
            setConfirmingDelete(false)

            if (activeDraft.id) {
                showSuccessToast('Cost calculation deleted.')
            }
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to delete the cost calculation.'))
        } finally {
            setSaving(false)
        }
    }, [activeDraft, drafts, lead])

    const handleSaveClick = useCallback((): void => {
        handleSave()
            .catch(() => undefined)
    }, [handleSave])

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

    function renderButtons(): JSX.Element {
        if (confirmingDelete) {
            return (
                <>
                    <span className={styles.confirmText}>Delete this calculation?</span>
                    <Button
                        disabled={saving}
                        label='Cancel'
                        onClick={handleDeleteCancel}
                        secondary
                    />
                    <Button
                        disabled={saving}
                        label='Delete'
                        onClick={handleDeleteConfirm}
                        primary
                        variant='danger'
                    />
                </>
            )
        }

        return (
            <>
                <Button
                    label='Close'
                    onClick={props.onClose}
                    secondary
                />
                {activeDraft && (
                    <>
                        <Button
                            disabled={saving}
                            label='Delete'
                            onClick={handleDeleteClick}
                            secondary
                            variant='danger'
                        />
                        <Button
                            disabled={saving || !activeDraft.dirty}
                            label='Save'
                            onClick={handleSaveClick}
                            secondary
                        />
                        <Button
                            label='Copy Cost Proposal'
                            onClick={handleCopyProposal}
                            primary
                        />
                    </>
                )}
            </>
        )
    }

    function renderCalculator(draft: CalculatorDraft): JSX.Element {
        return (
            <>
                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Engagement</h4>
                    <div className={styles.grid}>
                        <InputText
                            forceUpdateValue
                            label='Member Name'
                            name='memberName'
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
                    <h4 className={styles.sectionTitle}>Cost Proposal</h4>
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
            buttons={renderButtons()}
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
                                {(draft.dirty || !draft.id) && (
                                    <span className={styles.unsaved} title='Not saved'>*</span>
                                )}
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
