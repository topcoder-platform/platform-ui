import { FC } from 'react'

import { GoogleTagManager } from './google-tag-manater'
import { SegmentAnalytics } from './segment-analytics'

const Analytics: FC<{}> = () => {

    return (
        <>
            <GoogleTagManager />
            <SegmentAnalytics />
        </>
    )
}

export default Analytics
