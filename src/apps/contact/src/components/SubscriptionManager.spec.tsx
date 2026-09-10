/* Tests use the project testing-library dev dependency. */
/* eslint-disable import/no-extraneous-dependencies */
import { act } from 'react'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'

import { MemberIdentity, MemberSubscriptions } from '../contact.models'
import { contactGet, contactLookupMember, contactPost } from '../contact.service'

import { SubscriptionManager } from './SubscriptionManager'

jest.mock('../contact.service', () => ({
    contactError: (error: Error) => error.message,
    contactGet: jest.fn(),
    contactLookupMember: jest.fn(),
    contactPatch: jest.fn(),
    contactPost: jest.fn(),
}))

const ada: MemberIdentity = { email: 'ada@example.test', handle: 'Ada', memberId: 'canonical-17' }
const grace: MemberIdentity = { email: 'grace@example.test', handle: 'Grace', memberId: 'canonical-29' }
const preferences: MemberSubscriptions = { memberId: ada.memberId, subscriptions: [], suppressed: false }

/** Mounts synthetic categories for preference workflow tests; returns void and throws only rendering failures. */
function renderManager(): void {
    render(<SubscriptionManager
        types={[{ active: true, description: '', id: 'newsletter', name: 'Newsletter' }]}
        onRefresh={jest.fn()}
    />)
}

/**
 * Submits a synthetic handle/email lookup and flushes resolved requests.
 * @param query human-facing handle or email entered in the lookup field.
 * @returns completion after the click's resolved React updates.
 * @throws Test rendering failures; unresolved requests remain pending for race assertions.
 */
async function lookup(query: string): Promise<void> {
    fireEvent.change(screen.getByLabelText('Topcoder handle or email'), { target: { value: query } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Look up preferences' })) })
}

/**
 * Fills explicit bulk choices with provenance and checks the effective-now confirmation.
 * @param rows JSON-compatible preference rows, including intentionally invalid regression inputs.
 * @returns void after changing the three controls; no request is performed.
 * @throws Test query failures when expected controls are missing.
 */
function prepareBulk(rows: unknown): void {
    fireEvent.change(screen.getByLabelText('Preference source / consent evidence'), {
        target: { value: 'Member request ticket TEST-1' },
    })
    fireEvent.change(screen.getByLabelText('Current preference updates (JSON)'), {
        target: { value: JSON.stringify(rows) },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: /I confirm these are authorized/ }))
}

describe('Subscription member identity and explicit preferences', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        (contactLookupMember as jest.Mock).mockResolvedValue(ada);
        (contactGet as jest.Mock).mockResolvedValue(preferences);
        (contactPost as jest.Mock).mockResolvedValue({})
    })

    it.each(['Ada', 'ADA@example.test', '12345'])(
        'resolves %s as a handle/email and writes only its canonical member ID',
        async query => {
            renderManager()
            await lookup(query)
            expect(contactLookupMember)
                .toHaveBeenCalledWith(query)
            expect(contactGet)
                .toHaveBeenCalledWith('subscriptions?memberId=canonical-17')
            expect(screen.getByRole('heading', { name: 'Ada' }))
                .toBeInTheDocument()
            expect(screen.getByText('ada@example.test'))
                .toBeInTheDocument()
            expect(screen.queryByText('canonical-17')).not.toBeInTheDocument()
            expect(contactPost).not.toHaveBeenCalled()
            fireEvent.change(screen.getByLabelText('Preference source / consent evidence'), {
                target: { value: '  Explicit member request  ' },
            })
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: 'Record explicit opt-in' }))
            })
            expect(contactPost)
                .toHaveBeenCalledWith('subscriptions', {
                    memberId: ada.memberId,
                    source: 'Explicit member request',
                    subscribed: true,
                    subscriptionTypeId: 'newsletter',
                })
            expect(contactLookupMember)
                .toHaveBeenCalledTimes(1)
            expect(contactGet)
                .toHaveBeenCalledTimes(2)
            expect(contactGet)
                .toHaveBeenLastCalledWith('subscriptions?memberId=canonical-17')
        },
    )

    it.each(['Active member not found.', 'This email matches multiple active members. Use a handle instead.'])(
        'clears the prior member and exposes lookup failure: %s',
        async message => {
            renderManager()
            await lookup('Ada');
            (contactLookupMember as jest.Mock).mockRejectedValueOnce(new Error(message))
            await lookup('missing@example.test')
            expect(screen.getByRole('alert'))
                .toHaveTextContent(message)
            expect(screen.queryByRole('heading', { name: 'Ada' })).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'Record explicit opt-in' })).not.toBeInTheDocument()
            expect(contactGet)
                .toHaveBeenCalledTimes(1)
            expect(contactPost).not.toHaveBeenCalled()
        },
    )

    it('ignores an obsolete identity response after the lookup input changes', async () => {
        let resolveOlder: (member: MemberIdentity) => void = () => undefined
        const older = new Promise<MemberIdentity>(resolve => { resolveOlder = resolve });
        (contactLookupMember as jest.Mock).mockReturnValueOnce(older)
            .mockResolvedValueOnce(grace);
        (contactGet as jest.Mock).mockResolvedValue({ ...preferences, memberId: grace.memberId })
        renderManager()
        await lookup('Ada')
        expect(screen.getByRole('status'))
            .toHaveTextContent('Loading member preferences')
        await lookup('grace@example.test')
        expect(screen.getByRole('heading', { name: 'Grace' }))
            .toBeInTheDocument()
        await act(async () => { resolveOlder(ada) })
        expect(screen.queryByRole('heading', { name: 'Ada' })).not.toBeInTheDocument()
        expect(contactGet)
            .toHaveBeenCalledTimes(1)
        expect(contactGet)
            .toHaveBeenCalledWith('subscriptions?memberId=canonical-29')
    })

    it('ignores obsolete preferences while a different member is selected', async () => {
        let resolveOlder: (member: MemberSubscriptions) => void = () => undefined
        const older = new Promise<MemberSubscriptions>(resolve => { resolveOlder = resolve });
        (contactLookupMember as jest.Mock).mockResolvedValueOnce(ada)
            .mockResolvedValueOnce(grace);
        (contactGet as jest.Mock).mockReturnValueOnce(older)
            .mockResolvedValueOnce({ ...preferences, memberId: grace.memberId })
        renderManager()
        await lookup('Ada')
        await lookup('Grace')
        await act(async () => { resolveOlder(preferences) })
        expect(screen.getByRole('heading', { name: 'Grace' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Ada' })).not.toBeInTheDocument()
    })

    it('shows actionable evidence validation beside the opt-in, then visibly saves an explicit retry', async () => {
        let resolveWrite: (result: unknown) => void = () => undefined
        const pendingWrite = new Promise<unknown>(resolve => { resolveWrite = resolve });
        (contactPost as jest.Mock).mockReturnValueOnce(pendingWrite);
        (contactGet as jest.Mock).mockResolvedValueOnce(preferences)
            .mockResolvedValueOnce({
                ...preferences,
                subscriptions: [{ source: 'Explicit request', subscribed: true, subscriptionTypeId: 'newsletter' }],
            })
        renderManager()
        await lookup('Ada')
        const memberSection = screen.getByRole('group', { name: 'Member preferences' })
        fireEvent.click(screen.getByRole('button', { name: 'Record explicit opt-in' }))
        expect(within(memberSection)
            .getByRole('alert'))
            .toHaveTextContent('Enter the member request or consent evidence')
        const evidence = screen.getByLabelText('Preference source / consent evidence')
        expect(evidence)
            .toHaveFocus()
        expect(evidence)
            .toHaveAttribute('aria-invalid', 'true')
        expect(evidence)
            .toHaveAttribute('maxlength', '500')
        expect(contactPost).not.toHaveBeenCalled()
        fireEvent.change(evidence, { target: { value: 'Explicit request' } })
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Record explicit opt-in' }))
        })
        expect(within(memberSection)
            .getByRole('status'))
            .toHaveTextContent('Saving member preference')
        expect(screen.getByRole('button', { name: 'Saving preference…' }))
            .toBeDisabled()
        await act(async () => { resolveWrite({}) })
        expect(within(memberSection)
            .getByRole('status'))
            .toHaveTextContent('Preference saved for Ada.')
        expect(screen.getByRole('button', { name: 'Record opt-out' }))
            .toBeEnabled()
        expect(contactPost)
            .toHaveBeenCalledTimes(1)
    })

    it('clears actions after a saved preference cannot be refreshed and does not repeat the write', async () => {
        (contactGet as jest.Mock).mockResolvedValueOnce(preferences)
            .mockRejectedValueOnce(new Error('Preferences unavailable.'))
        renderManager()
        await lookup('Ada')
        fireEvent.change(screen.getByLabelText('Preference source / consent evidence'), {
            target: { value: 'Explicit member request' },
        })
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Record explicit opt-in' }))
        })
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Preference saved for Ada, but refresh failed.')
        expect(screen.queryByRole('button', { name: 'Record explicit opt-in' })).not.toBeInTheDocument()
        expect(contactPost)
            .toHaveBeenCalledTimes(1)
        expect(contactLookupMember)
            .toHaveBeenCalledTimes(1)
    })

    it('resolves every bulk row before writing explicit opt-outs and opt-ins', async () => {
        let resolveLast: (member: MemberIdentity) => void = () => undefined
        const last = new Promise<MemberIdentity>(resolve => { resolveLast = resolve });
        (contactLookupMember as jest.Mock).mockResolvedValueOnce(ada)
            .mockReturnValueOnce(last)
        renderManager()
        prepareBulk([
            { member: 'Ada', subscribed: false, subscriptionTypeId: 'newsletter' },
            { member: 'grace@example.test', subscribed: true, subscriptionTypeId: 'newsletter' },
        ])
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Apply current preferences now' }))
        })
        await waitFor(() => expect(contactLookupMember)
            .toHaveBeenCalledTimes(2))
        expect(contactPost).not.toHaveBeenCalled()
        await act(async () => { resolveLast(grace) })
        expect(contactPost)
            .toHaveBeenNthCalledWith(1, 'subscriptions', {
                memberId: ada.memberId,
                source: 'Member request ticket TEST-1',
                subscribed: false,
                subscriptionTypeId: 'newsletter',
            })
        expect(contactPost)
            .toHaveBeenNthCalledWith(2, 'subscriptions', {
                memberId: grace.memberId,
                source: 'Member request ticket TEST-1',
                subscribed: true,
                subscriptionTypeId: 'newsletter',
            })
        expect(screen.getByLabelText('Current preference updates (JSON)'))
            .toHaveValue('')
        expect(screen.getByRole('button', { name: 'Apply current preferences now' }))
            .toBeDisabled()
    })

    it('makes no bulk writes when a later member is unknown or ambiguous', async () => {
        (contactLookupMember as jest.Mock).mockResolvedValueOnce(ada)
            .mockRejectedValueOnce(new Error('Use a handle instead.'))
        renderManager()
        prepareBulk([
            { member: 'Ada', subscribed: false, subscriptionTypeId: 'newsletter' },
            { member: 'shared@example.test', subscribed: true, subscriptionTypeId: 'newsletter' },
        ])
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Apply current preferences now' }))
        })
        expect(screen.getByRole('alert'))
            .toHaveTextContent('No preferences were updated. Row 2: Use a handle instead.')
        expect(contactPost).not.toHaveBeenCalled()
    })

    it('rejects duplicate canonical member/category choices even when handle and email differ', async () => {
        renderManager()
        prepareBulk([
            { member: 'Ada', subscribed: false, subscriptionTypeId: 'newsletter' },
            { member: 'ada@example.test', subscribed: true, subscriptionTypeId: 'newsletter' },
        ])
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Apply current preferences now' }))
        })
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Duplicate preference for Ada')
        expect(contactPost).not.toHaveBeenCalled()
    })

    it('requires explicit confirmation and evidence before resolving a bulk preference update', async () => {
        renderManager()
        fireEvent.change(screen.getByLabelText('Current preference updates (JSON)'), {
            target: {
                value: JSON.stringify([{ member: 'Ada', subscribed: true, subscriptionTypeId: 'newsletter' }]),
            },
        })
        expect(screen.getByRole('button', { name: 'Apply current preferences now' }))
            .toBeDisabled()
        fireEvent.click(screen.getByRole('checkbox', { name: /I confirm these are authorized/ }))
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Apply current preferences now' }))
        })
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Provide a source and confirm')
        expect(contactLookupMember).not.toHaveBeenCalled()
        expect(contactPost).not.toHaveBeenCalled()
    })

    it.each([
        { rows: [{ memberId: 'canonical-17', subscribed: true, subscriptionTypeId: 'newsletter' }] },
        { rows: [{ member: 'Ada', subscriptionTypeId: 'newsletter' }] },
        { rows: Array.from({ length: 501 }, () => (
            { member: 'Ada', subscribed: false, subscriptionTypeId: 'newsletter' }
        )) },
    ])('validates rows and the 500-row cap before lookup or write', async ({ rows }: { rows: unknown }) => {
        renderManager()
        prepareBulk(rows)
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Apply current preferences now' }))
        })
        expect(screen.getByRole('alert'))
            .toBeInTheDocument()
        expect(contactLookupMember).not.toHaveBeenCalled()
        expect(contactPost).not.toHaveBeenCalled()
    })
})
