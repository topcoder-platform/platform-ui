/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { SpaceTechAnalyticsPage } from './SpaceTechAnalyticsPage'
import { getSpaceTechReport } from '../lib/services'

jest.mock('~/libs/ui', () => ({ PageTitle: () => null }), { virtual: true })
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
const report = { campaigns: [], countries: [], ctas: [], devices: [], faqs: [], series: [], totals }

describe('SpaceTech Analytics', () => {
    beforeEach(() => { jest.clearAllMocks(); (getSpaceTechReport as jest.Mock).mockResolvedValue(report) })

    it('loads ninety days and applies every UTM filter together', async () => {
        render(<SpaceTechAnalyticsPage />)
        await screen.findByText('Submissions: 2')
        const initial = (getSpaceTechReport as jest.Mock).mock.calls[0][0]
        expect((Date.parse(initial.to) - Date.parse(initial.from)) / 86400000)
            .toBe(89)
        fireEvent.change(screen.getByLabelText('utm_source'), { target: { value: 'linkedin' } })
        fireEvent.change(screen.getByLabelText('utm_medium'), { target: { value: 'social' } })
        fireEvent.change(screen.getByLabelText('utm_campaign'), { target: { value: 'george' } })
        fireEvent.change(screen.getByLabelText('utm_content'), { target: { value: 'post_1' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        await waitFor(() => expect(getSpaceTechReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                campaign: 'george', content: 'post_1', medium: 'social', source: 'linkedin',
            })))
        expect(await screen.findByText('Daily SpaceTech visitors and submissions'))
            .toBeInTheDocument()
        expect(screen.getByText('Submission rate (%): 20'))
            .toBeInTheDocument()
    })

    it('does not submit reversed dates and renders retryable API failures', async () => {
        (getSpaceTechReport as jest.Mock).mockRejectedValueOnce(new Error('offline'))
        render(<SpaceTechAnalyticsPage />)
        const retry = await screen.findByRole('button', { name: 'Analytics data could not be loaded. Try again.' })
        fireEvent.click(retry)
        await screen.findByText('Submissions: 2')
        fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-10' } })
        fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-01' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        expect(screen.getByRole('alert'))
            .toHaveTextContent('The start date must not be after the end date.')
        expect(getSpaceTechReport)
            .toHaveBeenCalledTimes(2)
    })
})
