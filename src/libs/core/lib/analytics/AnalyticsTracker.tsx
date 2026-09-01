import { FC, useEffect } from 'react'

import { ProfileContextData, useProfileContext } from '../profile'

import {
    initializeAnalytics,
    recordAnalyticsClick,
    setAnalyticsMemberId,
} from './analytics.functions'

/**
 * Connects AWS Clickstream to the Platform UI lifecycle, authenticated profile, and document clicks.
 *
 * @returns an empty React fragment because the tracker has no visual UI.
 * @throws Does not throw; the underlying analytics helpers isolate optional telemetry failures.
 */
export const AnalyticsTracker: FC = () => {
    const { initialized: profileInitialized, profile }: ProfileContextData = useProfileContext()

    useEffect(() => {
        if (!initializeAnalytics()) return undefined
        document.addEventListener('click', recordAnalyticsClick)
        return () => document.removeEventListener('click', recordAnalyticsClick)
    }, [])

    useEffect(() => {
        if (profileInitialized) setAnalyticsMemberId(profile?.userId)
    }, [profile?.userId, profileInitialized])

    return <></>
}
