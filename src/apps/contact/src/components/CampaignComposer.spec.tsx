/* Tests use the project testing-library dev dependency. */
/* eslint-disable import/no-extraneous-dependencies */
import { act } from 'react'
import { TextEncoder } from 'util'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import { Campaign, ContactConfig } from '../contact.models'
import { contactGet, contactLookupMember, contactPatch, contactPost } from '../contact.service'

import { CampaignComposer } from './CampaignComposer'

jest.mock('~/apps/analytics/src/lib/services/analytics.service', () => ({
    getAnalyticsFilters: () => Promise.resolve({ campaigns: ['community'] }),
}), { virtual: true })
jest.mock('../contact.service', () => ({
    contactError: (error: Error) => error.message,
    contactGet: jest.fn(),
    contactLookupMember: jest.fn(),
    contactPatch: jest.fn(),
    contactPost: jest.fn(),
}))
jest.mock('./MemberFilterLookup', () => ({ MemberFilterLookup: () => <div>Member lookup</div> }))
jest.mock('./EmailEditor', () => ({
    EmailEditor: () => <div>Email editor</div>,
    STARTER_EMAIL: '<p>Hello</p>',
}))

Object.defineProperty(window, 'TextEncoder', { value: TextEncoder })

const config: ContactConfig = {
    clippingLimitBytes: 102 * 1024,
    mergeFields: ['handle', 'firstName'],
    pricing: {
        currency: 'USD',
        perGbData: 0.12,
        perThousandEmails: 0.16,
        sourceUrl: 'https://aws.amazon.com/ses/pricing/',
    },
    sender: 'Topcoder <community@topcoder.com>',
    sendingEnabled: true,
    subscriptionTypes: [{ active: true, description: '', id: 'newsletter', name: 'Newsletter' }],
    testEmail: 'admin@topcoder.com',
}
const campaign: Campaign = {
    createdAt: '2026-09-09T00:00:00Z',
    html: '<p>Hello {{firstName|there}}</p>',
    id: 'campaign-1',
    name: 'September newsletter',
    revision: 1,
    segment: {},
    status: 'draft',
    subject: 'News for you',
    subscriptionTypeId: 'newsletter',
    trackingEnabled: true,
    updatedAt: '2026-09-09T00:00:00Z',
}
const audience = {
    audienceToken: 'snapshot-1',
    clippingLimitBytes: 102 * 1024,
    emailBytes: 2000,
    estimatedCostUsd: 3.2,
    excludedCount: 50,
    expiresAt: '2099-01-01T00:00:00Z',
    maxEmailBytes: 2500,
    recipientCount: 20000,
    sample: [],
    status: 'ready',
    warnings: [],
}

/**
 * Renders a saved campaign with action callbacks for send-workflow tests.
 * @returns void after mounting the test composer.
 * @throws React test rendering failures.
 */
function renderComposer(): void {
    render(
        <CampaignComposer
            campaign={campaign}
            config={config}
            segments={[]}
            templates={[]}
            onTemplateSaved={jest.fn()}
            onSaved={jest.fn()}
            onClose={jest.fn()}
        />,
    )
}

describe('Contact audience and send approval', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (contactPost as jest.Mock).mockResolvedValue(audience)
    })

    it('requires a ready snapshot and explicit second confirmation before dispatching the exact count', async () => {
        renderComposer()
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeDisabled()
        fireEvent.click(screen.getByRole('button', { name: 'Save and calculate exact audience' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeEnabled())
        expect(contactPost)
            .toHaveBeenCalledWith('audience/preview', { campaignId: campaign.id })
        fireEvent.click(screen.getByRole('button', { name: 'Review send' }))
        expect(screen.getByRole('button', { name: 'Confirm and send' }))
            .toBeDisabled()
        fireEvent.click(screen.getByRole('checkbox', { name: /I reviewed the audience/ }))
        fireEvent.click(screen.getByRole('button', { name: 'Confirm and send' }))
        await waitFor(() => expect(contactPost)
            .toHaveBeenCalledWith('campaigns/campaign-1/send', {
                audienceToken: 'snapshot-1',
                confirmedRecipientCount: 20000,
                scheduledAt: undefined,
            }))
    })

    it('invalidates the audience approval when subject or member criteria change', async () => {
        renderComposer()
        fireEvent.click(screen.getByRole('button', { name: 'Save and calculate exact audience' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeEnabled())
        fireEvent.change(screen.getByLabelText('Email subject'), { target: { value: 'Changed subject' } })
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeDisabled()
        expect(screen.queryByText('20,000 emails in this audience')).not.toBeInTheDocument()
    })

    it('explains an empty audience for either send timing without requesting an expiry refresh', async () => {
        (contactPost as jest.Mock).mockResolvedValue({ ...audience, excludedCount: 785, recipientCount: 0 })
        renderComposer()
        const schedule = screen.getByLabelText('Schedule (your local time; leave empty to send now)')
        fireEvent.change(schedule, { target: { value: '2098-10-10T10:30' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save and calculate exact audience' }))
        await screen.findByText('0 emails in this audience')
        expect(screen.getByRole('button', { name: 'Review scheduled send' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Review scheduled send' }))
            .toHaveAccessibleDescription(/There are no eligible recipients/)
        expect(screen.getByText(/The exclusion total does not identify which check failed/))
            .toBeInTheDocument()
        expect(screen.queryByText(/Refresh the snapshot before approval/)).not.toBeInTheDocument()
        fireEvent.change(schedule, { target: { value: '' } })
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeDisabled()
        expect(contactPost)
            .toHaveBeenCalledTimes(1)
    })

    it('offers audience calculation beside review and requires a positive count for either send timing', async () => {
        renderComposer()
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toHaveAccessibleDescription('Calculate the exact audience before reviewing this send.')
        fireEvent.click(screen.getByRole('button', { name: 'Calculate audience to continue' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeEnabled())
        const schedule = screen.getByLabelText('Schedule (your local time; leave empty to send now)')
        fireEvent.change(schedule, { target: { value: '2098-10-10T10:30' } })
        expect(screen.getByRole('button', { name: 'Review scheduled send' }))
            .toBeEnabled()
        fireEvent.change(schedule, { target: { value: '' } })
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeEnabled()
        expect(contactPost)
            .toHaveBeenCalledTimes(1)
        expect(contactPost)
            .toHaveBeenCalledWith('audience/preview', { campaignId: campaign.id })
    })

    it('identifies an expired positive audience as requiring a refresh', async () => {
        (contactPost as jest.Mock).mockResolvedValue({ ...audience, expiresAt: '2000-01-01T00:00:00Z' })
        renderComposer()
        fireEvent.click(screen.getByRole('button', { name: 'Save and calculate exact audience' }))
        await screen.findByText('20,000 emails in this audience')
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toHaveAccessibleDescription('The audience calculation has expired. Recalculate it in Select recipients.')
        expect(screen.getByText(/Refresh the snapshot before approval/))
            .toBeInTheDocument()
    })

    it('preserves comma separators while administrators enter multiple country criteria', async () => {
        (contactPatch as jest.Mock).mockResolvedValue({ ...campaign, revision: 2 })
        renderComposer()
        const countries = screen.getByLabelText('Countries (ISO codes)')
        fireEvent.change(countries, { target: { value: 'US' } })
        fireEvent.change(countries, { target: { value: 'US,' } })
        expect(countries)
            .toHaveValue('US,')
        fireEvent.change(countries, { target: { value: 'US, IN' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save and calculate exact audience' }))
        await waitFor(() => expect(contactPatch)
            .toHaveBeenCalledWith(
                'campaigns/campaign-1',
                expect.objectContaining({ segment: { countries: ['US', 'IN'] } }),
            ))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeEnabled())
    })

    it('retries the same durable audience token after a temporary observation failure', async () => {
        jest.useFakeTimers();
        (contactPost as jest.Mock).mockResolvedValue({ ...audience, status: 'pending' });
        (contactGet as jest.Mock).mockRejectedValueOnce(new Error('Temporary timeout'))
            .mockResolvedValue(audience)
        renderComposer()
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Save and calculate exact audience' }))
        })
        await act(async () => { jest.advanceTimersByTime(2000) })
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeDisabled()
        await act(async () => { jest.advanceTimersByTime(2000) })
        expect(contactGet)
            .toHaveBeenNthCalledWith(1, 'audience/snapshot-1')
        expect(contactGet)
            .toHaveBeenNthCalledWith(2, 'audience/snapshot-1')
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeEnabled()
        jest.useRealTimers()
    })

    it('isolates personalized HTML inside a sandboxed preview iframe', async () => {
        (contactPost as jest.Mock).mockResolvedValue({
            clippingLimitBytes: 102 * 1024,
            emailBytes: 100,
            html: '<p>Personalized preview</p>',
            subject: 'Preview subject',
            text: 'Personalized preview',
        })
        renderComposer()
        fireEvent.click(screen.getByRole('button', { name: 'Preview personalized email' }))
        const frame = await screen.findByTitle('Personalized email preview')
        expect(frame)
            .toHaveAttribute('sandbox', '')
        expect(frame)
            .toHaveAttribute('srcdoc', '<p>Personalized preview</p>')
        expect(contactLookupMember).not.toHaveBeenCalled()
        expect(contactPost)
            .toHaveBeenCalledWith('campaigns/campaign-1/preview', { memberId: undefined })
    })

    it.each([' ExampleHandle ', ' Person@Example.test '])(
        'resolves %s to a canonical member before previewing without changing the test destination',
        async query => {
            (contactLookupMember as jest.Mock).mockResolvedValue({
                email: 'person@example.test', handle: 'ExampleHandle', memberId: '9007199254740993',
            });
            (contactPost as jest.Mock).mockResolvedValue({
                clippingLimitBytes: 102 * 1024,
                emailBytes: 100,
                html: '<p>Hello member</p>',
                subject: 'Member preview',
                text: 'Hello member',
            })
            renderComposer()
            fireEvent.change(screen.getByLabelText('Preview member handle or email (optional)'), {
                target: { value: query },
            })
            fireEvent.click(screen.getByRole('button', { name: 'Preview personalized email' }))
            await screen.findByTitle('Personalized email preview')
            expect(contactLookupMember)
                .toHaveBeenCalledWith(query.trim())
            expect(contactPost)
                .toHaveBeenCalledWith('campaigns/campaign-1/preview', { memberId: '9007199254740993' })
            expect(screen.getByText('Preview for ExampleHandle · person@example.test'))
                .toBeInTheDocument()
            expect(screen.getByRole('button', { name: `Send test to ${config.testEmail}` }))
                .toBeInTheDocument()
            expect(contactPost)
                .toHaveBeenCalledTimes(1)
            fireEvent.change(screen.getByLabelText('Preview member handle or email (optional)'), {
                target: { value: 'AnotherHandle' },
            })
            expect(screen.queryByTitle('Personalized email preview')).not.toBeInTheDocument()
        },
    )

    it.each(['Member not found.', 'Multiple members use this email. Use a handle.'])(
        'stops previewing when the member lookup fails with %s',
        async message => {
            (contactLookupMember as jest.Mock).mockRejectedValue(new Error(message))
            renderComposer()
            fireEvent.change(screen.getByLabelText('Preview member handle or email (optional)'), {
                target: { value: 'shared@example.test' },
            })
            fireEvent.click(screen.getByRole('button', { name: 'Preview personalized email' }))
            await screen.findByRole('alert')
            expect(screen.getByRole('alert'))
                .toHaveTextContent(message)
            expect(contactPost).not.toHaveBeenCalled()
            expect(contactPatch).not.toHaveBeenCalled()
        },
    )

    it('discards a member lookup superseded by a changed preview target', async () => {
        let resolveLookup: (value: unknown) => void = () => undefined;
        (contactLookupMember as jest.Mock).mockReturnValue(new Promise(resolve => { resolveLookup = resolve }))
        renderComposer()
        fireEvent.change(screen.getByLabelText('Preview member handle or email (optional)'), {
            target: { value: 'FirstHandle' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Preview personalized email' }))
        fireEvent.change(screen.getByLabelText('Preview member handle or email (optional)'), {
            target: { value: 'SecondHandle' },
        })
        await act(async () => {
            resolveLookup({ email: 'first@example.test', handle: 'FirstHandle', memberId: '123' })
        })
        expect(contactPost).not.toHaveBeenCalled()
        expect(screen.queryByTitle('Personalized email preview')).not.toBeInTheDocument()
    })

    it('never approves a pending audience count', async () => {
        (contactPost as jest.Mock).mockResolvedValue({ ...audience, status: 'pending' })
        renderComposer()
        fireEvent.click(screen.getByRole('button', { name: 'Save and calculate exact audience' }))
        await screen.findByText('Preparing recipient snapshot…')
        expect(screen.getByRole('button', { name: 'Review send' }))
            .toBeDisabled()
    })

    it('saves the changed revision before sending a test with no user-supplied recipient', async () => {
        (contactPatch as jest.Mock).mockResolvedValue({
            ...campaign,
            revision: 2,
            subject: 'Changed subject',
        });
        (contactPost as jest.Mock).mockResolvedValue({ email: config.testEmail })
        renderComposer()
        fireEvent.change(screen.getByLabelText('Email subject'), { target: { value: 'Changed subject' } })
        fireEvent.click(screen.getByRole('button', { name: `Send test to ${config.testEmail}` }))
        await screen.findByText(`Test email sent to ${config.testEmail}.`)
        expect(contactPatch)
            .toHaveBeenCalledWith(
                'campaigns/campaign-1',
                expect.objectContaining({
                    revision: 1,
                    subject: 'Changed subject',
                }),
            )
        expect(contactPost)
            .toHaveBeenCalledWith('campaigns/campaign-1/test', {})
        const input = (contactPatch as jest.Mock).mock.calls[0][1]
        expect(input).not.toHaveProperty('id')
        expect(input).not.toHaveProperty('status')
        expect(input).not.toHaveProperty('createdAt')
        expect(input).not.toHaveProperty('updatedAt')
    })
})
