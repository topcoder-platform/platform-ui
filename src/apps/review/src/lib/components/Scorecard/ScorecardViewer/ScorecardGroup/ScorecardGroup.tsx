import { FC, useCallback } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ScorecardGroup as ScorecardGroupModel } from '../../../../models'
import { ScorecardSection } from '../ScorecardSection'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../ScorecardViewer.context'
import { ScorecardScore } from '../ScorecardScore'
import { createReviewItemMapping } from '../utils'
import { AiWorkflowRunStatus } from '../../../AiReviewsTable'

import styles from './ScorecardGroup.module.scss'

interface ScorecardGroupProps {
    index: number
    group: ScorecardGroupModel
    reviewItemMapping?: ReturnType<typeof createReviewItemMapping>
}

const ScorecardGroup: FC<ScorecardGroupProps> = props => {
    const { scoreMap, toggleItem, toggledItems }: ScorecardViewerContextValue = useScorecardViewerContext()

    const isVisible = !toggledItems[props.group.id]
    const toggle = useCallback(() => toggleItem(props.group.id), [props.group, toggleItem])
    const score = scoreMap.get(props.group.id)
    const weight = props.group.weight
    let status: 'passed' | 'pending' | 'failed-score' | undefined

    if (score === weight) {
        status = 'passed'
    } else if (!score) {
        status = 'failed-score'
    }

    return (
        <div className={styles.wrap}>
            <div className={classNames(styles.headerBar, isVisible && styles.toggled)} onClick={toggle}>
                <span className={styles.index}>
                    {props.index}
                    .
                </span>
                <span className={styles.name}>
                    {props.group.name}
                </span>
                <span className={styles.mx} />
                <span className={styles.score}>
                    <ScorecardScore
                        score={score ?? 0}
                        weight={props.group.weight}
                    />
                    {status && (
                        <AiWorkflowRunStatus
                            status={status}
                            score={score}
                            hideLabel
                        />
                    )}
                </span>
                <span className={styles.toggleBtn}>
                    <IconOutline.ChevronDownIcon />
                </span>
            </div>

            {isVisible && props.group.sections.map((section, index) => (
                <ScorecardSection
                    key={section.id}
                    section={section}
                    index={[props.index, index + 1].join('.')}
                    reviewItemMapping={props.reviewItemMapping}
                />
            ))}
        </div>
    )
}

export default ScorecardGroup
