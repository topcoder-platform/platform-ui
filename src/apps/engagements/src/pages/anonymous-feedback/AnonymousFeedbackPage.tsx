import { FC, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'

import { ContentLayout, IconOutline } from '~/libs/ui'

import { FeedbackForm } from '../../components'
import type { CreateFeedbackRequest } from '../../lib/models'
import { submitAnonymousFeedback } from '../../lib/services'

import styles from './AnonymousFeedbackPage.module.scss'

const AnonymousFeedbackPage: FC = () => {
    const params = useParams<{ secretToken: string }>()
    const secretToken = params.secretToken

    const [submitted, setSubmitted] = useState<boolean>(false)
    const [tokenError, setTokenError] = useState<string | undefined>(undefined)

    const linkError = secretToken
        ? tokenError
        : 'Invalid feedback link. Please check the URL or request a new link.'

    const handleSubmit = useCallback(async (data: CreateFeedbackRequest): Promise<void> => {
        if (!secretToken) {
            setTokenError('Invalid feedback link. Please check the URL or request a new link.')
            return
        }

        setTokenError(undefined)

        try {
            await submitAnonymousFeedback(secretToken, data)
            setSubmitted(true)
        } catch (err: any) {
            const status = err?.response?.status
            const message = err?.response?.data?.message || err?.message

            if (status === 400 || status === 404) {
                setTokenError(
                    message || 'This feedback link is no longer valid. Please request a new link.',
                )
                return
            }

            throw err
        }
    }, [secretToken])

    const showForm = !submitted && !linkError

    return (
        <ContentLayout title='Anonymous Feedback' contentClass={styles.pageContent}>
            <div className={styles.container}>
                <div className={styles.intro}>
                    <h2 className={styles.introTitle}>Share your experience</h2>
                    <p className={styles.introText}>
                        Your feedback helps us improve future engagements. It will be shared with the engagement team.
                    </p>
                </div>
                <div className={styles.card}>
                    {linkError && (
                        <div className={`${styles.notice} ${styles.noticeError}`}>
                            <IconOutline.ExclamationIcon className={styles.noticeIcon} />
                            <div>
                                <p className={styles.noticeTitle}>Feedback link unavailable</p>
                                <p className={styles.noticeText}>{linkError}</p>
                            </div>
                        </div>
                    )}
                    {submitted && (
                        <div className={`${styles.notice} ${styles.noticeSuccess}`}>
                            <IconOutline.CheckCircleIcon className={styles.noticeIcon} />
                            <div>
                                <p className={styles.noticeTitle}>Thank you for your feedback!</p>
                                <p className={styles.noticeText}>
                                    Your response has been submitted. You can now close this window.
                                </p>
                            </div>
                        </div>
                    )}
                    {showForm && (
                        <FeedbackForm
                            onSubmit={handleSubmit}
                            submitLabel='Submit Feedback'
                        />
                    )}
                </div>
            </div>
        </ContentLayout>
    )
}

export default AnonymousFeedbackPage
