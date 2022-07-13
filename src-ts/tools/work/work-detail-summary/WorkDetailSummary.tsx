import { FC } from 'react'

import { Work, workCreateFromChallenge, WorkStatus } from '../work-lib'

import { WorkDetailHighlights } from './WorkDetailHighlights'
import { WorkDetailProgress } from './WorkDetailProgress'
import { WorkTransferredStatus } from './WorkTransferredStatus'

interface WorkDetailSummaryProps {
    challenge: any
    status?: WorkStatus
}

const WorkDetailSummary: FC<WorkDetailSummaryProps> = (props: WorkDetailSummaryProps) => {

    if (!props.challenge) {
        return <></>
    }

    const work: Work = workCreateFromChallenge(props.challenge)

    const progressElement: JSX.Element = props.status === WorkStatus.transferred
        ? <WorkTransferredStatus />
        : <WorkDetailProgress {...work.progress} />

    return (
        <>
            {progressElement}
            <WorkDetailHighlights work={work} />
        </>
    )
}

export default WorkDetailSummary
