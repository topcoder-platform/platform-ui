/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import FormsPage from './FormsPage'
import { fetchReportForms, fetchFormSubmissions, downloadFormSubmissions } from '../../lib/services/forms.service'
import { downloadBlobFile } from '../../lib/services/reports.service'

jest.mock('~/libs/ui', () => ({ PageTitle: () => null }), { virtual: true })
jest.mock('../../lib/services/forms.service', () => ({
    downloadFormSubmissions: jest.fn(),
    fetchFormSubmissions: jest.fn(),
    fetchReportForms: jest.fn(),
    formatFormValue: (value: unknown) => String(value),
}))
jest.mock('../../lib/services/reports.service', () => ({ downloadBlobFile: jest.fn() }))

const report = {
    columns: ['email', 'updates'],
    data: [{ email: 'first@example.com', submission_id: 'one', updates: false }],
    form: 'lets_talk',
    labels: { email: 'Work Email', updates: 'Updates' },
    nextCursor: 'one',
    total: 26,
}

/**
 * Loads the form selector and chooses the contact form in page interaction tests.
 * @returns Completion once the first submission is displayed. @throws Testing Library errors on missing UI.
 */
async function selectForm(): Promise<void> {
    await screen.findByRole('option', { name: 'Let’s talk (/lets-talk) (lets_talk)' })
    fireEvent.change(screen.getByLabelText('Form'), { target: { value: 'lets_talk' } })
    await screen.findByText('first@example.com')
}

describe('Forms reporting page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetchReportForms as jest.Mock).mockResolvedValue([{ key: 'lets_talk', title: 'Let’s talk (/lets-talk)' }]);
        (fetchFormSubmissions as jest.Mock).mockResolvedValue(report);
        (downloadFormSubmissions as jest.Mock).mockResolvedValue(new Blob(['csv']))
    })

    it('paginates and resets the cursor when dates change', async () => {
        render(<FormsPage />)
        await selectForm()
        expect(screen.getByText('false'))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        await waitFor(() => expect(fetchFormSubmissions)
            .toHaveBeenLastCalledWith('lets_talk', expect.anything(), 'one'))
        fireEvent.change(screen.getByLabelText('Start date (UTC)'), { target: { value: '2026-09-01' } })
        await waitFor(() => expect(fetchFormSubmissions)
            .toHaveBeenLastCalledWith('lets_talk', expect.objectContaining({ startDate: '2026-09-01' }), undefined))
        await screen.findByText('26 submissions · Page 1')
        expect(screen.getByRole('button', { name: 'Previous' }))
            .toBeDisabled()
    })

    it('exports all or filtered data independently of the current page and rejects reversed dates', async () => {
        render(<FormsPage />)
        await selectForm()
        fireEvent.change(screen.getByLabelText('Start date (UTC)'), { target: { value: '2026-09-01' } })
        fireEvent.change(screen.getByLabelText('End date (UTC)'), { target: { value: '2026-09-30' } })
        fireEvent.click(screen.getByRole('button', { name: 'Export filtered CSV' }))
        await waitFor(() => expect(downloadBlobFile)
            .toHaveBeenCalledWith(expect.any(Blob), 'lets_talk-filtered.csv'))
        expect(downloadFormSubmissions)
            .toHaveBeenCalledWith('lets_talk', expect.objectContaining({
                endDate: '2026-09-30', startDate: '2026-09-01',
            }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Export all CSV' }))
            .toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'Export all CSV' }))
        await waitFor(() => expect(downloadFormSubmissions)
            .toHaveBeenLastCalledWith('lets_talk', {}))
        await waitFor(() => expect(screen.getByLabelText('End date (UTC)'))
            .toBeEnabled())
        fireEvent.change(screen.getByLabelText('End date (UTC)'), { target: { value: '2026-08-31' } })
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Start date must be on or before end date.')
        expect(screen.getByRole('button', { name: 'Export filtered CSV' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Export all CSV' }))
            .toBeEnabled()
    })

    it('ignores an old page response after filters change and displays retryable failures', async () => {
        render(<FormsPage />)
        await selectForm()
        let finishOldPage: (value: typeof report) => void = () => undefined;
        (fetchFormSubmissions as jest.Mock).mockReturnValueOnce(new Promise(resolve => { finishOldPage = resolve }))
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        (fetchFormSubmissions as jest.Mock).mockRejectedValueOnce(new Error('Forbidden'))
        fireEvent.change(screen.getByLabelText('Start date (UTC)'), { target: { value: '2026-09-01' } })
        await screen.findByText('Unable to load submissions. Check your access or retry.')
        finishOldPage(report)
        expect(screen.queryByText('first@example.com')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
        await screen.findByText('first@example.com')
    })
})
