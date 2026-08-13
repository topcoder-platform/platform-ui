/* eslint-disable react/jsx-no-bind */
import { FC, useEffect, useState } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import { ChallengeTerm } from '../models'

import styles from './ChallengeTermsModal.module.scss'

interface ChallengeTermsModalProps {
    busy?: boolean
    onAccept: () => void
    onClose: () => void
    open: boolean
    terms: ChallengeTerm[]
}

/**
 * Renders the concise Figma registration-terms confirmation.
 *
 * @param props required terms, submit state, and accept/close actions.
 * @returns modal that requires explicit acknowledgement before registration.
 * @throws Does not throw.
 */
export const ChallengeTermsModal: FC<ChallengeTermsModalProps> = props => {
    const [accepted, setAccepted] = useState(false)

    useEffect(() => {
        if (props.open) setAccepted(false)
    }, [props.open])

    return (
        <BaseModal
            buttons={(
                <>
                    <Button disabled={props.busy} label='Cancel' onClick={props.onClose} secondary size='lg' />
                    <Button
                        disabled={!accepted || props.busy}
                        label={props.busy ? 'Registering…' : 'Agree & register'}
                        loading={props.busy}
                        onClick={props.onAccept}
                        primary
                        size='lg'
                    />
                </>
            )}
            center
            onClose={props.onClose}
            open={props.open}
            size='sm'
            title='Challenge terms'
        >
            <div className={styles.body}>
                <p>
                    Review the terms below before joining this competition.
                </p>
                {props.terms.length > 0 && (
                    <ul>
                        {props.terms.map((term: ChallengeTerm, index: number) => (
                            <li key={term.id ?? term.url ?? term.title ?? 'challenge-term'}>
                                {term.url ? (
                                    <a href={term.url} rel='noreferrer' target='_blank'>
                                        {term.title || `Challenge term ${index + 1}`}
                                    </a>
                                ) : term.title || `Challenge term ${index + 1}`}
                            </li>
                        ))}
                    </ul>
                )}
                <label>
                    <input
                        checked={accepted}
                        onChange={event => setAccepted(event.target.checked)}
                        type='checkbox'
                    />
                    <span>
                        In accordance with the Terms &amp; Conditions and Code of Conduct, I agree to participate.
                    </span>
                </label>
            </div>
        </BaseModal>
    )
}
