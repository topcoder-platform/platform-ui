/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { ClickstreamAnalytics } from '@aws/clickstream-web'

import {
    initializeAnalytics,
    recordAnalyticsClick,
    recordAnalyticsEvent,
    setAnalyticsMemberId,
} from './analytics.functions'

jest.mock('@aws/clickstream-web', () => ({
    Attr: {
        TRAFFIC_SOURCE_CAMPAIGN: 'traffic_source_campaign',
        TRAFFIC_SOURCE_CAMPAIGN_ID: 'traffic_source_campaign_id',
        TRAFFIC_SOURCE_CONTENT: 'traffic_source_content',
        TRAFFIC_SOURCE_MEDIUM: 'traffic_source_medium',
        TRAFFIC_SOURCE_SOURCE: 'traffic_source_source',
        TRAFFIC_SOURCE_TERM: 'traffic_source_term',
    },
    ClickstreamAnalytics: {
        init: jest.fn(() => true),
        record: jest.fn(),
        setGlobalAttributes: jest.fn(),
        setUserId: jest.fn(),
    },
    PageType: { SPA: 'SPA' },
    SendMode: { Batch: 'Batch' },
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ANALYTICS: {
            APP_ID: 'topcoder-web-dev',
            ENDPOINT: 'https://analytics.example.com',
        },
        ENV: 'dev',
    },
}), { virtual: true })

const mockedInit = ClickstreamAnalytics.init as jest.MockedFunction<typeof ClickstreamAnalytics.init>
const mockedRecord = ClickstreamAnalytics.record as jest.MockedFunction<typeof ClickstreamAnalytics.record>
const mockedSetGlobalAttributes = ClickstreamAnalytics.setGlobalAttributes as jest.MockedFunction<
typeof ClickstreamAnalytics.setGlobalAttributes
>
const mockedSetUserId = ClickstreamAnalytics.setUserId as jest.MockedFunction<
typeof ClickstreamAnalytics.setUserId
>

describe('AWS Clickstream analytics', () => {
    it('initializes first-touch attribution and records query-free semantic click and funnel data', () => {
        mockedInit.mockReturnValue(true)
        window.history.replaceState({}, '', '/landing?utm_source=Newsletter&utm_campaign=Fall%20Launch')
        document.cookie = `tc_utm=${encodeURIComponent(JSON.stringify({
            utm_campaign: 'StoredCampaign',
            utm_medium: 'email',
        }))}; Path=/`
        Object.defineProperty(window.navigator, 'doNotTrack', { configurable: true, value: '0' })
        Object.defineProperty(window.navigator, 'globalPrivacyControl', { configurable: true, value: false })
        Object.defineProperty(window, 'crypto', {
            configurable: true,
            value: {
                randomUUID: () => '12345678-1234-4123-8123-123456789012',
            },
        })
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })

        expect(initializeAnalytics())
            .toBe(true)
        expect(mockedInit)
            .toHaveBeenCalledWith(expect.objectContaining({
                appId: 'topcoder-web-dev',
                endpoint: 'https://analytics.example.com',
                globalAttributes: {
                    environment: 'dev',
                    surface: 'platform_ui',
                    traffic_source_campaign: 'FallLaunch',
                    traffic_source_medium: 'email',
                    traffic_source_source: 'Newsletter',
                },
                isTrackClickEvents: false,
                isTrackPageViewEvents: true,
                sendEventsInterval: 5000,
            }))
        expect(mockedSetUserId)
            .toHaveBeenCalledWith(expect.stringMatching(/^[A-Za-z0-9-]{16,64}$/))
        expect(document.cookie)
            .toContain('tc_analytics_id=')

        const main = document.createElement('main')
        main.dataset.analyticsPlacement = 'landing-hero'
        const anchor = document.createElement('a')
        anchor.dataset.analyticsId = 'hero/email'
        anchor.href = 'https://platform-ui.topcoder-dev.com/challenges/abc?token=excluded'
        main.append(anchor)
        document.body.append(main)
        const click = new MouseEvent('click', { clientX: 250, clientY: 600 })
        Object.defineProperty(click, 'target', { value: anchor })

        recordAnalyticsClick(click)
        expect(mockedRecord)
            .toHaveBeenCalledWith({
                attributes: {
                    click_x_percent: 25,
                    click_y_percent: 75,
                    destination_host: 'platform-ui.topcoder-dev.com',
                    destination_path: '/challenges/abc',
                    element_id: 'hero_email',
                    element_type: 'a',
                    page_path: '/landing',
                    placement: 'landing-hero',
                },
                isImmediate: true,
                name: 'ui_click',
            })

        setAnalyticsMemberId(42)
        recordAnalyticsEvent('challenge_registered', { challenge_id: 'abc' }, true)
        expect(mockedSetGlobalAttributes)
            .toHaveBeenCalledWith({ member_id: '42' })
        expect(mockedRecord)
            .toHaveBeenLastCalledWith({
                attributes: { challenge_id: 'abc' },
                isImmediate: true,
                name: 'challenge_registered',
            })

        main.remove()
    })
})
