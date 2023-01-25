import { FC, SVGProps } from 'react'

import { TcaCertificateType } from '../../../data-providers'

import { ReactComponent as DatabaseCertBadgeSvg } from './database.svg'
import { ReactComponent as DatascienceCertBadgeSvg } from './datascience.svg'
import { ReactComponent as DesignCertBadgeSvg } from './design.svg'
import { ReactComponent as DevCertBadgeSvg } from './dev.svg'
import { ReactComponent as InterviewCertBadgeSvg } from './interview.svg'
import { ReactComponent as QaCertBadgeSvg } from './qa.svg'
import { ReactComponent as SecurityCertBadgeSvg } from './security.svg'

export const certBadgeIconMap: {[key in TcaCertificateType]: FC} = {
    DATABASE: DatabaseCertBadgeSvg,
    DATASCIENCE: DatascienceCertBadgeSvg,
    DESIGN: DesignCertBadgeSvg,
    DEV: DevCertBadgeSvg,
    INTERVIEW: InterviewCertBadgeSvg,
    QA: QaCertBadgeSvg,
    SECURITY: SecurityCertBadgeSvg,
}

export function getCertBadgeIcon(certificateTrackType: TcaCertificateType): FC<SVGProps<SVGSVGElement>> {
    return certBadgeIconMap[certificateTrackType]
}
