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

    const onApply = useCallback(async () => {
        try {
            await applyCopilotOpportunity(props.copilotOpportunityId, {
                notes,
            })

            props.onApplied()
            setSuccess(true)
        } catch (e) {
            setSuccess(true)
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
                    ? `Your Application for ${props.projectName} Has Been Received!`
                    : `Confirm Your Copilot Application for ${props.projectName}`
            }
            buttons={
                !success ? (
                    <>
                        <Button primary onClick={onApply} label='Apply' />
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
                            ? `We appreciate the time and effort you've taken to apply 
                            for this exciting opportunity. Our team is committed 
                            to providing a seamless and efficient process to ensure a 
                            great experience for all copilots. We will review your application 
                            within short time.`
                            : `We're excited to see your interest in joining our team as a copilot 
                            for the ${props.projectName} project! Before we proceed, we want to 
                            ensure that you have carefully reviewed the project requirements and 
                            are committed to meeting them.`
                    }
                </div>
                {
                    !success && (
                        <InputTextarea
                            name='Notes'
                            onChange={onChange}
                            value={notes}
                        />
                    )
                }
            </div>
        </BaseModal>
    )
}

export default ApplyOpportunityModal
