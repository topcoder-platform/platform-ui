import { FC, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
    completeEmailChangeAsync,
    getEmailChangeErrorMessage,
} from '~/apps/accounts/src/lib/services'
import { ContentLayout, LinkButton, LoadingSpinner, PageTitle } from '~/libs/ui'

import styles from './ChangeEmailVerificationPage.module.scss'

type VerificationStatus = 'error' | 'loading' | 'success'

/**
 * Completes a pending email change when the member follows the validation link.
 */
const ChangeEmailVerificationPage: FC = () => {
    const [searchParams] = useSearchParams()
    const validationCode: string | null = searchParams.get('code')
        ?? searchParams.get('token')
    const [status, setStatus] = useState<VerificationStatus>('loading')
    const [message, setMessage] = useState<string>('Validating your new email address…')
    const requestedCode = useRef<string>()

    useEffect(() => {
        if (!validationCode) {
            requestedCode.current = undefined
            setStatus('error')
            setMessage('This email validation link is incomplete.')
            return
        }

        if (requestedCode.current === validationCode) {
            return
        }

        requestedCode.current = validationCode
        completeEmailChangeAsync(validationCode)
            .then(response => {
                setStatus('success')
                setMessage(`${response.email} is now your primary email address.`)
            })
            .catch(error => {
                setStatus('error')
                setMessage(getEmailChangeErrorMessage(
                    error,
                    'This email validation link is invalid or has expired.',
                ))
            })
    }, [validationCode])

    return (
        <ContentLayout outerClass={styles.layout}>
            <div className={styles.card}>
                <PageTitle>
                    {status === 'success' ? 'Email changed' : 'Validate email change'}
                </PageTitle>
                {status === 'loading' && <LoadingSpinner />}
                <p className={status === 'error' ? styles.error : undefined}>
                    {message}
                </p>
                {status !== 'loading' && (
                    <LinkButton
                        label='Return to Account Settings'
                        primary
                        reloadDocument
                        size='lg'
                        to='..'
                    />
                )}
            </div>
        </ContentLayout>
    )
}

export default ChangeEmailVerificationPage
