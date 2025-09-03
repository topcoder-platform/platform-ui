/**
 * Submission Table Actions For Non MM Challenge.
 */
import { FC } from 'react'

import { Button } from '~/libs/ui'

import { IsRemovingType, Submission } from '../../models'

import styles from './SubmissionTableActionsNonMM.module.scss'

interface Props {
    data: Submission
    isDownloading: IsRemovingType
    downloadSubmission: () => void
    isDoingAvScan: IsRemovingType
    doPostBusEventAvScan: () => void
}

export const SubmissionTableActionsNonMM: FC<Props> = (props: Props) => (
    <div className={styles.container}>
        <Button
            onClick={function onClick() {
                props.downloadSubmission()
            }}
            primary
            disabled={props.isDownloading[props.data.id]}
        >
            Download
        </Button>
        {props.data.isTheLatestSubmission && (
            <Button
                onClick={function onClick() {
                    props.doPostBusEventAvScan()
                }}
                primary
                disabled={props.isDoingAvScan[props.data.id]}
            >
                AV Rescan
            </Button>
        )}
    </div>
)

export default SubmissionTableActionsNonMM
