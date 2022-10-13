import { FC, SVGProps } from 'react'

import {
    DataScienceBadge,
    DataScienceBadgeImg,
    DesignBadge,
    DesignBadgeImg,
    DevelopBadge,
    DevelopBadgeImg,
    InterviewBadge,
    InterviewBadgeImg,
    QABadge,
    QABadgeImg,
    SecurityBadge,
    SecurityBadgeImg,
} from './badges'

const badgesMap: {[key: string]: FC<SVGProps<SVGSVGElement>>} = {
    DATASCIENCE: DataScienceBadge,
    DESIGN: DesignBadge,
    DEV: DevelopBadge,
    INTERVIEW: InterviewBadge,
    QA: QABadge,
    SECURITY: SecurityBadge,
}

const badgesImgMap: {[key: string]: string} = {
    DATASCIENCE: DataScienceBadgeImg,
    DESIGN: DesignBadgeImg,
    DEV: DevelopBadgeImg,
    INTERVIEW: InterviewBadgeImg,
    QA: QABadgeImg,
    SECURITY: SecurityBadgeImg,
}

export function getBadge(badgeType: keyof typeof badgesMap): FC<SVGProps<SVGSVGElement>> {
    return badgesMap[badgeType]
}

export function getBadgeImg(badgeType: keyof typeof badgesMap): string {
    return badgesImgMap[badgeType]
}
