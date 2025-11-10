import { FC, useMemo } from 'react'

import { ScorecardSection as ScorecardSectionModel } from '../../../../models'
import { ScorecardQuestion } from '../ScorecardQuestion'
import { ScorecardScore } from '../ScorecardScore'
import { ScorecardViewerContextValue, useScorecardContext } from '../ScorecardViewer.context'
import { calcSectionScore, createReviewItemMapping } from '../utils'

import styles from './ScorecardSection.module.scss'

interface ScorecardSectionProps {
    index: string
    section: ScorecardSectionModel
    reviewItemMapping?: ReturnType<typeof createReviewItemMapping>
}

const ScorecardSection: FC<ScorecardSectionProps> = props => {
    const { aiFeedbackItems }: ScorecardViewerContextValue = useScorecardContext()
    const allFeedbackItems = aiFeedbackItems || []

    const score = useMemo(() => (
        calcSectionScore(props.section, allFeedbackItems)
    ), [props.section, allFeedbackItems])

    return (
        <div className={styles.wrap}>
            <div className={styles.headerBar}>
                <span className={styles.index}>
                    {props.index}
                    .
                </span>
                <span className={styles.name}>
                    {props.section.name}
                </span>
                <span className={styles.mx} />
                <span className={styles.score}>
                    <ScorecardScore
                        score={score}
                        scaleMax={1}
                        weight={props.section.weight}
                    />
                </span>
            </div>

            {props.section.questions.map((question, index) => (
                <ScorecardQuestion
                    key={question.id}
                    index={[props.index, index + 1].join('.')}
                    question={question}
                    reviewItemMapping={props.reviewItemMapping}
                />
            ))}
        </div>
    )
}

export default ScorecardSection
