import { FC, useCallback, useMemo, useState } from 'react'
import Select, { SingleValue } from 'react-select'

import { ReviewItemInfo, ScorecardQuestion, SelectOption } from '../../../../../../models'
import { QUESTION_YES_NO_OPTIONS } from '../../../../../../../config/index.config'
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
        isSavingManagerComment,
        // addManagerComment,
        scoreMap,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const answer = useMemo(() => (
        props.reviewItem.finalAnswer || props.reviewItem.initialAnswer || ''
    ), [props.reviewItem.finalAnswer, props.reviewItem.initialAnswer])

    const [selectedScore, setSelectedScore] = useState(answer)

    const responseOptions = useMemo<SelectOption[]>(() => {
        if (props.question.type === 'SCALE') {
            const length = props.question.scaleMax - props.question.scaleMin + 1
            return Array.from(
                new Array(length),
                (x, i) => `${i + props.question.scaleMin}`,
            )
                .map(item => ({
                    label: item,
                    value: item,
                }))
        }

        if (props.question.type === 'YES_NO') {
            return QUESTION_YES_NO_OPTIONS
        }

        return []
    }, [props.question])

    const handleScoreChange = useCallback((option: SingleValue<SelectOption>) => {
        const nextValue = (option as SelectOption | null)?.value ?? ''
        setSelectedScore(nextValue)
    }, [])

    const score = useMemo(() => {
        const currentAnswer = selectedScore || answer
        if (props.question.type === 'YES_NO') {
            return currentAnswer === 'Yes' ? 1 : 0
        }

        if (props.question.type === 'SCALE' && currentAnswer) {
            const answerNum = parseInt(currentAnswer, 10)
            const totalPoint = props.question.scaleMax - props.question.scaleMin
            if (totalPoint > 0 && !Number.isNaN(answerNum)) {
                return (answerNum - props.question.scaleMin) / totalPoint
            }
        }

        return 0
    }, [selectedScore, answer, props.question])

    const selectedOption = useMemo(() => (
        responseOptions.find(opt => opt.value === (selectedScore || answer))
    ), [responseOptions, selectedScore, answer])

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
            {isManagerEdit && responseOptions.length > 0 ? (
                <Select
                    value={selectedOption}
                    onChange={handleScoreChange}
                    options={responseOptions}
                    isDisabled={isSavingManagerComment}
                    className={styles.select}
                />
            ) : (
                <p>
                    <strong>{answer}</strong>
                </p>
            )}
        </ScorecardQuestionRow>
    )
}

export default ReviewAnswer
