import { FC, useContext } from 'react'

import { Button } from '../../../lib'
import { Work, workContext, WorkContextData, WorkStatus } from '../work-lib'

import styles from './WorkDetailHeader.module.scss'

interface WorkDetailHeaderProps {
    challenge?: any
    markAsDone: () => void
}

const WorkDetailHeader: FC<WorkDetailHeaderProps> = (props: WorkDetailHeaderProps) => {

    const workContextData: WorkContextData = useContext(workContext)

    // if we don't have the challenge yet, just return empty
    if (!props.challenge) {
        return <></>
    }

    const work: Work = workContextData.createFromChallenge(props.challenge)

    return (
        <div className={styles.container}>

            <h1 className={styles.heading}>
                {work.title}
            </h1>

            {work.status === WorkStatus.ready && (
                <Button
                    onClick={props.markAsDone}
                    label={'Mark as Done'}
                    size='md'
                />
            )}

        </div>
    )
}

export default WorkDetailHeader
