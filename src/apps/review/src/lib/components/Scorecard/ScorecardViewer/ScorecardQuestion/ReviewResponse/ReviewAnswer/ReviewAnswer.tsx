import { FC, useMemo } from 'react'

import { ReviewItemInfo, ScorecardQuestion } from '../../../../../../models'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../../ScorecardQuestionRow'
import { ScorecardScore } from '../../../ScorecardScore'

import styles from './ReviewAnswer.module.scss'

interface ReviewAnswerProps {
    question: ScorecardQuestion
    reviewItem: ReviewItemInfo
}

const ReviewAnswer: FC<ReviewAnswerProps> = props => {
    const {
        isManagerEdit,
        scoreMap,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const answer = useMemo(() => (
        props.reviewItem.finalAnswer || props.reviewItem.initialAnswer || ''
    ), [props.reviewItem.finalAnswer, props.reviewItem.initialAnswer])

    if (!answer && !isManagerEdit) {
        return <></>
    }

    return (
        <ScorecardQuestionRow
            index='Review Response'
            className={styles.wrap}
            score={(
                <ScorecardScore
                    score={scoreMap.get(props.question.id as string) ?? 0}
                    weight={props.question.weight}
                />
            )}
        >
            <p>
                <strong>{answer}</strong>
            </p>
        </ScorecardQuestionRow>
    )
}

export default ReviewAnswer
