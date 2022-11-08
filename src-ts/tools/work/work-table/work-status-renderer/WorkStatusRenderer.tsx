import { Work, WorkStatusItem } from '../../work-lib'

function WorkStatusRenderer(work: Work): JSX.Element {
    return <WorkStatusItem workStatus={work.status} />
}

export default WorkStatusRenderer
