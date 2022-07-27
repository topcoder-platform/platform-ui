import { ReactComponent as DatascienceBadge } from './datascience-badge.svg'
import { ReactComponent as DesignBadge } from './design-badge.svg'
import { ReactComponent as DevelopBadge } from './develop-badge.svg'
import { ReactComponent as QABadge } from './qa-badge.svg'

const badgesMap: {[key: string]: typeof QABadge} = {
    DATASCIENCE: DatascienceBadge,
    DESIGN: DesignBadge,
    DEV: DevelopBadge,
    QA: QABadge,
}

export function getBadge(badgeType: keyof typeof badgesMap): typeof QABadge {
    return badgesMap[badgeType]
}
