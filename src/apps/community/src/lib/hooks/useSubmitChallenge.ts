import { useCallback, useState } from 'react'

import {
    submitChallenge,
    type SubmitChallengePayload,
} from '../services'

export interface UseSubmitChallengeResult {
    agreed: boolean
    error: string
    isSubmitting: boolean
    submitDone: boolean
    uploadProgress: number
    reset: () => void
    setAgreed: (value: boolean) => void
    submit: (payload: SubmitChallengePayload) => Promise<void>
}

/**
 * Manages submission form state and executes the submission request.
 *
 * @returns Upload state, submit/reset handlers and terms agreement state.
 */
export function useSubmitChallenge(): UseSubmitChallengeResult {
    const [agreed, setAgreed] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [submitDone, setSubmitDone] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    const submit = useCallback(async (payload: SubmitChallengePayload): Promise<void> => {
        setError('')
        setIsSubmitting(true)
        setSubmitDone(false)
        setUploadProgress(0.1)

        try {
            await submitChallenge(payload)
            setUploadProgress(1)
            setSubmitDone(true)
        } catch (submissionError) {
            const message = submissionError instanceof Error
                ? submissionError.message
                : 'Failed to submit challenge.'
            setError(message)
            setUploadProgress(0)
            setSubmitDone(false)
        } finally {
            setIsSubmitting(false)
        }
    }, [])

    const reset = useCallback((): void => {
        setAgreed(false)
        setError('')
        setIsSubmitting(false)
        setSubmitDone(false)
        setUploadProgress(0)
    }, [])

    const handleSetAgreed = useCallback((value: boolean): void => {
        setAgreed(value)
    }, [])

    return {
        agreed,
        error,
        isSubmitting,
        reset,
        setAgreed: handleSetAgreed,
        submit,
        submitDone,
        uploadProgress,
    }
}
