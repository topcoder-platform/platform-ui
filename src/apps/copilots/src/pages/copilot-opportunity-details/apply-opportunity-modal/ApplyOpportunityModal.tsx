/* eslint-disable react/jsx-no-bind */
import { FC, useCallback, useState } from 'react'

import { BaseModal, Button, InputTextarea } from '~/libs/ui'

import { applyCopilotOpportunity } from '../../../services/copilot-opportunities'

import styles from './styles.module.scss'

interface ApplyOpportunityModalProps {
    onClose: () => void
    copilotOpportunityId: number
    projectName: string
    onApplied: () => void
}

const ApplyOpportunityModal: FC<ApplyOpportunityModalProps> = props => {
    const [notes, setNotes] = useState('')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const onApply = useCallback(async () => {
        try {
            await applyCopilotOpportunity(props.copilotOpportunityId, notes ? {
                notes,
            } : undefined)

            props.onApplied()
            setSuccess(true)
        } catch (e: any) {
            setSuccess(false)
            setError(e.message)
        }
    }, [props.copilotOpportunityId, notes])

    const onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void = useCallback(e => {
        setNotes(e.target.value)
    }, [setNotes])

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title={
                success
                    ? 'Your Application Has Been Received!'
                    : 'Confirm Your Copilot Application'
            }
            buttons={
                !success ? (
                    <>
                        <Button disabled={!notes?.trim()} primary onClick={onApply} label='Apply' />
                        <Button secondary onClick={props.onClose} label='Cancel' />
                    </>
                ) : (
                    <Button primary onClick={props.onClose} label='Close' />
                )
            }
        >
            <div className={styles.applyCopilotModal}>
                <div className={styles.info}>
                    {
                        success
                            ? `Thank you for taking the time to apply for this exciting opportunity. 
                                We truly value your interest and effort. 
                                Your application will be reviewed promptly.`
                            : `We're excited to see your interest in joining our team as a copilot 
                            for this opportunity! Before we proceed, we want to 
                            ensure that you have carefully reviewed the opportunity requirements and 
                            are committed to meeting them. Please write below the reason(s) 
                            why you believe you're a good fit for this opportunity 
                            (e.g., previous experience, availability, etc.).`
                    }
                </div>
                {
                    !success && (
                        <InputTextarea
                            name='Reason'
                            onChange={onChange}
                            value={notes}
                            error={error}
                            dirty={!!error}
                        />
                    )
                }
            </div>
        </BaseModal>
    )
}

export default ApplyOpportunityModal
