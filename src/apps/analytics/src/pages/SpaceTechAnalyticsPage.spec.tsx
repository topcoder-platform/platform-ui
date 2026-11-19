/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { SpaceTechAnalyticsPage } from './SpaceTechAnalyticsPage'
import { getSpaceTechReport } from '../lib/services'

jest.mock('~/libs/ui', () => ({
    Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        // eslint-disable-next-line react/button-has-type
        <button type={props.type} onClick={props.onClick}>{props.children}</button>
    ),
    PageTitle: () => null,
}), { virtual: true })
jest.mock('./SpaceTechLeads', () => function MockLeads() {
    return <div>Lead attribution</div>
})
jest.mock('../lib/services', () => ({ getSpaceTechReport: jest.fn() }))
jest.mock('../lib/components', () => ({
    MetricCard: (props: { label: string; value: number }) => <p>{`${props.label}: ${props.value}`}</p>,
    ReportError: (props: { error: { message: string }; onRetry: () => void }) => (
        <button onClick={props.onRetry} type='button'>{props.error.message}</button>
    ),
    TimeSeriesChart: (props: { ariaLabel: string }) => <div>{props.ariaLabel}</div>,
}))

const totals = {
    averageEngagementSeconds: 5, pageViews: 20, reached: 8, starts: 4, submissionRate: 20, submissions: 2, visitors: 10,
}
const report = {
    campaigns: [],
    countries: [],
    ctas: [],
    dataThrough: '2026-11-11 13:46:40.771',
    devices: [],
    faqs: [],
    filterOptions: { campaign: ['george'], medium: ['social'], source: ['linkedin', 'email'] },
    series: [],
    totals,
}

describe('SpaceTech Analytics', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-11-19T12:00:00Z'))
        jest.clearAllMocks();
        (getSpaceTechReport as jest.Mock).mockResolvedValue(report)
    })
    afterEach(() => { jest.useRealTimers() })

    it('loads the campaign from launch and applies every UTM filter together', async () => {
        render(<SpaceTechAnalyticsPage />)
        fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
        await screen.findByText('Submissions: 2')
        const initial = (getSpaceTechReport as jest.Mock).mock.calls[0][0]
        expect(initial)
            .toEqual({ from: '2026-11-05', to: '2026-11-19' })
        fireEvent.change(screen.getByLabelText('utm_source'), { target: { value: 'linkedin' } })
        fireEvent.change(screen.getByLabelText('utm_medium'), { target: { value: 'social' } })
        fireEvent.change(screen.getByLabelText('utm_campaign'), { target: { value: 'george' } })
        expect(screen.queryByLabelText('utm_content')).not.toBeInTheDocument()
        expect(screen.getByRole('combobox', { name: 'utm_source' }))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        await waitFor(() => expect(getSpaceTechReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                campaign: 'george', medium: 'social', source: 'linkedin',
            })))
        expect(await screen.findByText('Daily SpaceTech visitors and submissions'))
            .toBeInTheDocument()
        expect(screen.getByText('Submission rate (%): 20'))
            .toBeInTheDocument()
    })

    it('retains the rolling 90-day default once the campaign is older', async () => {
        jest.setSystemTime(new Date('2027-03-01T00:00:00Z'))
        render(<SpaceTechAnalyticsPage />)
        await screen.findByText(/Latest processed event/)
        expect(getSpaceTechReport)
            .toHaveBeenCalledWith({ from: '2026-12-02', to: '2027-03-01' })
    })

    it('prevents requests for pre-launch dates', async () => {
        render(<SpaceTechAnalyticsPage />)
        await screen.findByText(/Latest processed event/)
        const start = screen.getByLabelText('Start date')
        expect(start)
            .toHaveAttribute('min', '2026-11-05')
        expect(screen.getByLabelText('End date'))
            .toHaveAttribute('min', '2026-11-05')
        fireEvent.change(start, { target: { value: '2026-11-04' } })
        expect(start)
            .toBeInvalid()
        fireEvent.submit(start.closest('form') as HTMLFormElement)
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Choose a start date on or after November 5, 2026.')
        expect(getSpaceTechReport)
            .toHaveBeenCalledTimes(1)
    })

    it('clears applied filters and invalid draft dates and reloads the default report', async () => {
        render(<SpaceTechAnalyticsPage />)
        expect(await screen.findByText(/Latest processed event/))
            .toHaveTextContent('11 Nov 2026, 13:46. Aggregate data refreshes hourly.')
        const initial = (getSpaceTechReport as jest.Mock).mock.calls[0][0]
        fireEvent.change(screen.getByLabelText('Start date'), { target: { value: initial.to } })
        fireEvent.change(screen.getByLabelText('utm_campaign'), { target: { value: 'george' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        await screen.findByText(/Latest processed event/)
        fireEvent.change(screen.getByLabelText('End date'), { target: { value: initial.from } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        expect(screen.getByRole('alert'))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
        await waitFor(() => expect(getSpaceTechReport)
            .toHaveBeenLastCalledWith(initial))
        expect(screen.getByLabelText('Start date'))
            .toHaveValue(initial.from)
        expect(screen.getByLabelText('End date'))
            .toHaveValue(initial.to)
        expect(screen.getByLabelText('utm_campaign'))
            .toHaveValue('')
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('refreshes unchanged filters so new activity can be requested without reloading', async () => {
        render(<SpaceTechAnalyticsPage />)
        fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
        await screen.findByText('Submissions: 2')
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        await waitFor(() => expect(getSpaceTechReport)
            .toHaveBeenCalledTimes(2))
    })

    it('does not submit reversed dates and renders retryable API failures', async () => {
        (getSpaceTechReport as jest.Mock).mockRejectedValueOnce(new Error('offline'))
        render(<SpaceTechAnalyticsPage />)
        fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
        const retry = await screen.findByRole('button', { name: 'Analytics data could not be loaded. Try again.' })
        fireEvent.click(retry)
        await screen.findByText('Submissions: 2')
        fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-11-10' } })
        fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-11-09' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        expect(screen.getByRole('alert'))
            .toHaveTextContent('The start date must not be after the end date.')
        expect(getSpaceTechReport)
            .toHaveBeenCalledTimes(2)
    })
})
