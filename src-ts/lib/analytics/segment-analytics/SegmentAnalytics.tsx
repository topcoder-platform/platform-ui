import { FC } from 'react'

import { EnvironmentConfig } from '../../../config'

import './segment-snippet'

const SegmentAnalytics: FC<{}> = () => {

    // if we have a key for this environment, load it
    if (!!EnvironmentConfig.ANALYTICS.SEGMENT_KEY) {
        const segment: SegmentAnalytics.AnalyticsJS = window.analytics
        segment.load(EnvironmentConfig.ANALYTICS.SEGMENT_KEY)
        segment.page()
    }

    return <></>
}

export default SegmentAnalytics
