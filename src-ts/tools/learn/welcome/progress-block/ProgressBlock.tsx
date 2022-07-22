import { FC } from 'react'

import {
    LearnCertification,
    MyCertificationCompleted,
    MyCertificationInProgress} from '../../learn-lib'

import { NoProgress } from './no-progress'
import { ProgressAction } from './progress-action'
import styles from './ProgressBlock.module.scss'

interface ProgressBlockProps {
    allCertifications: Array<LearnCertification>
    myCompletedCertifications: Array<MyCertificationCompleted>
    myInProgressCertifications: Array<MyCertificationInProgress>
    ready: boolean
}

const ProgressBlock: FC<ProgressBlockProps> = (props: ProgressBlockProps) => {

    if (!props.ready) {
        return <></>
    }

    const isStarted: boolean = !!props.myInProgressCertifications.length || !!props.myCompletedCertifications.length

    return (
        <div className={styles.wrap}>
            {!isStarted && <NoProgress />}
            {isStarted && <ProgressAction {...props} />}
        </div>
    )
}

export default ProgressBlock
