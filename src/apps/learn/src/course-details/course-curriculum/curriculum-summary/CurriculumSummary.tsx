import { FC, ReactNode, useMemo } from 'react'

import { ProgressBar, textFormatDateLocaleShortString, Button } from '~/libs/ui'

import { CurriculumSummary as CurriculumSummaryStats, LearnCourse } from '../../../lib'

import styles from './CurriculumSummary.module.scss'

interface CurriculumSummaryProps {
    completed?: boolean
    completedDate?: string
    completedPercentage?: number
    course: LearnCourse
    inProgress?: boolean
    isLoggedIn: boolean
    onClickCertificateBtn?: () => void
    onClickMainBtn: () => void
}

const CurriculumSummary: FC<CurriculumSummaryProps> = (props: CurriculumSummaryProps) => {
    const progress: number|undefined = props.completedPercentage
    const inProgress: boolean|undefined = props.inProgress
    const completed: boolean|undefined = props.completed

    const mainBtnLabel: string = !props.isLoggedIn ? 'Log in & start' : (
        completed ? 'Review' : (
            inProgress ? 'Resume' : 'Start Course'
        )
    )

    const title: ReactNode = useMemo(() => {
        if (!completed || !props.completedDate) {
            return 'In Progress'
        }

        return (
            <>
                <span>
                    Completed
                    {' '}
                    {textFormatDateLocaleShortString(new Date(props.completedDate))}
                </span>
                <Button
                    secondary
                    size='sm'
                    label='View certificate'
                    onClick={props.onClickCertificateBtn}
                />
            </>
        )
    }, [completed, props.completedDate, props.onClickCertificateBtn])

    return (
        <div className={styles.wrap}>
            {(inProgress || completed) && (
                <>
                    <div className={styles.title}>
                        {title}
                    </div>
                    <ProgressBar progress={completed ? 100 : (progress ?? 0)} />
                </>
            )}

            <div className={styles.summary}>
                <CurriculumSummaryStats
                    moduleCount={props.course.modules.length}
                    completionTimeValue={props.course.estimatedCompletionTimeValue}
                    completionTimeUnits={props.course.estimatedCompletionTimeUnits}
                />

                <div className={styles.button}>
                    <Button
                        {...{ [completed ? 'secondary' : 'primary']: true }}
                        size='lg'
                        label={mainBtnLabel}
                        onClick={props.onClickMainBtn}
                    />
                </div>
            </div>
        </div>
    )
}

export default CurriculumSummary
