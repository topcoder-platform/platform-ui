import { Work, WorkStatusItem } from '../../work-lib'

const WorkStatusRenderer = (work: Work): JSX.Element => (
    <WorkStatusItem workStatus={work.status} />
)

export default WorkStatusRenderer
