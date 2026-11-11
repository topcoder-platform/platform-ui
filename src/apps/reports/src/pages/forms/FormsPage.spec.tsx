/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import FormsPage from './FormsPage'
import {
    fetchReportForms,
    fetchFormSubmissions,
    fetchSpaceTechSubmissions,
    downloadFormSubmissions,
} from '../../lib/services/forms.service'
import { downloadBlobFile } from '../../lib/services/reports.service'

jest.mock('~/libs/ui', () => ({ PageTitle: () => null }), { virtual: true })
jest.mock('../../lib/services/forms.service', () => ({
    downloadFormSubmissions: jest.fn(),
    fetchFormSubmissions: jest.fn(),
    fetchReportForms: jest.fn(),
    fetchSpaceTechSubmissions: jest.fn(),
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

    it('links each Let’s talk submission to the SendGrid logs of its emails', async () => {
        (fetchFormSubmissions as jest.Mock).mockResolvedValue({
            ...report,
            columns: ['email', 'sendgrid_message_ids'],
            data: [
                { ...report.data[0], sendgrid_message_ids: ['abc123', 'def/456'] },
                { email: 'older@example.com', sendgrid_message_ids: [], submission_id: 'two' },
            ],
            labels: { ...report.labels, sendgrid_message_ids: 'SendGrid logs' },
        })
        render(<FormsPage />)
        await selectForm()
        const cards = screen.getAllByRole('article')
        const links = within(cards[0])
            .getAllByRole('link')
        expect(links.map(link => [link.textContent, link.getAttribute('href')]))
            .toEqual([
                ['View SendGrid logs (1)', 'https://app.sendgrid.com/email_logs/abc123/details'],
                ['View SendGrid logs (2)', 'https://app.sendgrid.com/email_logs/def%2F456/details'],
            ])
        expect(links[0])
            .toHaveAttribute('target', '_blank')
        expect(links[0])
            .toHaveAttribute('rel', 'noopener noreferrer')
        expect(within(cards[1])
            .getByText('No SendGrid emails recorded'))
            .toBeInTheDocument()
        expect(within(cards[0])
            .queryByText('SendGrid logs'))
            .not.toBeInTheDocument()
    })

    it('renders SendGrid log links in the table for other forms', async () => {
        (fetchFormSubmissions as jest.Mock).mockResolvedValue({
            ...report,
            columns: ['email', 'sendgrid_message_ids'],
            data: [{ ...report.data[0], sendgrid_message_ids: ['abc123'] }],
            form: 'other_form',
        })
        render(<FormsPage />)
        await selectForm()
        expect(within(screen.getByRole('table'))
            .getByRole('link', { name: 'View SendGrid logs' }))
            .toHaveAttribute('href', 'https://app.sendgrid.com/email_logs/abc123/details')
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
})

it('uses the complete lead set for SpaceTech instead of the generic page endpoint', async () => {
    (fetchReportForms as jest.Mock).mockResolvedValue([{ key: 'space_tech_challenge', title: 'SpaceTech' }]);
    (fetchSpaceTechSubmissions as jest.Mock).mockResolvedValue({
        ...report, form: 'space_tech_challenge', nextCursor: null,
    })
    render(<FormsPage />)
    await screen.findByRole('option', { name: 'SpaceTech (space_tech_challenge)' })
    fireEvent.change(screen.getByLabelText('Form'), { target: { value: 'space_tech_challenge' } })
    await screen.findByLabelText('Filter utm_campaign')
    expect(fetchSpaceTechSubmissions)
        .toHaveBeenCalledWith(expect.objectContaining({ key: 'space_tech_challenge' }), expect.any(Function))
    expect(screen.queryByRole('navigation', { name: 'Submission pages' })).not.toBeInTheDocument()
})
