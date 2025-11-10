import { FC, useMemo } from 'react'

import { ScorecardQuestion as ScorecardQuestionModel } from '../../../../models'
import { ScorecardViewerContextValue, useScorecardContext } from '../ScorecardViewer.context'
import { createReviewItemMapping, normalizeScorecardQuestionId } from '../utils'

import { AiFeedback } from './AiFeedback'
import { ScorecardQuestionEdit } from './ScorecardQuestionEdit'
import { ScorecardQuestionView } from './ScorecardQuestionView'
import styles from './ScorecardQuestion.module.scss'

interface ScorecardQuestionProps {
    index: string
    question: ScorecardQuestionModel
    reviewItemMapping?: ReturnType<typeof createReviewItemMapping>
}

const ScorecardQuestion: FC<ScorecardQuestionProps> = props => {
    const {
        isEdit,
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

    // If in view mode and we have review item, show view component
    if (!isEdit && reviewItemInfo) {
        return (
            <div className={styles.wrap}>
                <ScorecardQuestionView
                    question={props.question}
                    reviewItem={reviewItemInfo.item}
                    index={props.index}
                />
            </div>
        )
    }

    // Default: show read-only question (for AI scorecards or when no review data)
    return (
        <div className={styles.wrap}>
            <ScorecardQuestionView
                question={props.question}
                reviewItem={reviewItemInfo?.item}
                index={props.index}
            />
            <AiFeedback question={props.question} />
        </div>
    )
}

export default ScorecardQuestion
