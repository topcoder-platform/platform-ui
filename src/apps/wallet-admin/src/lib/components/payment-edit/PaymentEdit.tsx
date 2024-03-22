/* eslint-disable unicorn/no-null */
/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { min } from 'date-fns'
import React, { useEffect, useMemo, useState } from 'react'

import { TOPCODER_URL } from '~/config/environments/default.env'
import { InputDatePicker, InputSelect, InputText } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PaymentEdit.module.scss'

interface PaymentEditFormProps {
    payment: Winning
    canSave?: (canSave: boolean) => void
    onValueUpdated?: ({
        releaseDate, netAmount, paymentStatus, auditNote,
    }: {
        releaseDate?: Date
        netAmount?: number
        paymentStatus?: string
        auditNote?: string
    }) => void
}

const PaymentEdit: React.FC<PaymentEditFormProps> = (props: PaymentEditFormProps) => {
    const [paymentStatus, setPaymentStatus] = useState('')
    const [releaseDate, setReleaseDate] = useState(new Date())
    const [netAmount, setNetAmount] = useState(0)
    const [netAmountErrorString, setNetAmountErrorString] = useState('')
    const [auditNote, setAuditNote] = useState('')
    const [dirty, setDirty] = useState(false)

    const initialValues = useMemo(() => ({
        auditNote: '',
        netPayment: props.payment.netPaymentNumber,
        paymentStatus: props.payment.status,
        releaseDate: props.payment.releaseDateObj,
    }), [props.payment])

    const validateNetAmount = (value: number): boolean => {
        if (Number.isNaN(value)) {
            setNetAmountErrorString('A valid number is required')
            return false
        }

        if (value < 0) {
            setNetAmountErrorString('Net Payment must be greater than 0')
            return false
        }

        if (!/^\d+(\.\d{0,2})?$/.test(value.toString())) {
            setNetAmountErrorString('Amount can only have 2 decimal places at most')
            return false
        }

        return true
    }

    const handleInputChange = (name: string, value: string | number | Date): void => {
        let isValid = true

        switch (name) {
            case 'netPayment':
                isValid = validateNetAmount(value as number)
                if (isValid) {
                    setNetAmount(value as number)
                    if (props.onValueUpdated) {
                        props.onValueUpdated({
                            netAmount: value as number,
                        })
                    }

                    setNetAmountErrorString('')
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
        setPaymentStatus(props.payment.status)
        setReleaseDate(props.payment.releaseDateObj)
        setNetAmount(props.payment.netPaymentNumber)
    }, [props.payment])

    useEffect(() => {
        const valuesToCheck = [{
            key: 'netPayment',
            value: netAmount,
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
    }, [netAmount, paymentStatus, releaseDate, auditNote, initialValues])

    useEffect(() => {
        if (props.canSave) {
            if (!dirty) {
                props.canSave(false)
            } else {
                const valuesToCheck = [{
                    key: 'netPayment',
                    value: netAmount,
                }, {
                    key: 'paymentStatus',
                    value: paymentStatus,
                }, {
                    key: 'releaseDate',
                    value: releaseDate,
                }]

                const haveChange = valuesToCheck.some(x => x.value !== initialValues[x.key as keyof typeof initialValues]) // check if any value has changed that's not the audit note
                props.canSave(haveChange && netAmountErrorString.length === 0 && auditNote.length > 0)
            }
        }
    }, [dirty, auditNote, props, netAmountErrorString.length, netAmount, paymentStatus, releaseDate, initialValues])

    const getLink = (externalId: string): string => `${TOPCODER_URL}/challenges/${externalId}`

    return (
        <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Description</span>
                    <a href={getLink(props.payment.externalId)} target='_blank' rel='noreferrer'>
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
                    name='netPayment'
                    label='Net Payment'
                    type='number'
                    placeholder='Modify Net Payment'
                    dirty
                    tabIndex={0}
                    error={netAmountErrorString}
                    value={props.payment.netPaymentNumber.toString()}
                    onChange={e => handleInputChange('netPayment', parseFloat(e.target.value))}

                />
                <InputSelect
                    tabIndex={-1}
                    dirty
                    name='paymentStatus'
                    label='Payment Status'
                    options={[
                        { label: 'Owed', value: 'Owed' },
                        { label: 'On Hold', value: 'On Hold' },
                        { label: 'Cancel', value: 'Cancel' },
                    ]}
                    value={paymentStatus}
                    onChange={e => handleInputChange('paymentStatus', e.target.value)}
                />
                <InputDatePicker
                    tabIndex={-2}
                    disabled={false}
                    error='Something wrong'
                    label='Release Date'
                    minDate={min([new Date(), new Date(props.payment.releaseDateObj)])}
                    date={releaseDate}
                    maxDate={new Date(new Date()
                        .getTime() + 15 * 24 * 60 * 60 * 1000)}
                    onChange={date => { if (date != null) handleInputChange('releaseDate', date) }}
                />
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
