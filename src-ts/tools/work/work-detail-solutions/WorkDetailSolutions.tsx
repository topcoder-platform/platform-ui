import { FC, useContext, useMemo } from 'react'

import { Work, workContext, WorkContextData, WorkSolution, WorkStatus } from '../work-lib'

import { WorkSolutionsList } from './work-solutions-list'
import styles from './WorkDetailSolutions.module.scss'

interface WorkDetailSolutionsProps {
    challenge: any
    onDownload: (solutionId: string) => void
    solutions: Array<WorkSolution>
}

const WorkDetailSolutions: FC<WorkDetailSolutionsProps> = (props: WorkDetailSolutionsProps) => {

    const workContextData: WorkContextData = useContext(workContext)

    if (!props.challenge) {
        return <></>
    }

    const work: Work = workContextData.createFromChallenge(props.challenge)

    const isSolutionsReady: boolean = useMemo(() => {
        const activeStepName: string = work.progress.steps[work.progress.activeStepIndex]?.name
        return (activeStepName === WorkStatus.ready || activeStepName === WorkStatus.done)
    }, [
        work,
        props.solutions,
    ])

    return (
        <div className={styles.wrap}>
            {isSolutionsReady && (
                <div className={styles.header}>
                    <h3>
                        Solutions Available for Download
                    </h3>
                    <p className={'body-small'}>
                        The solutions listed below have met your detailed criteria. They are ranked based on the best solution as determined by Topcoder expert reviewers.
                    </p>
                </div>
            )}
            <WorkSolutionsList
                isSolutionsReady={isSolutionsReady}
                onDownload={props.onDownload}
                solutions={props.solutions}
                work={work}
            />
        </div>
    )
}

export default WorkDetailSolutions
