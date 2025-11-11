import { FC, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ScorecardQuestion as ScorecardQuestionModel } from '../../../../models'
import { ScorecardViewerContextValue, useScorecardContext } from '../ScorecardViewer.context'
import { createReviewItemMapping, normalizeScorecardQuestionId } from '../utils'
import { MarkdownReview } from '../../../MarkdownReview'

import { ReviewComments } from './ReviewResponse/ReviewComments'
import { AiFeedback } from './AiFeedback'
import { ScorecardQuestionEdit } from './ScorecardQuestionEdit'
import { ScorecardQuestionRow } from './ScorecardQuestionRow'
import { ReviewAnswer } from './ReviewResponse/ReviewAnswer'
import styles from './ScorecardQuestion.module.scss'

interface ScorecardQuestionProps {
    index: string
    question: ScorecardQuestionModel
    reviewItemMapping?: ReturnType<typeof createReviewItemMapping>
}

const ScorecardQuestion: FC<ScorecardQuestionProps> = props => {
    const {
        isEdit,
        toggleItem,
        toggledItems,
        mappingAppeals,
        scoreMap,
    }: ScorecardViewerContextValue = useScorecardContext()

    const normalizedQuestionId = useMemo(
        () => normalizeScorecardQuestionId(props.question.id as string),
        [props.question.id],
    )

    const reviewItemInfo = useMemo(() => {
        if (!normalizedQuestionId || !props.reviewItemMapping) {
            return undefined
        }

        return props.reviewItemMapping[normalizedQuestionId]
    }, [normalizedQuestionId, props.reviewItemMapping])

    const isExpanded = toggledItems[props.question.id!] ?? false
    const toggle = useCallback(() => toggleItem(props.question.id!), [props.question.id, toggleItem])

    const hasReviewData = useMemo(() => {
        if (!reviewItemInfo?.item) {
            return false
        }

        const reviewItem = reviewItemInfo.item
        const hasAnswer = !!(reviewItem.finalAnswer || reviewItem.initialAnswer)
        const hasComments = reviewItem.reviewItemComments?.length > 0
        const hasManagerComment = !!reviewItem.managerComment
        return hasAnswer || hasComments || hasManagerComment
    }, [reviewItemInfo])

    // If in edit mode and we have review item, show edit component
    if (isEdit && reviewItemInfo) {
        return (
            <div className={styles.wrap}>
                <ScorecardQuestionEdit
                    question={props.question}
                    reviewItem={reviewItemInfo.item}
                    index={props.index}
                    fieldIndex={reviewItemInfo.index}
                />
            </div>
        )
    }

    // View mode: render question with review data if available
    return (
        <div className={styles.wrap}>
            <ScorecardQuestionRow
                icon={(
                    <IconOutline.ChevronDownIcon
                        className={classNames(styles.toggleBtn, isExpanded && styles.expanded)}
                        onClick={toggle}
                    />
                )}
                index={`Question ${props.index}`}
                className={styles.header}
            >
                <span className={styles.questionText}>
                    {props.question.description}
                </span>
                {isExpanded && props.question.guidelines && (
                    <div className={styles.guidelines}>
                        <MarkdownReview
                            value={props.question.guidelines}
                            className={styles.guidelinesContent}
                        />
                    </div>
                )}
            </ScorecardQuestionRow>

            {!reviewItemInfo && <AiFeedback question={props.question} />}

            {hasReviewData && reviewItemInfo && (
                <>
                    <ReviewAnswer
                        question={props.question}
                        reviewItem={reviewItemInfo.item}
                    />

                    <ReviewComments
                        question={props.question}
                        reviewItem={reviewItemInfo.item}
                        mappingAppeals={mappingAppeals}
                    />
                </>
            )}
        </div>
    )
}

export default ScorecardQuestion
