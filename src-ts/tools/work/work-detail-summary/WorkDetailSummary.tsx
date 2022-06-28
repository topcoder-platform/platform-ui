import { FC, useContext } from 'react'

import { Work, workContext, WorkContextData, WorkStatus } from '../work-lib'

import { WorkDetailHighlights } from './WorkDetailHighlights'
import { WorkDetailProgress } from './WorkDetailProgress'
import { WorkTransferredStatus } from './WorkTransferredStatus'

interface WorkDetailSummaryProps {
    challenge: any
    status?: WorkStatus
}

const WorkDetailSummary: FC<WorkDetailSummaryProps> = (props: WorkDetailSummaryProps) => {

    const workContextData: WorkContextData = useContext(workContext)

    if (!props.challenge) {
        return <></>
    }

    const work: Work = workContextData.createFromChallenge(props.challenge)

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
