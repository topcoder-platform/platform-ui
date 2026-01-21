/* eslint-disable unicorn/no-null */
/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { min } from 'date-fns'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { ENGAGEMENTS_URL, TOPCODER_URL } from '~/config/environments/default.env'
import { InputDatePicker, InputSelect, InputText } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PaymentEdit.module.scss'

interface PaymentEditFormProps {
    payment: Winning
    canSave?: (canSave: boolean) => void
    onValueUpdated?: ({
        releaseDate, grossAmount, paymentStatus, auditNote,
    }: {
        releaseDate?: Date
        description?: string
        grossAmount?: number
        paymentStatus?: string
        auditNote?: string
    }) => void
}

const PaymentEdit: React.FC<PaymentEditFormProps> = (props: PaymentEditFormProps) => {
    const [description, setDescription] = useState('')
    const [paymentStatus, setPaymentStatus] = useState('')
    const [releaseDate, setReleaseDate] = useState(new Date())
    const [grossAmount, setGrossAmount] = useState(0)
    const [grossAmountErrorString, setGrossAmountErrorString] = useState('')
    const [auditNote, setAuditNote] = useState('')
    const [dirty, setDirty] = useState(false)
    const [disableEdits, setDisableEdits] = useState(false)

    const initialValues = useMemo(() => ({
        auditNote: '',
        description: props.payment.description,
        grossAmount: props.payment.grossAmountNumber,
        paymentStatus: props.payment.status,
        releaseDate: props.payment.releaseDateObj,
    }), [props.payment])

    const validateGrossAmount = (value: number): boolean => {
        if (Number.isNaN(value)) {
            setGrossAmountErrorString('A valid number is required')
            return false
        }

        if (value < 0) {
            setGrossAmountErrorString('Payment must be greater than 0')
            return false
        }

        if (!/^\d+(\.\d{0,2})?$/.test(value.toString())) {
            setGrossAmountErrorString('Amount can only have 2 decimal places at most')
            return false
        }

        return true
    }

    const handleInputChange = (name: string, value: string | number | Date): void => {
        let isValid = true

        switch (name) {
            case 'grossPayment':
                isValid = validateGrossAmount(value as number)
                if (isValid) {
                    setGrossAmount(value as number)
                    if (props.onValueUpdated) {
                        props.onValueUpdated({
                            grossAmount: value as number,
                        })
                    }

                    setGrossAmountErrorString('')
                }

                break
            case 'paymentStatus':
                setPaymentStatus(value as string)
                if (props.onValueUpdated) {
                    props.onValueUpdated({
                        paymentStatus: value as string,
                    })
                }

                break
            case 'description':
                setDescription(value as string)
                if (props.onValueUpdated) {
                    props.onValueUpdated({
                        description: value as string,
                    })
                }

                break
            case 'releaseDate':
                setReleaseDate(value as Date)
                if (props.onValueUpdated) {
                    props.onValueUpdated({
                        releaseDate: value as Date,
                    })
                }

                break
            case 'auditNote':
                setAuditNote(value as string)
                if (props.onValueUpdated) {
                    props.onValueUpdated({
                        auditNote: value as string,
                    })
                }

                break
            default:
                break
        }
    }

    useEffect(() => {
        setDescription(props.payment.description)
        setPaymentStatus(props.payment.status)
        setReleaseDate(props.payment.releaseDateObj)
        setGrossAmount(props.payment.grossAmountNumber)
    }, [props.payment])

    useEffect(() => {
        const valuesToCheck = [{
            key: 'description',
            value: description,
        }, {
            key: 'grossPayment',
            value: grossAmount,
        }, {
            key: 'paymentStatus',
            value: paymentStatus,
        }, {
            key: 'releaseDate',
            value: releaseDate,
        }, {
            key: 'auditNote',
            value: auditNote,
        }]

        const isDirty = valuesToCheck.some(x => x.value !== initialValues[x.key as keyof typeof initialValues])
        setDirty(isDirty)
    }, [description, grossAmount, paymentStatus, releaseDate, auditNote, initialValues])

    useEffect(() => {
        if (props.canSave) {
            if (!dirty) {
                props.canSave(false)
            } else {
                const valuesToCheck = [{
                    key: 'description',
                    value: description,
                }, {
                    key: 'grossPayment',
                    value: grossAmount,
                }, {
                    key: 'paymentStatus',
                    value: paymentStatus,
                }, {
                    key: 'releaseDate',
                    value: releaseDate,
                }]

                const haveChange = valuesToCheck.some(x => x.value !== initialValues[x.key as keyof typeof initialValues]) // check if any value has changed that's not the audit note
                props.canSave(haveChange && grossAmountErrorString.length === 0 && auditNote.length > 0)
            }
        }
    }, [dirty, auditNote, props, grossAmountErrorString.length, description, grossAmount, paymentStatus, releaseDate, initialValues])

    const getLink = (payment: Winning): string => {
        if (payment.type.toLowerCase() === 'engagement payment') {
            return `${ENGAGEMENTS_URL}/${payment.externalId}`
        }

        return `${TOPCODER_URL}/challenges/${payment.externalId}`
    }

    const options = useCallback(() => {
        if (props.payment.status.toUpperCase() !== 'PAID') {
            const isMemberHold = [
                'On Hold (Member)',
                'On Hold (Tax Form)',
                'On Hold (Payment Provider)',
            ].includes(props.payment.status)

            return [
                ...(isMemberHold ? [{ label: props.payment.status, value: props.payment.status }] : []),
                { label: 'Owed', value: 'Owed' },
                { label: 'On Hold (Admin)', value: 'On Hold (Admin)' },
                { label: 'Cancel', value: 'Cancel' },
            ]
        }

        return [
            { label: 'Paid', value: 'Paid' },
            { label: 'Owed', value: 'Owed' },
        ]

    }, [props.payment.status])

    return (
        <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Description</span>
                    <a href={getLink(props.payment)} target='_blank' rel='noreferrer'>
                        {props.payment.description}
                    </a>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Payment ID</span>
                    <p className={styles.value}>{props.payment.id}</p>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Handle</span>
                    <p className={styles.value}>{props.payment.handle}</p>
                </div>

                <div className={styles.infoItem}>
                    <span className={styles.label}>Type</span>
                    <p className={styles.value}>{props.payment.type}</p>
                </div>

                <InputText
                    name='grossPayment'
                    label='Gross Payment'
                    type='number'
                    disabled={disableEdits}
                    placeholder='Modify Gross Payment Amount'
                    dirty
                    tabIndex={0}
                    error={grossAmountErrorString}
                    value={props.payment.grossAmountNumber.toString()}
                    onChange={e => handleInputChange('grossPayment', parseFloat(e.target.value))}
                />

                <InputText
                    name='description'
                    label='Description'
                    type='text'
                    disabled={disableEdits}
                    placeholder='Modify Description'
                    dirty
                    tabIndex={0}
                    error={!description?.length ? 'Description can\'t be empty' : ''}
                    value={props.payment.description.toString()}
                    onChange={e => handleInputChange('description', e.target.value)}
                />

                <InputSelect
                    tabIndex={-1}
                    dirty
                    name='paymentStatus'
                    label='Payment Status'
                    options={options()}
                    value={paymentStatus}
                    onChange={e => {
                        setDisableEdits(e.target.value === 'Cancel')
                        handleInputChange('paymentStatus', e.target.value)
                    }}
                />
                {props.payment.status.toUpperCase() !== 'PAID' && (
                    <InputDatePicker
                        tabIndex={-2}
                        disabled={disableEdits}
                        error='Something wrong'
                        label='Release Date'
                        minDate={min([new Date(), new Date(props.payment.releaseDateObj)])}
                        date={releaseDate}
                        maxDate={new Date(new Date()
                            .getTime() + 15 * 24 * 60 * 60 * 1000)}
                        onChange={date => { if (date != null) handleInputChange('releaseDate', date) }}
                    />
                )}
                <InputText
                    tabIndex={-3}
                    type='text'
                    label='Audit Note'
                    dirty
                    name='auditNote'
                    placeholder='Note'
                    error={dirty && auditNote.trim().length === 0 ? 'Note is required' : ''}
                    value={auditNote}
                    onChange={e => handleInputChange('auditNote', e.target.value)}
                />
            </div>
        </div>
    )
}

export default PaymentEdit
