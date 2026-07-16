import { FC, useCallback, useMemo, useState } from 'react'

import { createChallengeReviewContext, generateChallengeReviewContext, showErrorToast, showSuccessToast, useFetchChallengeReviewContext } from '~/apps/work/src/lib'

import styles from './ReviewContextTab.module.scss'
import { Button } from '~/libs/ui'
import ReviewContextEditor from './ReviewContextEditor'

interface ReviewContextTabProps {
    challengeId?: string
    challengeName?: string
    challengeDescription?: string
}

const ReviewContextTab: FC<ReviewContextTabProps> = props => {
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | undefined>()

    const { isLoading, context, error: fetchError, mutate: refetchContext } = useFetchChallengeReviewContext(props.challengeId)
    const hasContext = !!context?.id
    const hasLoadedContext = !isLoading

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

            const response = await createChallengeReviewContext({
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
    }, [props.challengeId])

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
                    <Button
                        disabled={isSaving}
                        label={isSaving ? 'Generating context...' : 'Generate Challenge Review Context'}
                        onClick={handleGenerateClick}
                        size='lg'
                    />
                </div>
            )}
            {hasContext && context && (
                <ReviewContextEditor
                    challengeId={props.challengeId ?? ''}
                    reviewContext={context}
                    onContextSaved={refetchContext}
                />
            )}
        </div>
    )
}

export default ReviewContextTab
