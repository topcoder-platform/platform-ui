import { FC, useMemo } from 'react'

import { ReviewItemInfo, ScorecardQuestion as ScorecardQuestionModel } from '../../../../models'
import { ScorecardViewerContextValue, useScorecardContext } from '../ScorecardViewer.context'
import { normalizeScorecardQuestionId, createReviewItemMapping } from '../utils'
import { ScorecardQuestionEdit } from './ScorecardQuestionEdit'
import { ScorecardQuestionView } from './ScorecardQuestionView'
import { AiFeedback } from './AiFeedback'

import styles from './ScorecardQuestion.module.scss'

interface ScorecardQuestionProps {
    index: string
    question: ScorecardQuestionModel
    reviewItemMapping?: ReturnType<typeof createReviewItemMapping>
    formControl?: any
    formErrors?: any
    formIsTouched?: { [key: string]: boolean }
    formSetIsTouched?: any
    formTrigger?: any
    recalculateReviewProgress?: () => void
}

const ScorecardQuestion: FC<ScorecardQuestionProps> = props => {
    const {
        isEdit,
        reviewInfo,
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
    if (isEdit && reviewItemInfo && props.formControl) {
        return (
            <div className={styles.wrap}>
                <ScorecardQuestionEdit
                    question={props.question}
                    reviewItem={reviewItemInfo.item}
                    index={props.index}
                    control={props.formControl}
                    fieldIndex={reviewItemInfo.index}
                    errors={props.formErrors || {}}
                    isTouched={props.formIsTouched || {}}
                    setIsTouched={props.formSetIsTouched}
                    trigger={props.formTrigger}
                    recalculateReviewProgress={props.recalculateReviewProgress || (() => {})}
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
