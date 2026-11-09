import {
    ChangeEvent,
    FC,
    useCallback,
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

const noop = (): void => undefined

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

    const handleSmuChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setSmuCode(event.target.value)
    }, [])

    const handleHoursPerDayChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setHoursPerDayRaw(event.target.value)
    }, [])

    const handleDurationChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setDurationWeeksRaw(event.target.value)
    }, [])

    const handleReferralChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
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
                        <InputText
                            forceUpdateValue
                            label='Member Name'
                            name='memberName'
                            onChange={handleMemberNameChange}
                            placeholder='Enter member name'
                            tabIndex={0}
                            type='text'
                            value={memberName}
                        />
                        <InputText
                            forceUpdateValue
                            label='Account Name'
                            name='accountName'
                            onChange={handleAccountNameChange}
                            tabIndex={0}
                            type='text'
                            value={accountName}
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
                            value={smuCode}
                        />
                        <InputText
                            forceUpdateValue
                            label='Duration (Weeks)'
                            name='durationWeeks'
                            onChange={handleDurationChange}
                            placeholder={lead.engagementDuration || undefined}
                            tabIndex={0}
                            type='text'
                            value={durationWeeksRaw}
                        />
                        <InputText
                            forceUpdateValue
                            label='Hours per Day'
                            name='hoursPerDay'
                            onChange={handleHoursPerDayChange}
                            tabIndex={0}
                            type='text'
                            value={hoursPerDayRaw}
                        />
                        <InputSelect
                            label='Referral'
                            name='referral'
                            onChange={handleReferralChange}
                            options={REFERRAL_OPTIONS}
                            value={referral ? 'yes' : 'no'}
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
                                    memberDraft?.field === definition.field && styles.activeField,
                                )}
                                forceUpdateValue
                                key={definition.field}
                                label={definition.label}
                                name={definition.field}
                                onChange={handleMemberFieldChange}
                                tabIndex={0}
                                type='text'
                                value={getFieldValue(definition.field, memberDraft, result)}
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
                                    commercialDraft?.field === definition.field && styles.activeField,
                                )}
                                forceUpdateValue
                                key={definition.field}
                                label={definition.label}
                                name={definition.field}
                                onChange={handleCommercialFieldChange}
                                tabIndex={0}
                                type='text'
                                value={getFieldValue(definition.field, commercialDraft, result)}
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
            </div>
        </BaseModal>
    )
}

export default FlexiTalentCalculatorModal
