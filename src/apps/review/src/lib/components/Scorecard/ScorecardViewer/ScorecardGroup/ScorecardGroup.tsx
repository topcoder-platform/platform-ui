import { FC, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ScorecardGroup as ScorecardGroupModel } from '../../../../models'
import { ScorecardSection } from '../ScorecardSection'
import { ScorecardViewerContextValue, useScorecardContext } from '../ScorecardViewer.context'
import { ScorecardScore } from '../ScorecardScore'
import { calcGroupScore, createReviewItemMapping } from '../utils'

import styles from './ScorecardGroup.module.scss'

interface ScorecardGroupProps {
    index: number
    group: ScorecardGroupModel
    reviewItemMapping?: ReturnType<typeof createReviewItemMapping>
}

const ScorecardGroup: FC<ScorecardGroupProps> = props => {
    const { aiFeedbackItems }: ScorecardViewerContextValue = useScorecardContext()
    const allFeedbackItems = aiFeedbackItems || []
    const { toggleItem, toggledItems }: ScorecardViewerContextValue = useScorecardContext()

    const isVissible = !toggledItems[props.group.id]
    const toggle = useCallback(() => toggleItem(props.group.id), [props.group, toggleItem])

    const score = useMemo(() => (
        calcGroupScore(props.group, allFeedbackItems)
    ), [props.group, allFeedbackItems])

    return (
        <div className={styles.wrap}>
            <div className={classNames(styles.headerBar, isVissible && styles.toggled)} onClick={toggle}>
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
                        score={score}
                        scaleMax={1}
                        weight={props.group.weight}
                    />
                </span>
                <span className={styles.toggleBtn}>
                    <IconOutline.ChevronDownIcon />
                </span>
            </div>

            {isVissible && props.group.sections.map((section, index) => (
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
