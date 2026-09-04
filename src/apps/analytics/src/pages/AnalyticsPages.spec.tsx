/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'

import { useAnalyticsResource } from '../lib/hooks'
import {
    AnalyticsFilterOptions,
    CampaignReport,
    GeneralReport,
} from '../lib/models'

import { CampaignAnalyticsPage } from './CampaignAnalyticsPage'
import { GeneralAnalyticsPage } from './GeneralAnalyticsPage'

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        children?: ReactNode
        disabled?: boolean
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit' ? 'submit' : 'button'}
        >
            {props.children}
        </button>
    ),
    IconOutline: { RefreshIcon: 'refresh' },
    LoadingSpinner: (props: { message?: string; overlay?: boolean }) => (
        <div data-overlay={String(Boolean(props.overlay))} data-testid='loading-spinner'>
            {props.message}
        </div>
    ),
    PageTitle: (props: { children?: ReactNode }) => <>{props.children}</>,
}), { virtual: true })

jest.mock('~/config', () => ({
    AppSubdomain: { analytics: 'analytics' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

jest.mock('highcharts-react-official', () => ({
    __esModule: true,
    default: (props: { options: { chart?: { type?: string } } }) => (
        <div data-chart-type={props.options.chart?.type} data-testid='highcharts' />
    ),
}))

jest.mock('../lib/hooks', () => ({ useAnalyticsResource: jest.fn() }))
jest.mock('../lib/services', () => ({
    getAnalyticsFilters: jest.fn(),
    getCampaignReport: jest.fn(),
    getGeneralReport: jest.fn(),
}))

const mockedUseAnalyticsResource = useAnalyticsResource as unknown as jest.Mock
const refresh = jest.fn()
const filterOptions: AnalyticsFilterOptions = {
    campaignIds: ['dev_fixture'],
    campaigns: ['aws_analytics'],
    generatedAt: '2026-09-02T00:00:00Z',
    mediums: ['integration'],
    sources: ['codex'],
    surfaces: ['platform_ui', 'topcoder_website'],
}

let reportResource: object

/**
 * Configures the generic analytics resource mock for one page render.
 *
 * @param resource report lifecycle state returned for the non-filter request.
 * @returns void after installing stable filter and report responses.
 * @throws Does not throw.
 */
function mockAnalyticsResources(resource: object): void {
    reportResource = resource
    mockedUseAnalyticsResource.mockImplementation((key: string) => (
        key === 'analytics-filters'
            ? { data: filterOptions, loading: false, refresh, refreshing: false }
            : reportResource
    ))
}

describe('Analytics report pages', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('keeps campaign controls usable and places loading after the filters without an overlay', () => {
        mockAnalyticsResources({ loading: true, refresh, refreshing: false })

        render(<CampaignAnalyticsPage />)

        const filters = screen.getByRole('heading', { name: 'Filters' })
            .closest('form') as HTMLFormElement
        const loading = screen.getByRole('status', { name: 'Loading campaign analytics…' })
        const siblings = Array.from(filters.parentElement?.children ?? [])

        expect(siblings.indexOf(filters))
            .toBeLessThan(siblings.indexOf(loading))
        expect(within(loading)
            .getByTestId('loading-spinner'))
            .toHaveAttribute('data-overlay', 'false')
        expect(screen.getByLabelText('Campaign'))
            .toBeEnabled()
        expect(screen.getByRole('button', { name: 'Apply' }))
            .toBeEnabled()
    })

    it('shows the top twenty click locations without position and paginates the remainder', () => {
        const data: CampaignReport = {
            campaigns: [],
            clickLocations: Array.from({ length: 45 }, (_, index) => ({
                clickers: 100 - index,
                clicks: 200 - index,
                elementId: `clicked-item-${String(index + 1)
                    .padStart(2, '0')}`,
                elementType: 'button',
                pagePath: `/campaign-page-${String(index + 1)
                    .padStart(2, '0')}`,
                placement: 'main',
            })),
            dataThrough: '2026-09-03',
            filters: {
                campaign: '',
                campaignId: '',
                from: '2026-08-05',
                medium: '',
                source: '',
                to: '2026-09-03',
            },
            generatedAt: '2026-09-04T00:00:00Z',
            landingPages: [],
            series: [],
            totals: {
                clickThroughPercent: 50,
                clickToRegistrationPercent: 50,
                landingClickers: 50,
                landingToSubmissionPercent: 12,
                landingUsers: 100,
                registrations: 25,
                registrationToSubmissionPercent: 48,
                submissions: 12,
            },
        }
        mockAnalyticsResources({ data, loading: false, refresh, refreshing: false })

        render(<CampaignAnalyticsPage />)

        const clicksPanel = screen.getByRole('heading', { name: 'Where people clicked' })
            .closest('article') as HTMLElement
        expect(within(clicksPanel)
            .queryByRole('columnheader', { name: 'Position' }))
            .not.toBeInTheDocument()
        expect(within(clicksPanel)
            .getByText('/campaign-page-01'))
            .toBeInTheDocument()
        expect(within(clicksPanel)
            .getByText('/campaign-page-20'))
            .toBeInTheDocument()
        expect(within(clicksPanel)
            .queryByText('/campaign-page-21'))
            .not.toBeInTheDocument()
        expect(within(clicksPanel)
            .getByText('Showing 1–20 of 45 clicked items'))
            .toBeInTheDocument()

        fireEvent.click(within(clicksPanel)
            .getByRole('button', { name: 'Next' }))

        expect(within(clicksPanel)
            .queryByText('/campaign-page-01'))
            .not.toBeInTheDocument()
        expect(within(clicksPanel)
            .getByText('/campaign-page-21'))
            .toBeInTheDocument()
        expect(within(clicksPanel)
            .getByText('Showing 21–40 of 45 clicked items'))
            .toBeInTheDocument()
    })

    it('uses separate area charts, omits surfaces, and paginates visited pages twenty at a time', () => {
        const data: GeneralReport = {
            dataThrough: '2026-09-01',
            filters: { from: '2026-08-04', surface: '', to: '2026-09-02' },
            generatedAt: '2026-09-02T00:00:00Z',
            pages: Array.from({ length: 45 }, (_, index) => ({
                pageViews: 1_000 - index,
                path: `/page-${String(index + 1)
                    .padStart(2, '0')}`,
                surface: index % 2 === 0 ? 'topcoder_website' : 'platform_ui',
                visitors: 500 - index,
            })),
            series: [
                { clickers: 12, clicks: 24, date: '2026-09-01', pageViews: 100, visitors: 60 },
            ],
            sources: [{ pageViews: 100, source: 'Direct', visitors: 60 }],
            surfaces: [{ clicks: 24, pageViews: 100, surface: 'platform_ui', visitors: 60 }],
            totals: { clickers: 12, clicks: 24, pageViews: 100, visitors: 60 },
        }
        mockAnalyticsResources({ data, loading: false, refresh, refreshing: false })

        render(<GeneralAnalyticsPage />)

        const chartLabels = ['Daily page views', 'Daily unique visitors', 'Daily clicks']
        chartLabels.forEach(label => {
            expect(within(screen.getByLabelText(label))
                .getByTestId('highcharts'))
                .toHaveAttribute('data-chart-type', 'area')
        })
        expect(screen.queryByText('Site engagement over time'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Application surfaces'))
            .not.toBeInTheDocument()

        const pagesPanel = screen.getByRole('heading', { name: 'Most visited pages' })
            .closest('section') as HTMLElement
        expect(within(pagesPanel)
            .getByText('/page-01'))
            .toBeInTheDocument()
        expect(within(pagesPanel)
            .getByText('/page-20'))
            .toBeInTheDocument()
        expect(within(pagesPanel)
            .queryByText('/page-21'))
            .not.toBeInTheDocument()
        expect(within(pagesPanel)
            .getByText('Showing 1–20 of 45 pages'))
            .toBeInTheDocument()

        fireEvent.click(within(pagesPanel)
            .getByRole('button', { name: 'Next' }))

        expect(within(pagesPanel)
            .queryByText('/page-01'))
            .not.toBeInTheDocument()
        expect(within(pagesPanel)
            .getByText('/page-21'))
            .toBeInTheDocument()
        expect(within(pagesPanel)
            .getByText('Showing 21–40 of 45 pages'))
            .toBeInTheDocument()
    })

    it('contains the General loading state below its still-enabled filters', () => {
        mockAnalyticsResources({ loading: false, refresh, refreshing: true })

        render(<GeneralAnalyticsPage />)

        const filters = screen.getByRole('heading', { name: 'Filters' })
            .closest('form') as HTMLFormElement
        const loading = screen.getByRole('status', { name: 'Loading general analytics…' })
        const siblings = Array.from(filters.parentElement?.children ?? [])

        expect(siblings.indexOf(filters))
            .toBeLessThan(siblings.indexOf(loading))
        expect(within(loading)
            .getByTestId('loading-spinner'))
            .toHaveAttribute('data-overlay', 'false')
        expect(screen.getByRole('button', { name: 'Apply' }))
            .toBeEnabled()
    })
})
