import { FC, SVGProps } from 'react'

import { DataScienceBadge, DesignBadge, DevelopBadge, QABadge } from './badges'

const badgesMap: {[key: string]: FC<SVGProps<SVGSVGElement>>} = {
    DATASCIENCE: DataScienceBadge,
    DESIGN: DesignBadge,
    DEV: DevelopBadge,
    QA: QABadge,
}

export function getBadge(badgeType: keyof typeof badgesMap): FC<SVGProps<SVGSVGElement>> {
    return badgesMap[badgeType]
}
