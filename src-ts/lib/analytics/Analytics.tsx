import { FC } from 'react'

import { GoogleTagManager } from './google-tag-manater'
import { SegmentAnalytics } from './segment-analytics'

const Analytics: FC<{}> = () => (
    <>
        <GoogleTagManager />
        <SegmentAnalytics />
    </>
)

export default Analytics
