/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

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

    it('shows contact details and UTM values above full-width inquiries, hiding repetitive fields', async () => {
        const hidden = ['source_page', 'form_version', 'leadsource', 'source__c',
            'lead_source_for_campaign__c', 'primary_campaign__c', 'insta_page_name__c']
        const inquiry = `A detailed request.\nAnother paragraph with a very long link: ${'x'.repeat(500)}`;
        (fetchFormSubmissions as jest.Mock).mockResolvedValue({
            ...report,
            columns: [
                'submitted_at', 'member_id', 'email', 'briefly_describe_your_inquiry', 'utm_source__c', ...hidden,
            ],
            data: [
                { ...report.data[0],
                    briefly_describe_your_inquiry: inquiry,
                    member_id: '12345',
                    submitted_at: '2026-10-19T12:00:00Z',
                    utm_source__c: 'newsletter' },
                { email: 'older@example.com', submission_id: 'two', submitted_at: '2026-10-18T12:00:00Z' },
            ],
            labels: { ...report.labels, briefly_describe_your_inquiry: 'What can we help you with?' },
        })
        render(<FormsPage />)
        await selectForm()
        const region = screen.getByRole('region', { name: 'Form submissions' })
        const cards = within(region)
            .getAllByRole('article')
        expect(cards)
            .toHaveLength(2)
        expect(cards[0])
            .toHaveTextContent('first@example.com')
        expect(cards[1])
            .toHaveTextContent('older@example.com')
        expect(within(cards[0])
            .getByText('12345'))
            .toBeInTheDocument()
        expect(within(cards[0])
            .getByText('UTM source'))
            .toBeInTheDocument()
        expect(within(cards[0])
            .getByText('newsletter'))
            .toBeInTheDocument()
        const inquiryDetails = cards[0].querySelector('dl > div:last-child')
        expect(inquiryDetails)
            .toHaveClass('inquiry')
        expect(inquiryDetails?.querySelector('dd')?.textContent)
            .toBe(inquiry)
        hidden.forEach(column => expect(within(region)
            .queryByText(column.replace(/_/g, ' '))).not.toBeInTheDocument())
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('retains all table columns for other forms', async () => {
        (fetchFormSubmissions as jest.Mock).mockResolvedValue({
            ...report, columns: ['email', 'source_page'], form: 'other_form',
        })
        render(<FormsPage />)
        await selectForm()
        expect(screen.getByRole('table'))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'source page' }))
            .toBeInTheDocument()
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

    describe('AI classification', () => {
        const runId = '6f1c2a9e-6b7d-4e8f-9a01-2b3c4d5e6f70'
        const classifiedReport = {
            ...report,
            columns: ['email', 'classification', 'classification_status', 'classification_confidence',
                'classification_needs_review', 'classification_run_id'],
            data: [
                { classification: 'SALES_LEAD',
                    classification_confidence: '0.91',
                    classification_needs_review: true,
                    classification_run_id: runId,
                    classification_status: 'CLASSIFIED',
                    email: 'first@example.com',
                    submission_id: 'one' },
                { classification: 'NEW_CLASS',
                    classification_confidence: null,
                    classification_needs_review: null,
                    classification_run_id: null,
                    classification_status: null,
                    email: 'second@example.com',
                    submission_id: 'two' },
            ],
            labels: {
                ...report.labels,
                classification: 'Classification',
                classification_confidence: 'Confidence',
                classification_run_id: 'AI run',
            },
        }

        beforeEach(() => {
            (fetchFormSubmissions as jest.Mock).mockResolvedValue(classifiedReport)
        })

        it('leads each Let’s talk card with a labelled badge, review marker, confidence and run id', async () => {
            const writeText = jest.fn()
                .mockResolvedValue(undefined)
            Object.assign(navigator, { clipboard: { writeText } })
            render(<FormsPage />)
            await selectForm()
            const cards = within(screen.getByRole('region', { name: 'Form submissions' }))
                .getAllByRole('article')
            const first = cards[0].querySelector('dl > div:first-child')
            expect(first?.querySelector('dt')?.textContent)
                .toBe('Classification')
            expect(within(cards[0])
                .getByText('Sales lead'))
                .toHaveAttribute('data-label', 'SALES_LEAD')
            expect(within(cards[0])
                .getByText('Needs review'))
                .toBeInTheDocument()
            expect(within(cards[0])
                .getByText('91%'))
                .toBeInTheDocument()
            // The review flag has no separate field.
            expect(within(cards[0])
                .queryByText('classification needs review')).not.toBeInTheDocument()
            expect(within(cards[0])
                .getByTitle(runId))
                .toHaveTextContent('6f1c2a9e…')
            fireEvent.click(within(cards[0])
                .getByRole('button', { name: `Copy AI run id ${runId}` }))
            await within(cards[0])
                .findByText('Copied')
            expect(writeText)
                .toHaveBeenCalledWith(runId)
            // A label the UI doesn't know is shown as-is, without review marker.
            expect(within(cards[1])
                .getByText('NEW_CLASS'))
                .toHaveAttribute('data-label', 'OTHER')
            expect(within(cards[1])
                .queryByText('Needs review')).not.toBeInTheDocument()
        })

        it('filters the table and the filtered CSV by label, and resets the filter for another form', async () => {
            render(<FormsPage />)
            await selectForm()
            fireEvent.change(screen.getByLabelText('Classification'), { target: { value: 'SALES_LEAD' } })
            await waitFor(() => expect(fetchFormSubmissions)
                .toHaveBeenLastCalledWith(
                    'lets_talk',
                    expect.objectContaining({ classification: 'SALES_LEAD' }),
                    undefined,
                ))
            await screen.findByText('first@example.com')
            fireEvent.click(screen.getByRole('button', { name: 'Export filtered CSV' }))
            await waitFor(() => expect(downloadFormSubmissions)
                .toHaveBeenCalledWith('lets_talk', expect.objectContaining({ classification: 'SALES_LEAD' })))
            await waitFor(() => expect(screen.getByLabelText('Form'))
                .toBeEnabled())
            fireEvent.change(screen.getByLabelText('Form'), { target: { value: '' } })
            await waitFor(() => expect(screen.queryByLabelText('Classification')).not.toBeInTheDocument())
        })

        it('renders the badge in tables for other forms, without a separate review column', async () => {
            (fetchFormSubmissions as jest.Mock).mockResolvedValue({ ...classifiedReport, form: 'other_form' })
            render(<FormsPage />)
            await selectForm()
            expect(within(screen.getByRole('table'))
                .getByText('Sales lead'))
                .toBeInTheDocument()
            expect(screen.queryByRole('columnheader', { name: /needs review/i })).not.toBeInTheDocument()
        })

        it('offers no classification filter for a form without classification', async () => {
            (fetchFormSubmissions as jest.Mock).mockResolvedValue(report)
            render(<FormsPage />)
            await selectForm()
            expect(screen.queryByLabelText('Classification')).not.toBeInTheDocument()
        })
    })
})
