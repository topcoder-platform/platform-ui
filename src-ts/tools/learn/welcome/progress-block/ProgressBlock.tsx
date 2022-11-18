import { FC } from 'react'

import {
    LearnCertification,
    UserCertificationCompleted,
    UserCertificationInProgress,
} from '../../learn-lib'

import { NoProgress } from './no-progress'
import { ProgressAction } from './progress-action'
import styles from './ProgressBlock.module.scss'

interface ProgressBlockProps {
    allCertifications: Array<LearnCertification>
    ready: boolean
    userCompletedCertifications: ReadonlyArray<UserCertificationCompleted>
    userInProgressCertifications: ReadonlyArray<UserCertificationInProgress>
}

const ProgressBlock: FC<ProgressBlockProps> = (props: ProgressBlockProps) => {

    if (!props.ready) {
        return <></>
    }

    const isStarted: boolean = (
        !!props.userInProgressCertifications.length || !!props.userCompletedCertifications.length
    )

    return (
        <div className={styles.wrap}>
            {!isStarted && <NoProgress />}
            {isStarted && <ProgressAction {...props} />}
        </div>
    )
}

export default ProgressBlock
