import {
    FC,
    useCallback,
    useMemo,
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
    isAiReviewer,
    syncAiConfigReviewers,
} from './reviewers-field.utils'
import AiReviewTab from './AiReviewTab'
import HumanReviewTab from './HumanReviewTab'
import styles from './ReviewersField.module.scss'

type ReviewTab = 'ai' | 'human'

function hasReviewerChanges(
    currentReviewers: Reviewer[] | undefined,
    nextReviewers: Reviewer[],
): boolean {
    return JSON.stringify(currentReviewers || []) !== JSON.stringify(nextReviewers)
}

export const ReviewersField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const [activeTab, setActiveTab] = useState<ReviewTab>('human')

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
    const hasSubmissions = useMemo(
        () => Number(numOfSubmissions || 0) > 0,
        [numOfSubmissions],
    )
    const handleHumanTabClick = useCallback((): void => {
        setActiveTab('human')
    }, [])
    const handleAiTabClick = useCallback((): void => {
        setActiveTab('ai')
    }, [])

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

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsHeader}>
                <button
                    className={classNames(
                        styles.tabButton,
                        activeTab === 'human'
                            ? styles.tabButtonActive
                            : undefined,
                    )}
                    onClick={handleHumanTabClick}
                    type='button'
                >
                    Human Review (
                    {humanReviewersCount}
                    )
                </button>
                <button
                    className={classNames(
                        styles.tabButton,
                        activeTab === 'ai'
                            ? styles.tabButtonActive
                            : undefined,
                    )}
                    onClick={handleAiTabClick}
                    type='button'
                >
                    AI Review (
                    {aiReviewersCount}
                    )
                </button>
            </div>

            <div className={classNames(
                styles.tabPanel,
                activeTab !== 'human'
                    ? styles.tabPanelHidden
                    : undefined,
            )}
            >
                <HumanReviewTab />
            </div>

            <div className={classNames(
                styles.tabPanel,
                activeTab !== 'ai'
                    ? styles.tabPanelHidden
                    : undefined,
            )}
            >
                <AiReviewTab
                    challengeId={challengeId}
                    hasSubmissions={hasSubmissions}
                    onConfigPersisted={handleAiConfigPersisted}
                    reviewers={reviewerRows}
                    trackId={trackId}
                    typeId={typeId}
                />
            </div>
        </div>
    )
}

export default ReviewersField
