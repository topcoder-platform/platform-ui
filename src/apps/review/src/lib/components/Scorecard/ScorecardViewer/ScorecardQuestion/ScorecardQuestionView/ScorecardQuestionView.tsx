import { FC, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ReviewItemInfo, ScorecardQuestion } from '../../../../../models'
import { ScorecardViewerContextValue, useScorecardContext } from '../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'
import { ReviewAnswer } from '../ReviewResponse/ReviewAnswer'
import { ReviewComments } from '../ReviewResponse/ReviewComments'

import styles from './ScorecardQuestionView.module.scss'

interface ScorecardQuestionViewProps {
    question: ScorecardQuestion
    reviewItem?: ReviewItemInfo
    index: string
}

export const ScorecardQuestionView: FC<ScorecardQuestionViewProps> = props => {
    const {
        toggleItem,
        toggledItems,
        mappingAppeals,
    }: ScorecardViewerContextValue = useScorecardContext()

    const isExpanded = toggledItems[props.question.id!] ?? false
    const toggle = useCallback(() => toggleItem(props.question.id!), [props.question.id, toggleItem])

    const hasReviewData = useMemo(() => {
        if (!props.reviewItem) {
            return false
        }

        const hasAnswer = !!(props.reviewItem.finalAnswer || props.reviewItem.initialAnswer)
        const hasComments = props.reviewItem.reviewItemComments?.length > 0
        const hasManagerComment = !!props.reviewItem.managerComment
        return hasAnswer || hasComments || hasManagerComment
    }, [props.reviewItem])

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
                {isExpanded && (props.question.guidelines && (
                    <div className={styles.guidelines}>
                        {props.question.guidelines}
                    </div>
                ))}
            </ScorecardQuestionRow>

            {hasReviewData && props.reviewItem && (
                <>
                    <ReviewAnswer
                        question={props.question}
                        reviewItem={props.reviewItem}
                    />

                    <ReviewComments
                        question={props.question}
                        reviewItem={props.reviewItem}
                        mappingAppeals={mappingAppeals}
                    />
                </>
            )}
        </div>
    )
}

export default ScorecardQuestionView


