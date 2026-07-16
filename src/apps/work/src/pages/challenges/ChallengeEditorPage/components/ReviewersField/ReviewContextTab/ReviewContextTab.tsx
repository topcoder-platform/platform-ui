import { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { createChallengeReviewContext, generateChallengeReviewContext, showErrorToast, showSuccessToast, useFetchChallengeReviewContext } from '~/apps/work/src/lib'

import styles from './ReviewContextTab.module.scss'
import { Button } from '~/libs/ui'
import ReviewContextEditor from './ReviewContextEditor'

interface ReviewContextTabProps {
    challengeId?: string
    challengeDescription?: string
    hasSubmissions?: boolean
    onRequirementCountChange?: (count: number | undefined) => void
}

const ReviewContextTab: FC<ReviewContextTabProps> = props => {
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | undefined>()

    const { isLoading, context, error: fetchError, mutate: refetchContext } = useFetchChallengeReviewContext(props.challengeId)
    const hasContext = !!context?.id
    const hasLoadedContext = !isLoading
    const requirementCount = context?.context?.requirements?.length
    const isLocked = props.hasSubmissions === true

    useEffect(() => {
        props.onRequirementCountChange?.(requirementCount)
    }, [props.onRequirementCountChange, requirementCount])

    const descriptionText = useMemo(() => {
        if (!props.challengeId) {
            return 'Save the challenge before generating review context.'
        }

        if (fetchError) {
            return fetchError
        }

        if ((props.challengeDescription?.trim().length ?? 0) < 100) {
            return 'Make sure to add a clear challenge description before generating the review context.'
        }

        if (hasLoadedContext && !hasContext) {
            return 'No review context defined for this challenge.'
        }

        return undefined
    }, [props.challengeId, fetchError, hasContext, hasLoadedContext])

    const handleGenerateClick = useCallback(async (): Promise<void> => {
        if (!props.challengeId) {
            showErrorToast('Please save the challenge before generating review context.')
            return
        }

        setIsSaving(true)
        setSaveError(undefined)

        try {
            const generatedContext = await generateChallengeReviewContext(props.challengeId || '')

            await createChallengeReviewContext({
                challengeId: props.challengeId,
                context: generatedContext,
                status: 'AI_GENERATED',
            })

            await refetchContext()
            showSuccessToast('Review context generated successfully.')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to generate review context.'

            setSaveError(message)
            showErrorToast(message)
        } finally {
            setIsSaving(false)
        }
    }, [props.challengeId, refetchContext])

    if (isLoading) {
        return (
            <div className={styles.wrap}>
                <div className={styles.reviewContextLoading}>Loading review context...</div>
            </div>
        )
    }

    return (
        <div className={styles.wrap}>
            {descriptionText && !hasContext && (
                <div className={styles.reviewContextEmptyState}>
                    <div className={styles.reviewContextEmptyIcon}>📋</div>
                    <h3>Review context requirements</h3>
                    <p>
                        Define the evaluation criteria for AI-powered requirements review.
                    </p>
                    <p>{descriptionText}</p>
                    {isLocked ? (
                        <div className={styles.errorText}>
                            Review context is locked because this challenge already has submissions.
                        </div>
                    ) : (
                        <>
                            <Button
                                disabled={isSaving}
                                label={isSaving ? 'Generating context...' : 'Generate Challenge Review Context'}
                                onClick={handleGenerateClick}
                                size='lg'
                            />
                            {saveError && (
                                <div className={styles.errorText}>
                                    <p>{saveError}</p>
                                    <Button
                                        label='Retry'
                                        onClick={handleGenerateClick}
                                        secondary
                                        size='sm'
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            {hasContext && context && (
                <ReviewContextEditor
                    challengeId={props.challengeId ?? ''}
                    reviewContext={context}
                    onContextSaved={refetchContext}
                    isLocked={props.hasSubmissions === true}
                />
            )}
        </div>
    )
}

export default ReviewContextTab
