import { FC } from 'react'

import { ScorecardSection as ScorecardSectionModel } from '../../../../models'
import { ScorecardQuestion } from '../ScorecardQuestion'
import { ScorecardScore } from '../ScorecardScore'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../ScorecardViewer.context'
import { createReviewItemMapping } from '../utils'

import styles from './ScorecardSection.module.scss'

interface ScorecardSectionProps {
    index: string
    section: ScorecardSectionModel
    reviewItemMapping?: ReturnType<typeof createReviewItemMapping>
}

const ScorecardSection: FC<ScorecardSectionProps> = props => {
    const { scoreMap }: ScorecardViewerContextValue = useScorecardViewerContext()

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
                        score={scoreMap.get(props.section.id as string) ?? 0}
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
