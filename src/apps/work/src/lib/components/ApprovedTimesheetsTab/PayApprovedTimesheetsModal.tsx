/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
    Tooltip,
} from '~/libs/ui'

import { ApprovedTimesheetRow } from '../../models'
import {
    ApprovedTimesheetAssigneeSummary,
    getApprovedTimesheetPaymentAmount,
    summarizeApprovedTimesheetsByEngagement,
} from '../../utils/approved-timesheet.utils'
import { formatCurrency } from '../../utils/payment.utils'

import styles from './ApprovedTimesheetsTab.module.scss'

interface PayApprovedTimesheetsModalProps {
    isProcessing?: boolean
    onCancel: () => void
    onConfirm: (remarks: string) => Promise<void> | void
    open: boolean
    rows: ApprovedTimesheetRow[]
}

function isOverAgreedHours(assignee: ApprovedTimesheetAssigneeSummary): boolean {
    return assignee.agreedHours !== undefined
        && Math.round(assignee.hours * 100) > Math.round(assignee.agreedHours * 100)
}

function renderAssigneeHours(assignee: ApprovedTimesheetAssigneeSummary): JSX.Element {
    if (!isOverAgreedHours(assignee)) {
        return <span>{assignee.hours}</span>
    }

    return (
        <Tooltip
            content={`${assignee.hours} hours is above the ${assignee.agreedHours} agreed hours `
                + 'for the selected period'}
            place='top'
            strategy='fixed'
            triggerOn='click-hover'
        >
            <span className={styles.overAgreedHours}>
                {assignee.hours}
            </span>
        </Tooltip>
    )
}

export const PayApprovedTimesheetsModal: FC<PayApprovedTimesheetsModalProps> = (
    props: PayApprovedTimesheetsModalProps,
) => {
    const [remarks, setRemarks] = useState<string>('')
    const isProcessing = props.isProcessing === true

    const totals = useMemo(() => props.rows.reduce(
        (sum, row) => ({
            // Summed in hundredths so float drift cannot leak into hours or money.
            amountCents: sum.amountCents + Math.round((getApprovedTimesheetPaymentAmount(row) ?? 0) * 100),
            hoursHundredths: sum.hoursHundredths + Math.round(row.hours * 100),
        }),
        { amountCents: 0, hoursHundredths: 0 },
    ), [props.rows])
    const engagements = useMemo(
        () => summarizeApprovedTimesheetsByEngagement(props.rows),
        [props.rows],
    )

    const handleCancel = useCallback((): void => {
        if (isProcessing) {
            return
        }

        setRemarks('')
        props.onCancel()
    }, [isProcessing, props])

    const handleConfirm = useCallback(async (): Promise<void> => {
        await props.onConfirm(remarks.trim())
        setRemarks('')
    }, [props, remarks])

    return (
        <BaseModal
            open={props.open}
            onClose={handleCancel}
            title='Create Payments'
            size='body'
            buttons={(
                <div className={styles.modalActions}>
                    <Button
                        label='Cancel'
                        onClick={handleCancel}
                        secondary
                        disabled={isProcessing}
                    />
                    <Button
                        label={isProcessing ? 'Processing...' : 'Create Payments'}
                        onClick={handleConfirm}
                        primary
                        disabled={isProcessing || !props.rows.length}
                    />
                </div>
            )}
        >
            <div className={styles.modalContent}>
                <p className={styles.modalMessage}>
                    Add your remark and proceed to create payments for the selected timesheets
                </p>

                <div className={styles.modalSummary}>
                    <span>
                        {`${props.rows.length} ${props.rows.length === 1 ? 'timesheet' : 'timesheets'}`}
                    </span>
                    <span>{`${totals.hoursHundredths / 100} hours`}</span>
                    <span>{formatCurrency(totals.amountCents / 100)}</span>
                </div>

                {engagements.length
                    ? (
                        <div className={styles.modalBreakdown}>
                            <table className={styles.modalBreakdownTable}>
                                <thead>
                                    <tr>
                                        <th>Assignee</th>
                                        <th className={styles.numericCell}>Hours</th>
                                        <th className={styles.numericCell}>Amount</th>
                                    </tr>
                                </thead>
                                {engagements.map(engagement => (
                                    <tbody key={engagement.engagementId}>
                                        <tr>
                                            <th className={styles.modalEngagementRow} colSpan={3} scope='colgroup'>
                                                {engagement.engagementTitle ? (
                                                    <a
                                                        href={
                                                            `/projects/${
                                                                engagement.projectId
                                                            }/engagements/${
                                                                engagement.engagementId
                                                            }/view`
                                                        }
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                    >
                                                        {engagement.engagementTitle}
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </th>
                                        </tr>
                                        {engagement.assignees.map(assignee => (
                                            <tr key={assignee.assignmentId}>
                                                <td>{assignee.assigneeHandle || '-'}</td>
                                                <td className={styles.numericCell}>
                                                    {renderAssigneeHours(assignee)}
                                                </td>
                                                <td className={styles.numericCell}>
                                                    {formatCurrency(assignee.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ))}
                            </table>
                        </div>
                    )
                    : undefined}

                <label className={styles.modalLabel} htmlFor='approved-timesheets-remarks'>
                    Remarks (optional)
                </label>
                <textarea
                    id='approved-timesheets-remarks'
                    className={styles.modalTextarea}
                    disabled={isProcessing}
                    onChange={event => setRemarks(event.target.value)}
                    placeholder='Add notes or links for these payments'
                    rows={4}
                    value={remarks}
                />
            </div>
        </BaseModal>
    )
}

export default PayApprovedTimesheetsModal
