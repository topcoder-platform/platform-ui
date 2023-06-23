import { Work } from '../../../lib'
import { WorkStatusItem } from '../../work-status-item'

const WorkStatusRenderer: (work: Work) => JSX.Element
    = (work: Work): JSX.Element => <WorkStatusItem workStatus={work.status} />

export default WorkStatusRenderer
