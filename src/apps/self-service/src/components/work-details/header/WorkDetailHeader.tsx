import { FC } from 'react'

import { Button } from '~/libs/ui'

import { Work, workCreateFromChallenge, WorkStatus } from '../../../lib'

import styles from './WorkDetailHeader.module.scss'

interface WorkDetailHeaderProps {
    challenge?: any
    markAsDone: () => void
}

const WorkDetailHeader: FC<WorkDetailHeaderProps> = (props: WorkDetailHeaderProps) => {

    // if we don't have the challenge yet, just return empty
    if (!props.challenge) {
        return <></>
    }

    const work: Work = workCreateFromChallenge(props.challenge)

    return (
        <div className={styles.container}>

            <h1 className={styles.heading}>
                {work.title}
            </h1>

            {work.status === WorkStatus.ready && (
                <Button
                    onClick={props.markAsDone}
                    label='Mark as Done'
                    size='md'
                />
            )}

        </div>
    )
}

export default WorkDetailHeader
