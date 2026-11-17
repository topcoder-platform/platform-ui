/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { SpaceTechDashboard, spaceTechMetrics } from './SpaceTechDashboard'
import { SpaceTechAnalyticsPage } from './SpaceTechAnalyticsPage'
import { getSpaceTechReport } from '../lib/services'
import { SpaceTechReport } from '../lib/models'
import { TimeSeriesChart } from '../lib/components'

jest.mock('~/libs/ui', () => ({
    Button: (props: { children: React.ReactNode }) => <button type='submit'>{props.children}</button>,
    PageTitle: () => null,
}), { virtual: true })
jest.mock('./SpaceTechLeads', () => function MockLeads() { return <div>Private leads</div> })
jest.mock('../lib/services', () => ({ getSpaceTechReport: jest.fn() }))
jest.mock('../lib/components', () => ({
    MetricCard: () => null,
    ReportError: () => null,
    TimeSeriesChart: jest.fn(() => <div>Chart</div>),
}))
const empty = {
    averageEngagementSeconds: 0, pageViews: 0, reached: 0, starts: 0, submissionRate: 0, submissions: 0, visitors: 0,
}
const george = {
    averageEngagementSeconds: 5.75,
    pageViews: 30,
    reached: 4,
    starts: 7,
    submissionRate: 33.33,
    submissions: 2,
    visitors: 6,
}
const report: SpaceTechReport = {
    campaigns: [],
    countries: [],
    ctas: [],
    devices: [],
    faqs: [],
    filterOptions: { campaign: [], medium: [], source: [] },
    filters: { campaign: '', from: '2026-11-01', medium: '', source: '', to: '2026-11-18' },
    generatedAt: '2026-11-18',
    personas: [
        { ...empty, persona: 'topcoder' }, { ...george, persona: 'george' },
        { ...empty, persona: 'anita' }, { ...empty, persona: 'tony' },
    ],
    personaSeries: [{ anita: empty, date: '2026-11-02', george, tony: empty, topcoder: empty }],
    series: [],
    totals: george,
}

describe('SpaceTech source dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getSpaceTechReport as jest.Mock).mockResolvedValue(report)
    })

    it('selects Dashboard by default and keeps existing details and private leads in Details', async () => {
        render(<SpaceTechAnalyticsPage />)
        expect(screen.getByRole('tab', { name: 'Dashboard' }))
            .toHaveAttribute('aria-selected', 'true')
        await screen.findByRole('table', { name: 'SpaceTech source performance' })
        expect(screen.queryByText('Campaign attribution')).not.toBeInTheDocument()
        expect(screen.queryByText('Private leads')).not.toBeInTheDocument()
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Dashboard' }), { key: 'ArrowRight' })
        expect(screen.getByRole('tab', { name: 'Details' }))
            .toHaveFocus()
        expect(screen.getByRole('tabpanel', { name: 'Details' }))
            .toHaveTextContent('Campaign attribution')
        expect(screen.getByText('Private leads'))
            .toBeInTheDocument()
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Details' }), { key: 'Home' })
        expect(screen.getByRole('tab', { name: 'Dashboard' }))
            .toHaveFocus()
        expect(screen.getByRole('table', { name: 'SpaceTech source performance' }))
            .toBeInTheDocument()
        expect(getSpaceTechReport)
            .toHaveBeenCalledTimes(1)
    })

    it('plots all four personas for every metric and preserves fractional rates and engagement', () => {
        render(<SpaceTechDashboard report={report} />)
        expect(screen.getAllByRole('option'))
            .toHaveLength(7)
        spaceTechMetrics.forEach(([key, label]) => {
            fireEvent.change(screen.getByRole('combobox', { name: 'Metric' }), { target: { value: key } })
            const props = (TimeSeriesChart as jest.Mock).mock.calls.slice(-1)[0][0]
            expect(props.points)
                .toEqual([{ anita: 0, date: '2026-11-02', george: george[key], tony: 0, topcoder: 0 }])
            expect(props.series.map((item: { label: string }) => item.label))
                .toEqual(['Topcoder', 'George', 'Anita', 'Tony'])
            expect(props.yAxisTitle)
                .toBe(label)
            expect(props.valueDecimals)
                .toBe(['submissionRate', 'averageEngagementSeconds'].includes(key) ? 2 : 0)
            expect(props.valueSuffix)
                .toBe(key === 'submissionRate' ? '%' : '')
        })
        const table = within(screen.getByRole('table', { name: 'SpaceTech source performance' }))
        expect(table.getAllByRole('row'))
            .toHaveLength(5)
        expect(table.getAllByRole('columnheader'))
            .toHaveLength(8)
        const row = within(table.getByRole('rowheader', { name: 'George' })
            .closest('tr') as HTMLTableRowElement)
        expect(row.getAllByRole('cell')
            .map(cell => cell.textContent))
            .toEqual(['30', '6', '7', '2', '33.33%', '4', '5.75'])
    })

    it('distinguishes an older API from a legitimately empty report', () => {
        const view = render(<SpaceTechDashboard report={{ ...report, personas: undefined }} />)
        expect(screen.getByRole('status'))
            .toHaveTextContent('Source dashboard data is unavailable')
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
        view.rerender(<SpaceTechDashboard report={{
            ...report,
            personas: report.personas?.map(row => ({ ...row, ...empty })),
            personaSeries: [],
        }}
        />)
        expect(screen.getByRole('table'))
            .toBeInTheDocument()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
})
