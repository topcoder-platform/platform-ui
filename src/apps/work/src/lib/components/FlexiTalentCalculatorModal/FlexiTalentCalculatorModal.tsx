import {
    ChangeEvent,
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { copyTextToClipboard } from '~/libs/shared'
import { BaseModal, Button } from '~/libs/ui'

import { EngagementLead } from '../../models/EngagementLead.model'
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
    parseDurationToWeeks,
} from '../../utils/flexi-talent-calculator.utils'

import styles from './FlexiTalentCalculatorModal.module.scss'

const DEFAULT_HOURS_PER_DAY = 8

interface DraftInput<TField extends string> {
    field: TField
    raw: string
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
    { field: 'tcMarginPercent', label: 'TC Margin %' },
    { field: 'tcMarginAmount', label: 'TC Margin Amount (USD)' },
    { field: 'bookingCost', label: 'Booking Cost (USD)' },
    { field: 'bookingRate', label: 'Booking Rate / Hour (USD)' },
    { field: 'actualCost', label: 'Actual Cost (USD)' },
    { field: 'actualRate', label: 'Actual Rate / Hour (USD)' },
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
 * proposal to share with the customer. Nothing is saved.
 */
export const FlexiTalentCalculatorModal: FC<FlexiTalentCalculatorModalProps> = (
    props: FlexiTalentCalculatorModalProps,
) => {
    const lead = props.lead

    const [memberName, setMemberName] = useState<string>('')
    const [accountName, setAccountName] = useState<string>(lead.accountName || '')
    const [roleTitle, setRoleTitle] = useState<string>(lead.roleTitle || '')
    const [smuCode, setSmuCode] = useState<string>(getSmuOption(lead.smu)?.code || '')
    const [hoursPerDayRaw, setHoursPerDayRaw] = useState<string>(
        String(lead.workingHoursPerDay || DEFAULT_HOURS_PER_DAY),
    )
    const [durationWeeksRaw, setDurationWeeksRaw] = useState<string>(
        String(parseDurationToWeeks(lead.engagementDuration) ?? ''),
    )
    const [referral, setReferral] = useState<boolean>(false)
    const [memberDraft, setMemberDraft] = useState<DraftInput<MemberInputField> | undefined>(undefined)
    const [commercialDraft, setCommercialDraft] = useState<DraftInput<CommercialInputField> | undefined>(
        undefined,
    )

    const hoursPerDay = parseCalculatorNumber(hoursPerDayRaw)
    const durationWeeks = parseCalculatorNumber(durationWeeksRaw)

    const result = useMemo(() => calculateFlexiTalentCosts({
        commercialInput: commercialDraft && {
            field: commercialDraft.field,
            value: parseCalculatorNumber(commercialDraft.raw),
        },
        durationWeeks,
        hoursPerDay,
        memberInput: memberDraft && {
            field: memberDraft.field,
            value: parseCalculatorNumber(memberDraft.raw),
        },
        referral,
        smuCode,
    }), [commercialDraft, durationWeeks, hoursPerDay, memberDraft, referral, smuCode])

    const proposal = useMemo(() => buildCostProposal({
        accountName,
        durationWeeks,
        hoursPerDay,
        memberName,
        result,
        roleTitle,
        smuCode,
    }), [accountName, durationWeeks, hoursPerDay, memberName, result, roleTitle, smuCode])

    const handleMemberNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setMemberName(event.target.value)
    }, [])

    const handleAccountNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setAccountName(event.target.value)
    }, [])

    const handleRoleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setRoleTitle(event.target.value)
    }, [])

    const handleSmuChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        setSmuCode(event.target.value)
    }, [])

    const handleHoursPerDayChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setHoursPerDayRaw(event.target.value)
    }, [])

    const handleDurationChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setDurationWeeksRaw(event.target.value)
    }, [])

    const handleReferralChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        setReferral(event.target.value === 'yes')
    }, [])

    const handleMemberFieldChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setMemberDraft({
            field: event.target.name as MemberInputField,
            raw: event.target.value,
        })
    }, [])

    const handleCommercialFieldChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setCommercialDraft({
            field: event.target.name as CommercialInputField,
            raw: event.target.value,
        })
    }, [])

    const handleCopyProposal = useCallback((): void => {
        copyTextToClipboard(proposal)
            .then(() => showSuccessToast('Cost proposal copied to clipboard.'))
            .catch((err: unknown) => showErrorToast(extractErrorMessage(err, 'Unable to copy the cost proposal.')))
    }, [proposal])

    const selectedSmu = getSmuOption(smuCode)

    return (
        <BaseModal
            open
            onClose={props.onClose}
            size='body'
            title='Flexi Talent Cost Calculator'
            buttons={(
                <>
                    <Button
                        label='Close'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Copy Cost Proposal'
                        onClick={handleCopyProposal}
                        primary
                    />
                </>
            )}
        >
            <div className={styles.content}>
                <p className={styles.subtitle}>
                    {`Lead ${lead.id}. Enter any one commercial value; the others are calculated from it.`}
                </p>

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Engagement</h4>
                    <div className={styles.grid}>
                        <label className={styles.field}>
                            <span className={styles.label}>Member Name</span>
                            <input
                                className={styles.input}
                                placeholder='Enter member name'
                                value={memberName}
                                onChange={handleMemberNameChange}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Account Name</span>
                            <input
                                className={styles.input}
                                value={accountName}
                                onChange={handleAccountNameChange}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Role</span>
                            <input
                                className={styles.input}
                                placeholder='Enter role'
                                value={roleTitle}
                                onChange={handleRoleTitleChange}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>SMU</span>
                            <select
                                className={styles.input}
                                value={smuCode}
                                onChange={handleSmuChange}
                            >
                                <option value=''>Select SMU</option>
                                {FLEXI_TALENT_SMU_OPTIONS.map(option => (
                                    <option key={option.code} value={option.code}>
                                        {`${option.label} (${(option.costTransferRate * 100).toFixed(2)}%)`}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Hours per Day</span>
                            <input
                                className={styles.input}
                                inputMode='decimal'
                                value={hoursPerDayRaw}
                                onChange={handleHoursPerDayChange}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Duration (Weeks)</span>
                            <input
                                className={styles.input}
                                inputMode='decimal'
                                placeholder={lead.engagementDuration || undefined}
                                value={durationWeeksRaw}
                                onChange={handleDurationChange}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Referral</span>
                            <select
                                className={styles.input}
                                value={referral ? 'yes' : 'no'}
                                onChange={handleReferralChange}
                            >
                                <option value='no'>No</option>
                                <option value='yes'>Yes</option>
                            </select>
                        </label>
                        <div className={styles.field}>
                            <span className={styles.label}>Total Billing Hours</span>
                            <span className={styles.readOnlyValue} data-testid='total-billing-hours'>
                                {formatCalculatorAmount(result.totalBillingHours)}
                            </span>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Member</h4>
                    <div className={styles.grid}>
                        {MEMBER_FIELDS.map(definition => (
                            <label
                                className={classNames(
                                    styles.field,
                                    memberDraft?.field === definition.field && styles.activeField,
                                )}
                                key={definition.field}
                            >
                                <span className={styles.label}>{definition.label}</span>
                                <input
                                    className={styles.input}
                                    inputMode='decimal'
                                    name={definition.field}
                                    value={getFieldValue(definition.field, memberDraft, result)}
                                    onChange={handleMemberFieldChange}
                                />
                            </label>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Commercials</h4>
                    <div className={styles.grid}>
                        {COMMERCIAL_FIELDS.map(definition => (
                            <label
                                className={classNames(
                                    styles.field,
                                    commercialDraft?.field === definition.field && styles.activeField,
                                )}
                                key={definition.field}
                            >
                                <span className={styles.label}>{definition.label}</span>
                                <input
                                    className={styles.input}
                                    inputMode='decimal'
                                    name={definition.field}
                                    value={getFieldValue(definition.field, commercialDraft, result)}
                                    onChange={handleCommercialFieldChange}
                                />
                            </label>
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
            </div>
        </BaseModal>
    )
}

export default FlexiTalentCalculatorModal
