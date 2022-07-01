import { FC } from 'react'

import { Button, ProgressBar, textFormatDateLocaleShortString } from '../../../../../lib'
import { CurriculumSummary as CurriculumSummaryStats, LearnCourse } from '../../../learn-lib'

import styles from './CurriculumSummary.module.scss'

interface CurriculumSummaryProps {
    completed?: boolean
    completedDate?: string
    completedPercentage?: number
    course: LearnCourse
    inProgress?: boolean
    onClickCertificateBtn?: () => void
    onClickMainBtn: () => void
}

const CurriculumSummary: FC<CurriculumSummaryProps> = (props: CurriculumSummaryProps) => {
    const progress: number|undefined = props.completedPercentage
    const inProgress: boolean|undefined = props.inProgress
    const completed: boolean|undefined = props.completed

    return (
        <div className={styles['wrap']}>
            {(inProgress || completed) && (
                <>
                    <div className={styles['title']}>
                        {completed && props.completedDate ? (
                            <>
                                <span>
                                    Completed{' '}
                                    {textFormatDateLocaleShortString(new Date(props.completedDate))}
                                </span>
                                <Button
                                    buttonStyle='secondary'
                                    size='xs'
                                    label='Get your certificate'
                                    onClick={props.onClickCertificateBtn}
                                />
                            </>
                        ) : ('In Progress')}
                    </div>
                    <ProgressBar progress={completed ? 1 : (progress ?? 0)} />
                </>
            )}

            <div className={styles['summary']}>
                <CurriculumSummaryStats
                    moduleCount={props.course.modules.length}
                    completionHours={props.course.completionHours}
                />

                <div className={styles['button']}>
                    <Button
                        buttonStyle={completed ? 'secondary' : 'primary'}
                        size='md'
                        label={completed ? 'Review' : (inProgress ? 'Resume' : 'Start Course')}
                        onClick={props.onClickMainBtn}
                    />
                </div>
            </div>
        </div>
    )
}

export default CurriculumSummary
