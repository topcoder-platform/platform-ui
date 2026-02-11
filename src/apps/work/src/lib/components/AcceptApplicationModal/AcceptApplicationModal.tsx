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
    Application,
} from '../../models'
import {
    StartDateTimeInput,
} from '../form'

import styles from './AcceptApplicationModal.module.scss'

export interface AcceptApplicationFormData {
    agreementRate: string
    endDate: string
    otherRemarks?: string
    startDate: string
}

interface AcceptApplicationModalProps {
    application: Application | undefined
    isSubmitting?: boolean
    onCancel: () => void
    onConfirm: (data: AcceptApplicationFormData) => Promise<void> | void
    open: boolean
}

interface ValidationErrors {
    agreementRate?: string
    endDate?: string
    startDate?: string
}

function parseDate(value: Date | undefined): number {
    if (!value) {
        return 0
    }

    return value.getTime()
}

const AcceptApplicationModal: FC<AcceptApplicationModalProps> = (
    props: AcceptApplicationModalProps,
) => {
    const [agreementRate, setAgreementRate] = useState<string>('')
    const [endDate, setEndDate] = useState<Date | undefined>()
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>('')
    const [startDate, setStartDate] = useState<Date | undefined>()

    const isSubmitting = props.isSubmitting === true

    const minStartDate = useMemo(() => new Date(), [])

    const minEndDate = useMemo(() => {
        if (!startDate) {
            return minStartDate
        }

        return startDate
    }, [minStartDate, startDate])

    const resetState = useCallback((): void => {
        setAgreementRate('')
        setEndDate(undefined)
        setErrors({})
        setOtherRemarks('')
        setStartDate(undefined)
    }, [])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    const handleConfirm = useCallback(async (): Promise<void> => {
        const nextErrors: ValidationErrors = {}

        if (!startDate) {
            nextErrors.startDate = 'Tentative start date is required.'
        }

        if (!endDate) {
            nextErrors.endDate = 'Tentative end date is required.'
        }

        if (startDate && endDate && parseDate(endDate) < parseDate(startDate)) {
            nextErrors.endDate = 'Tentative end date must be after start date.'
        }

        if (!agreementRate.trim()) {
            nextErrors.agreementRate = 'Assignment rate is required.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        await props.onConfirm({
            agreementRate: agreementRate.trim(),
            endDate: endDate?.toISOString() || '',
            otherRemarks: otherRemarks.trim() || undefined,
            startDate: startDate?.toISOString() || '',
        })

        resetState()
    }, [agreementRate, endDate, otherRemarks, props, resetState, startDate])

    return (
        <BaseModal
            open={props.open}
            onClose={handleCancel}
            title='Accept Application'
            size='lg'
            buttons={(
                <div className={styles.actions}>
                    <Button
                        label='Cancel'
                        onClick={handleCancel}
                        secondary
                    />
                    <Button
                        label={isSubmitting ? 'Saving...' : 'Confirm'}
                        onClick={handleConfirm}
                        primary
                        disabled={isSubmitting}
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <div className={styles.member}>
                    <span className={styles.label}>Applicant</span>
                    <span className={styles.value}>
                        {`${props.application?.handle || '-'} / ${props.application?.name || '-'}`}
                    </span>
                </div>

                <div className={styles.fieldRow}>
                    <StartDateTimeInput
                        label='Tentative start date'
                        minDate={minStartDate}
                        value={startDate}
                        onChange={nextValue => {
                            setStartDate(nextValue || undefined)
                            setErrors(previous => ({
                                ...previous,
                                startDate: undefined,
                            }))
                        }}
                    />
                    {errors.startDate
                        ? <p className={styles.error}>{errors.startDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <StartDateTimeInput
                        label='Tentative end date'
                        minDate={minEndDate}
                        value={endDate}
                        onChange={nextValue => {
                            setEndDate(nextValue || undefined)
                            setErrors(previous => ({
                                ...previous,
                                endDate: undefined,
                            }))
                        }}
                    />
                    {errors.endDate
                        ? <p className={styles.error}>{errors.endDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='accept-application-rate'>
                        Assignment rate (per week) *
                    </label>
                    <input
                        id='accept-application-rate'
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
                    <label className={styles.label} htmlFor='accept-application-remarks'>
                        Other remarks
                    </label>
                    <textarea
                        id='accept-application-remarks'
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

export default AcceptApplicationModal
