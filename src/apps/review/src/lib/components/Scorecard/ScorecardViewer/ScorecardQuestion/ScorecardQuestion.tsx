import { FC, useCallback } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ScorecardQuestion as ScorecardQuestionModel } from '../../../../models'
import { ScorecardViewerContextValue, useScorecardContext } from '../ScorecardViewer.context'

import { AiFeedback } from './AiFeedback'
import { ScorecardQuestionRow } from './ScorecardQuestionRow'
import styles from './ScorecardQuestion.module.scss'

interface ScorecardQuestionProps {
    index: string
    question: ScorecardQuestionModel
}

const ScorecardQuestion: FC<ScorecardQuestionProps> = props => {
    const { toggleItem, toggledItems }: ScorecardViewerContextValue = useScorecardContext()

    const isToggled = toggledItems[props.question.id!]
    const toggle = useCallback(() => toggleItem(props.question.id!), [props.question, toggleItem])

    return (
        <div className={styles.wrap}>
            <ScorecardQuestionRow
                icon={(
                    <IconOutline.ChevronDownIcon
                        className={classNames(styles.toggleBtn, isToggled && styles.toggled)}
                        onClick={toggle}
                    />
                )}
                index={`Question ${props.index}`}
                className={styles.headerBar}
                score=''
            >
                <span className={styles.questionText}>
                    {props.question.description}
                </span>
                {isToggled && (
                    <div className={styles.guidelines}>
                        {props.question.guidelines}
                    </div>
                )}
            </ScorecardQuestionRow>
            <AiFeedback question={props.question} />
        </div>
    )
}

export default ScorecardQuestion
