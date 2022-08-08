import { FC, SVGProps } from 'react'

import {
    DataScienceBadge,
    DataScienceBadgeImg,
    DesignBadge,
    DesignBadgeImg,
    DevelopBadge,
    DevelopBadgeImg,
    QABadge,
    QABadgeImg,
} from './badges'

const badgesMap: {[key: string]: FC<SVGProps<SVGSVGElement>>} = {
    DATASCIENCE: DataScienceBadge,
    DESIGN: DesignBadge,
    DEV: DevelopBadge,
    QA: QABadge,
}

const badgesImgMap: {[key: string]: string} = {
    DATASCIENCE: DataScienceBadgeImg,
    DESIGN: DesignBadgeImg,
    DEV: DevelopBadgeImg,
    QA: QABadgeImg,
}

export function getBadge(badgeType: keyof typeof badgesMap): FC<SVGProps<SVGSVGElement>> {
    return badgesMap[badgeType]
}

export function getBadgeImg(badgeType: keyof typeof badgesMap): string {
    return badgesImgMap[badgeType]
}
