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
} from '~/libs/ui'

import {
    StartDateTimeInput,
} from '../../../../lib/components/form'

import styles from './AssignmentDetailsModal.module.scss'

export interface AssignmentDetailsFormValue {
    agreementRate: string
    endDate: string
    memberHandle: string
    otherRemarks?: string
    startDate: string
}

interface AssignmentDetailsModalProps {
    initialValue?: AssignmentDetailsFormValue
    memberHandle?: string
    onCancel: () => void
    onSave: (data: AssignmentDetailsFormValue) => void
    open: boolean
}

interface ValidationErrors {
    agreementRate?: string
    endDate?: string
    startDate?: string
}

function toDate(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return undefined
    }

    return date
}

export const AssignmentDetailsModal: FC<AssignmentDetailsModalProps> = (
    props: AssignmentDetailsModalProps,
) => {
    const [agreementRate, setAgreementRate] = useState<string>(props.initialValue?.agreementRate || '')
    const [endDate, setEndDate] = useState<Date | undefined>(toDate(props.initialValue?.endDate))
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>(props.initialValue?.otherRemarks || '')
    const [startDate, setStartDate] = useState<Date | undefined>(toDate(props.initialValue?.startDate))

    const minStartDate = useMemo(() => new Date(), [])

    const minEndDate = useMemo(
        () => (startDate || minStartDate),
        [minStartDate, startDate],
    )

    const handleSave = useCallback((): void => {
        const nextErrors: ValidationErrors = {}

        if (!startDate) {
            nextErrors.startDate = 'Start date is required.'
        }

        if (!endDate) {
            nextErrors.endDate = 'End date is required.'
        }

        if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
            nextErrors.endDate = 'End date must be after start date.'
        }

        if (!agreementRate.trim()) {
            nextErrors.agreementRate = 'Agreement rate is required.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        props.onSave({
            agreementRate: agreementRate.trim(),
            endDate: endDate?.toISOString() || '',
            memberHandle: props.memberHandle || '',
            otherRemarks: otherRemarks.trim() || undefined,
            startDate: startDate?.toISOString() || '',
        })
    }, [agreementRate, endDate, otherRemarks, props, startDate])

    return (
        <BaseModal
            open={props.open}
            onClose={props.onCancel}
            title='Assignment Details'
            size='lg'
            buttons={(
                <div className={styles.actions}>
                    <Button
                        label='Cancel'
                        onClick={props.onCancel}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleSave}
                        primary
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <div className={styles.memberRow}>
                    <span className={styles.label}>Member</span>
                    <span className={styles.value}>{props.memberHandle || '-'}</span>
                </div>

                <div className={styles.fieldRow}>
                    <StartDateTimeInput
                        label='Start date *'
                        minDate={minStartDate}
                        onChange={value => {
                            setStartDate(value || undefined)
                            setErrors(previous => ({
                                ...previous,
                                startDate: undefined,
                            }))
                        }}
                        value={startDate}
                    />
                    {errors.startDate
                        ? <p className={styles.error}>{errors.startDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <StartDateTimeInput
                        label='End date *'
                        minDate={minEndDate}
                        onChange={value => {
                            setEndDate(value || undefined)
                            setErrors(previous => ({
                                ...previous,
                                endDate: undefined,
                            }))
                        }}
                        value={endDate}
                    />
                    {errors.endDate
                        ? <p className={styles.error}>{errors.endDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='assignment-rate'>
                        Agreement rate (per week) *
                    </label>
                    <input
                        id='assignment-rate'
                        className={styles.input}
                        min='0'
                        onChange={event => {
                            setAgreementRate(event.target.value)
                            setErrors(previous => ({
                                ...previous,
                                agreementRate: undefined,
                            }))
                        }}
                        step='0.01'
                        type='number'
                        value={agreementRate}
                    />
                    {errors.agreementRate
                        ? <p className={styles.error}>{errors.agreementRate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='assignment-remarks'>
                        Other remarks
                    </label>
                    <textarea
                        id='assignment-remarks'
                        className={styles.textarea}
                        onChange={event => setOtherRemarks(event.target.value)}
                        rows={3}
                        value={otherRemarks}
                    />
                </div>
            </div>
        </BaseModal>
    )
}

export default AssignmentDetailsModal
