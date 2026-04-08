import {
    FC,
    KeyboardEvent,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'
import classNames from 'classnames'

import {
    AiReviewConfig,
    ChallengeEditorFormData,
    Reviewer,
} from '../../../../../lib/models'
import {
    fetchChallenge,
    patchChallenge,
} from '../../../../../lib/services'

import {
    isAiReviewer,
    syncAiConfigReviewers,
} from './reviewers-field.utils'
import AiReviewTab from './AiReviewTab'
import HumanReviewTab from './HumanReviewTab'
import ReviewConfigurationSummary from './ReviewConfigurationSummary'
import styles from './ReviewersField.module.scss'

type ReviewTab = 'ai' | 'human'

interface ReviewersFieldProps {
    isReadOnly?: boolean
}

function hasReviewerChanges(
    currentReviewers: Reviewer[] | undefined,
    nextReviewers: Reviewer[],
): boolean {
    return JSON.stringify(currentReviewers || []) !== JSON.stringify(nextReviewers)
}

/**
 * Renders the challenge review section, showing either the read-only summary or
 * the editable human and AI review tabs.
 */
export const ReviewersField: FC<ReviewersFieldProps> = (props: ReviewersFieldProps) => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const [activeTab, setActiveTab] = useState<ReviewTab>('human')
    const humanTabRef = useRef<HTMLDivElement>(null)
    const aiTabRef = useRef<HTMLDivElement>(null)

    const reviewers = useWatch({
        control: formContext.control,
        name: 'reviewers',
    }) as Reviewer[] | undefined
    const challengeId = useWatch({
        control: formContext.control,
        name: 'id',
    }) as string | undefined
    const phases = useWatch({
        control: formContext.control,
        name: 'phases',
    }) as ChallengeEditorFormData['phases']
    const trackId = useWatch({
        control: formContext.control,
        name: 'trackId',
    }) as string | undefined
    const typeId = useWatch({
        control: formContext.control,
        name: 'typeId',
    }) as string | undefined
    const numOfSubmissions = useWatch({
        control: formContext.control,
        name: 'numOfSubmissions',
    }) as number | string | undefined
    const prizeSets = useWatch({
        control: formContext.control,
        name: 'prizeSets',
    }) as ChallengeEditorFormData['prizeSets']

    const reviewerRows = useMemo(
        () => (Array.isArray(reviewers)
            ? reviewers
            : []),
        [reviewers],
    )
    const humanReviewersCount = useMemo(
        () => reviewerRows.filter(reviewer => !isAiReviewer(reviewer)).length,
        [reviewerRows],
    )
    const aiReviewersCount = useMemo(
        () => reviewerRows.filter(isAiReviewer).length,
        [reviewerRows],
    )
    const humanReviewLabel = `Human Review (${humanReviewersCount})`
    const aiReviewLabel = `AI Review (${aiReviewersCount})`
    const hasSubmissions = useMemo(
        () => Number(numOfSubmissions || 0) > 0,
        [numOfSubmissions],
    )
    const handleTabChange = useCallback((tab: ReviewTab): void => {
        setActiveTab(tab)
    }, [])
    const focusTab = useCallback((tab: ReviewTab): void => {
        handleTabChange(tab)

        if (tab === 'human') {
            humanTabRef.current?.focus()

            return
        }

        aiTabRef.current?.focus()
    }, [handleTabChange])
    const getTabKeyDownHandler = useCallback(
        (tab: ReviewTab) => (event: KeyboardEvent<HTMLDivElement>): void => {
            const tabToFocusByKey: Partial<Record<string, ReviewTab>> = {
                ArrowLeft: tab === 'ai'
                    ? 'human'
                    : 'ai',
                ArrowRight: tab === 'human'
                    ? 'ai'
                    : 'human',
                End: 'ai',
                Home: 'human',
            }
            const nextTab = tabToFocusByKey[event.key]

            if (nextTab) {
                event.preventDefault()
                focusTab(nextTab)

                return
            }

            if (event.key !== 'Enter' && event.key !== ' ') {
                return
            }

            event.preventDefault()
            handleTabChange(tab)
        },
        [focusTab, handleTabChange],
    )

    const handleAiConfigPersisted = useCallback(
        (config: AiReviewConfig): void => {
            const currentReviewers = formContext.getValues('reviewers') as Reviewer[] | undefined
            const nextReviewers = syncAiConfigReviewers({
                phases,
                reviewers: currentReviewers,
                workflows: config.workflows,
            })

            if (!hasReviewerChanges(currentReviewers, nextReviewers)) {
                return
            }

            formContext.setValue('reviewers', nextReviewers, {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [formContext, phases],
    )
    const handleAiConfigRemoved = useCallback(async (): Promise<void> => {
        const currentReviewers = formContext.getValues('reviewers') as Reviewer[] | undefined
        const nextReviewers = (currentReviewers || []).filter(reviewer => !isAiReviewer(reviewer))

        if (!hasReviewerChanges(currentReviewers, nextReviewers)) {
            return
        }

        formContext.setValue('reviewers', nextReviewers, {
            shouldDirty: true,
            shouldValidate: true,
        })

        if (!challengeId) {
            return
        }

        try {
            await patchChallenge(challengeId, {
                reviewers: nextReviewers,
            })
        } catch (error) {
            try {
                const persistedChallenge = await fetchChallenge(challengeId)
                const persistedHumanReviewers = (persistedChallenge.reviewers || [])
                    .filter(reviewer => !isAiReviewer(reviewer))

                await patchChallenge(challengeId, {
                    reviewers: persistedHumanReviewers,
                })
            } catch (fallbackError) {
                throw new Error(fallbackError instanceof Error
                    ? fallbackError.message
                    : error instanceof Error
                        ? error.message
                        : 'AI review configuration was removed, but assigned AI workflows could not be cleared')
            }
        }
    }, [challengeId, formContext])

    return (
        <div className={styles.tabsContainer}>
            {props.isReadOnly
                ? (
                    <ReviewConfigurationSummary
                        challengeId={challengeId}
                        phases={phases}
                        prizeSets={prizeSets}
                        reviewers={reviewerRows}
                        typeId={typeId}
                    />
                )
                : undefined}

            {!props.isReadOnly
                ? (
                    <>
                        <div
                            aria-orientation='horizontal'
                            className={styles.tabList}
                            role='tablist'
                        >
                            <div
                                aria-controls='reviewers-human-panel'
                                aria-selected={activeTab === 'human'}
                                className={classNames(
                                    styles.tabButton,
                                    activeTab === 'human'
                                        ? styles.activeTab
                                        : undefined,
                                )}
                                id='reviewers-human-tab'
                                onClick={function onClick() {
                                    handleTabChange('human')
                                }}
                                onKeyDown={getTabKeyDownHandler('human')}
                                ref={humanTabRef}
                                role='tab'
                                tabIndex={activeTab === 'human' ? 0 : -1}
                            >
                                {humanReviewLabel}
                            </div>
                            <div
                                aria-controls='reviewers-ai-panel'
                                aria-selected={activeTab === 'ai'}
                                className={classNames(
                                    styles.tabButton,
                                    activeTab === 'ai'
                                        ? styles.activeTab
                                        : undefined,
                                )}
                                id='reviewers-ai-tab'
                                onClick={function onClick() {
                                    handleTabChange('ai')
                                }}
                                onKeyDown={getTabKeyDownHandler('ai')}
                                ref={aiTabRef}
                                role='tab'
                                tabIndex={activeTab === 'ai' ? 0 : -1}
                            >
                                {aiReviewLabel}
                            </div>
                        </div>

                        <fieldset className={styles.tabPanels}>
                            <div
                                aria-labelledby='reviewers-human-tab'
                                className={classNames(
                                    styles.tabPanel,
                                    activeTab !== 'human'
                                        ? styles.tabPanelHidden
                                        : undefined,
                                )}
                                hidden={activeTab !== 'human'}
                                id='reviewers-human-panel'
                                role='tabpanel'
                            >
                                <HumanReviewTab />
                            </div>

                            <div
                                aria-labelledby='reviewers-ai-tab'
                                className={classNames(
                                    styles.tabPanel,
                                    activeTab !== 'ai'
                                        ? styles.tabPanelHidden
                                        : undefined,
                                )}
                                hidden={activeTab !== 'ai'}
                                id='reviewers-ai-panel'
                                role='tabpanel'
                            >
                                <AiReviewTab
                                    challengeId={challengeId}
                                    hasSubmissions={hasSubmissions}
                                    onConfigPersisted={handleAiConfigPersisted}
                                    onConfigRemoved={handleAiConfigRemoved}
                                    reviewers={reviewerRows}
                                    trackId={trackId}
                                    typeId={typeId}
                                />
                            </div>
                        </fieldset>
                    </>
                )
                : undefined}
        </div>
    )
}

export default ReviewersField
