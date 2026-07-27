import { FC, useCallback, useEffect, useMemo, useState } from 'react'

import {
    createChallengeReviewContext,
    deleteChallengeReviewContext,
    generateChallengeReviewContext,
    showErrorToast,
    showSuccessToast,
    useFetchChallengeReviewContext,
    UseFetchChallengeReviewContextResult,
} from '~/apps/work/src/lib'
import { Button, IconSolid } from '~/libs/ui'
import { ChallengeStatus } from '~/apps/admin/src/lib/models'
import { ConfirmationModal } from '~/apps/work/src/lib/components'

import ReviewContextEditor from './ReviewContextEditor'
import styles from './ReviewContextTab.module.scss'
import { IconButton } from '~/libs/ui/lib/components/button/icon-button'

interface ReviewContextTabProps {
    challengeId?: string
    challengeDescription?: string
    challengeStatus?: ChallengeStatus
    hasSubmissions?: boolean
    onRequirementCountChange?: (count: number | undefined) => void
}

const ReviewContextTab: FC<ReviewContextTabProps> = props => {
    const [isSaving, setIsSaving] = useState(false)
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
    const blockGenerate = props.challengeStatus !== ChallengeStatus.Draft
    const [saveError, setSaveError] = useState<string | undefined>()

    const {
        isLoading,
        context,
        error: fetchError,
        mutate: refetchContext,
    }: UseFetchChallengeReviewContextResult = useFetchChallengeReviewContext(props.challengeId)
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

        if ((props.challengeDescription?.trim().length ?? 0) < 100
            || props.challengeStatus === ChallengeStatus.New) {
            return 'Provide a detailed description of at least 100 characters and save the challenge as Draft before generating review context.'
        }

        if (hasLoadedContext && !hasContext) {
            return 'No review context defined for this challenge.'
        }

        return undefined
    }, [props.challengeId, fetchError, hasContext, hasLoadedContext, props.challengeDescription, props.challengeStatus])

    const createGeneratedReviewContext = useCallback(async (): Promise<void> => {
        const generatedContext = await generateChallengeReviewContext(props.challengeId || '')

        await createChallengeReviewContext({
            challengeId: props.challengeId || '',
            context: generatedContext,
            status: 'AI_GENERATED',
        })

        await refetchContext()
    }, [props.challengeId, refetchContext])

    const handleGenerateClick = useCallback(async (): Promise<void> => {
        if (!props.challengeId) {
            showErrorToast('Please save the challenge before generating review context.')
            return
        }

        setIsSaving(true)
        setSaveError(undefined)

        try {
            await createGeneratedReviewContext()
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
    }, [createGeneratedReviewContext])

    const handleConfirmRegenerate = useCallback(async (): Promise<void> => {
        if (!props.challengeId) {
            showErrorToast('Please save the challenge before regenerating review context.')
            setShowRegenerateConfirm(false)
            return
        }

        setShowRegenerateConfirm(false)
        setIsSaving(true)
        setSaveError(undefined)

        try {
            await deleteChallengeReviewContext(props.challengeId)
            await refetchContext()
            await createGeneratedReviewContext()
            showSuccessToast('Review context regenerated successfully.')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to regenerate review context.'

            setSaveError(message)
            showErrorToast(message)
        } finally {
            setIsSaving(false)
        }
    }, [createGeneratedReviewContext, props.challengeId])

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
                    <p><strong>{descriptionText}</strong></p>
                    {isLocked ? (
                        <div className={styles.errorText}>
                            Review context is locked because this challenge already has submissions.
                        </div>
                    ) : (
                        <>
                            <Button
                                disabled={isSaving || blockGenerate}
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
                <>
                    <div className={styles.regenerateToolbar}>
                        <p className={styles.description}>
                            Define the evaluation criteria for AI-powered requirements review.
                        </p>
                        <IconButton
                            icon={IconSolid.RefreshIcon}
                            disabled={isSaving || blockGenerate}
                            label='Regenerate'
                            onClick={function (): void {
                                setShowRegenerateConfirm(true)
                            }}
                            secondary
                            size='md'
                        />
                    </div>
                    <ReviewContextEditor
                        challengeId={props.challengeId ?? ''}
                        reviewContext={context}
                        onContextSaved={refetchContext}
                        isLocked={props.hasSubmissions === true}
                    />
                    {showRegenerateConfirm && (
                        <ConfirmationModal
                            title='Regenerate review context?'
                            message='This will delete the existing review context and generate a new one.'
                            onCancel={function (): void {
                                setShowRegenerateConfirm(false)
                            }}
                            onConfirm={handleConfirmRegenerate}
                            confirmButtonDanger
                            confirmText='Regenerate'
                        />
                    )}
                </>
            )}
        </div>
    )
}

export default ReviewContextTab
