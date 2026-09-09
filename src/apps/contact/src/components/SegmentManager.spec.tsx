/* Tests use the project testing-library dev dependency. */
/* eslint-disable import/no-extraneous-dependencies */
import { act } from 'react'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'

import { Segment, SegmentMemberPage } from '../contact.models'
import { contactDelete, contactGet, contactPatch, contactPost } from '../contact.service'
import ContactApp from '../ContactApp'

import { SegmentManager } from './SegmentManager'

jest.mock('../contact.service', () => ({
    contactDelete: jest.fn(),
    contactError: (error: Error) => error.message,
    contactGet: jest.fn(),
    contactPatch: jest.fn(),
    contactPost: jest.fn(),
}))
jest.mock('~/libs/core', () => ({ xhrGetAsync: jest.fn() }), { virtual: true })
jest.mock('~/libs/ui/lib/components/button', () => (
    jest.requireActual('../../../../libs/ui/lib/components/button')
), { virtual: true })
jest.mock('~/libs/ui/lib/components/modals/base-modal', () => (
    jest.requireActual('../../../../libs/ui/lib/components/modals/base-modal')
), { virtual: true })
jest.mock('./AutomationManager', () => ({ AutomationManager: () => <div>Automations</div> }))
jest.mock('./CampaignComposer', () => ({ CampaignComposer: () => <div>Composer</div> }))
jest.mock('./CampaignResults', () => ({ CampaignResults: () => <div>Results</div> }))
jest.mock('./SubscriptionManager', () => ({ SubscriptionManager: () => <div>Subscriptions</div> }))
jest.mock('./MemberFilterLookup', () => ({ MemberFilterLookup: () => <div>Member lookup</div> }))

const saved = jest.fn()
const deleted = jest.fn()

const segment: Segment = {
    createdAt: '2026-09-09T00:00:00.000Z',
    createdBy: 'admin-1',
    createdByHandle: 'segmentAdmin',
    filter: { countries: ['US'] },
    id: 'segment-1',
    memberCount: 26,
    name: 'New members',
}

/**
 * Builds a synthetic API page for pagination assertions; no real member data is used.
 * @param offset first synthetic member index and returned API offset.
 * @param total total members matching the synthetic segment.
 * @returns up to 25 matching member records with deterministic handles and emails.
 * @throws Does not throw for the nonnegative test inputs.
 */
function memberPage(offset: number, total: number = 26): SegmentMemberPage {
    return {
        limit: 25,
        members: Array.from({ length: Math.max(0, Math.min(25, total - offset)) }, (_, index) => ({
            email: `member${offset + index + 1}@example.test`,
            handle: `member${offset + index + 1}`,
            memberId: String(offset + index + 1),
        })),
        offset,
        total,
    }
}

describe('Contact saved segment workflows', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        (contactPost as jest.Mock).mockResolvedValue(segment);
        (contactPatch as jest.Mock).mockResolvedValue(segment);
        (contactDelete as jest.Mock).mockResolvedValue(undefined)
    })

    it('shows creator/date/count columns and creates named criteria in a focused dialog', async () => {
        const refresh = jest.fn()
            .mockResolvedValue(undefined)
        render(<SegmentManager
            onSaved={saved}
            onDeleted={deleted}
            segments={[segment]}
            onRefresh={refresh}
        />)
        const table = screen.getByRole('table', { name: 'Saved segments' })
        for (const name of ['Segment name', 'Created date', 'Creator handle', 'Member count', 'Actions']) {
            expect(within(table)
                .getByRole('columnheader', { name }))
                .toBeInTheDocument()
        }

        expect(within(table)
            .getByText('segmentAdmin'))
            .toBeInTheDocument()
        expect(within(table)
            .getByText('26'))
            .toBeInTheDocument()
        const add = screen.getByRole('button', { name: 'Add segment' })
        add.focus()
        fireEvent.click(add)
        const dialog = screen.getByRole('dialog', { name: 'Add segment' })
        await waitFor(() => expect(within(dialog)
            .getByLabelText('Segment name'))
            .toHaveFocus())
        fireEvent.change(within(dialog)
            .getByLabelText('Segment name'), { target: { value: ' Canadian members ' } })
        fireEvent.change(within(dialog)
            .getByLabelText('Countries (ISO codes)'), { target: { value: 'CA' } })
        await act(async () => {
            fireEvent.click(within(dialog)
                .getByRole('button', { name: 'Save segment' }))
        })
        await waitFor(() => expect(contactPost)
            .toHaveBeenCalledWith('segments', {
                filter: { countries: ['CA'] }, name: 'Canadian members',
            }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(refresh)
            .toHaveBeenCalledTimes(1)
        expect(saved)
            .toHaveBeenCalledWith(segment)
        expect(add)
            .toHaveFocus()
    })

    it('discards edited criteria on cancel and PATCHes only name/filter on confirmed save', async () => {
        render(<SegmentManager
            onSaved={saved}
            onDeleted={deleted}
            segments={[segment]}
            onRefresh={jest.fn()
                .mockResolvedValue(undefined)}
        />)
        fireEvent.click(screen.getByRole('button', { name: 'Edit segment New members' }))
        let dialog = screen.getByRole('dialog', { name: 'Edit segment' })
        expect(within(dialog)
            .getByLabelText('Countries (ISO codes)'))
            .toHaveValue('US')
        fireEvent.change(within(dialog)
            .getByLabelText('Countries (ISO codes)'), { target: { value: 'CA' } })
        fireEvent.click(within(dialog)
            .getByRole('button', { name: 'Cancel' }))
        expect(contactPatch).not.toHaveBeenCalled()
        expect(segment.filter)
            .toEqual({ countries: ['US'] })
        fireEvent.click(screen.getByRole('button', { name: 'Edit segment New members' }))
        dialog = screen.getByRole('dialog', { name: 'Edit segment' })
        expect(within(dialog)
            .getByLabelText('Countries (ISO codes)'))
            .toHaveValue('US')
        fireEvent.change(within(dialog)
            .getByLabelText('Segment name'), { target: { value: 'Updated members' } })
        fireEvent.change(within(dialog)
            .getByLabelText('Countries (ISO codes)'), { target: { value: 'CA' } })
        await act(async () => {
            fireEvent.click(within(dialog)
                .getByRole('button', { name: 'Save segment' }))
        })
        await waitFor(() => expect(contactPatch)
            .toHaveBeenCalledWith('segments/segment-1', {
                filter: { countries: ['CA'] }, name: 'Updated members',
            }))
        expect(contactPost).not.toHaveBeenCalled()
        expect(saved)
            .toHaveBeenCalledWith(segment)
    })

    it('keeps failed drafts for retry and closes with Escape without a write', async () => {
        (contactPost as jest.Mock).mockRejectedValue(new Error('The criteria could not be saved.'))
        render(<SegmentManager
            onSaved={saved}
            onDeleted={deleted}
            segments={[]}
            onRefresh={jest.fn()}
        />)
        const add = screen.getByRole('button', { name: 'Add segment' })
        add.focus()
        fireEvent.click(add)
        const dialog = screen.getByRole('dialog', { name: 'Add segment' })
        fireEvent.change(within(dialog)
            .getByLabelText('Segment name'), { target: { value: 'Keep this draft' } })
        await act(async () => {
            fireEvent.click(within(dialog)
                .getByRole('button', { name: 'Save segment' }))
        })
        expect(await within(dialog)
            .findByRole('alert'))
            .toHaveTextContent('The criteria could not be saved.')
        expect(within(dialog)
            .getByLabelText('Segment name'))
            .toHaveValue('Keep this draft')
        fireEvent.keyDown(document, { code: 'Escape', key: 'Escape', keyCode: 27 })
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(contactPost)
            .toHaveBeenCalledTimes(1)
        expect(add)
            .toHaveFocus()
    })

    it('requires delete confirmation, allows cancel and keeps failures in the confirmation for retry', async () => {
        const refresh = jest.fn()
            .mockResolvedValue(undefined);
        (contactDelete as jest.Mock).mockRejectedValueOnce(new Error('Delete failed.'))
            .mockResolvedValue(undefined)
        render(<SegmentManager
            onSaved={saved}
            onDeleted={deleted}
            segments={[segment]}
            onRefresh={refresh}
        />)
        fireEvent.click(screen.getByRole('button', { name: 'Delete segment New members' }))
        let dialog = screen.getByRole('dialog', { name: 'Delete segment' })
        expect(contactDelete).not.toHaveBeenCalled()
        fireEvent.click(within(dialog)
            .getByRole('button', { name: 'Cancel' }))
        expect(contactDelete).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole('button', { name: 'Delete segment New members' }))
        dialog = screen.getByRole('dialog', { name: 'Delete segment' })
        await act(async () => {
            fireEvent.click(within(dialog)
                .getByRole('button', { name: 'Delete segment' }))
        })
        expect(await within(dialog)
            .findByRole('alert'))
            .toHaveTextContent('Delete failed.')
        expect(refresh).not.toHaveBeenCalled()
        await act(async () => {
            fireEvent.click(within(dialog)
                .getByRole('button', { name: 'Delete segment' }))
        })
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(contactDelete)
            .toHaveBeenNthCalledWith(1, 'segments/segment-1')
        expect(contactDelete)
            .toHaveBeenCalledTimes(2)
        expect(refresh)
            .toHaveBeenCalledTimes(1)
    })

    it('loads member handles/emails in 25-member pages and returns to the previous page', async () => {
        (contactGet as jest.Mock).mockResolvedValueOnce(memberPage(0))
            .mockResolvedValueOnce(memberPage(25))
            .mockResolvedValueOnce(memberPage(0))
        render(<SegmentManager
            onSaved={saved}
            onDeleted={deleted}
            segments={[segment]}
            onRefresh={jest.fn()}
        />)
        fireEvent.click(screen.getByRole('button', { name: 'View members in New members' }))
        const dialog = screen.getByRole('dialog', { name: 'Members in New members' })
        expect(await within(dialog)
            .findByText('member1@example.test'))
            .toBeInTheDocument()
        expect(within(dialog)
            .getByText('1–25 of 26 members'))
            .toBeInTheDocument()
        expect(within(dialog)
            .getByRole('button', { name: 'Previous' }))
            .toBeDisabled()
        fireEvent.click(within(dialog)
            .getByRole('button', { name: 'Next' }))
        expect(await within(dialog)
            .findByText('member26@example.test'))
            .toBeInTheDocument()
        expect(within(dialog)
            .queryByText('member1@example.test')).not.toBeInTheDocument()
        expect(contactGet)
            .toHaveBeenNthCalledWith(2, 'segments/segment-1/members?limit=25&offset=25')
        expect(within(dialog)
            .getByRole('button', { name: 'Next' }))
            .toBeDisabled()
        fireEvent.click(within(dialog)
            .getByRole('button', { name: 'Previous' }))
        expect(await within(dialog)
            .findByText('member1@example.test'))
            .toBeInTheDocument()
        expect(contactGet)
            .toHaveBeenNthCalledWith(3, 'segments/segment-1/members?limit=25&offset=0')
    })

    it('retries failed member pages and ignores a late response after the modal closes', async () => {
        let resolveFirst: (value: SegmentMemberPage) => void = () => undefined
        const first = new Promise<SegmentMemberPage>(resolve => { resolveFirst = resolve });
        (contactGet as jest.Mock).mockReturnValueOnce(first)
            .mockRejectedValueOnce(new Error('Member lookup failed.'))
            .mockResolvedValueOnce(memberPage(0, 0))
        render(<SegmentManager
            onSaved={saved}
            onDeleted={deleted}
            segments={[segment]}
            onRefresh={jest.fn()}
        />)
        fireEvent.click(screen.getByRole('button', { name: 'View members in New members' }))
        fireEvent.click(within(screen.getByRole('dialog'))
            .getByRole('button', { name: 'Close' }))
        fireEvent.click(screen.getByRole('button', { name: 'View members in New members' }))
        const dialog = screen.getByRole('dialog')
        expect(await within(dialog)
            .findByRole('alert'))
            .toHaveTextContent('Member lookup failed.')
        await act(async () => {
            fireEvent.click(within(dialog)
                .getByRole('button', { name: 'Retry loading members' }))
        })
        expect(await within(dialog)
            .findByText('No matching members.'))
            .toBeInTheDocument()
        await act(async () => { resolveFirst(memberPage(0)) })
        expect(within(dialog)
            .queryByText('member1@example.test')).not.toBeInTheDocument()
        expect(within(dialog)
            .getByText('0 of 0 members'))
            .toBeInTheDocument()
    })

    it('preserves saved criteria across tab switches, refresh failure and an older list response', async () => {
        let resolveOlder: (segments: Segment[]) => void = () => undefined
        const olderList = new Promise<Segment[]>(resolve => { resolveOlder = resolve })
        const lists = jest.fn()
            .mockResolvedValueOnce([segment])
            .mockReturnValueOnce(olderList)
            .mockRejectedValue(new Error('Latest list unavailable.'));
        (contactGet as jest.Mock).mockImplementation((path: string) => {
            if (path === 'segments') return lists()
            return Promise.resolve(path === 'config'
                ? { sendingEnabled: false, subscriptionTypes: [], warnings: [] }
                : [])
        });
        (contactPatch as jest.Mock).mockResolvedValue({ ...segment, filter: { countries: ['CA'] } })
        render(<ContactApp />)
        await screen.findByRole('heading', { name: 'Email campaigns' })
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        fireEvent.click(screen.getByRole('tab', { name: 'Segments' }))
        fireEvent.click(screen.getByRole('button', { name: 'Edit segment New members' }))
        fireEvent.change(screen.getByLabelText('Countries (ISO codes)'), { target: { value: 'CA' } })
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save segment' })) })
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Latest list unavailable.')
        expect(screen.getByRole('button', { name: 'Edit segment New members' }))
            .toBeDisabled()
        await act(async () => { resolveOlder([segment]) })
        fireEvent.click(screen.getByRole('tab', { name: 'Campaigns' }))
        fireEvent.click(screen.getByRole('tab', { name: 'Segments' }))
        fireEvent.click(screen.getByRole('button', { name: 'Edit segment New members' }))
        expect(screen.getByLabelText('Countries (ISO codes)'))
            .toHaveValue('CA')
        expect(contactPatch)
            .toHaveBeenCalledTimes(1)
    })

    it('retains confirmed creation and deletion across failed refreshes and tab remounts', async () => {
        const created = { ...segment, id: 'segment-created', name: 'Created members' }
        const lists = jest.fn()
            .mockResolvedValueOnce([segment])
            .mockRejectedValue(new Error('List unavailable.'));
        (contactGet as jest.Mock).mockImplementation((path: string) => {
            if (path === 'segments') return lists()
            return Promise.resolve(path === 'config'
                ? { sendingEnabled: false, subscriptionTypes: [], warnings: [] }
                : [])
        });
        (contactPost as jest.Mock).mockResolvedValue(created)
        render(<ContactApp />)
        await screen.findByRole('heading', { name: 'Email campaigns' })
        fireEvent.click(screen.getByRole('tab', { name: 'Segments' }))
        fireEvent.click(screen.getByRole('button', { name: 'Add segment' }))
        fireEvent.change(screen.getByLabelText('Segment name'), { target: { value: created.name } })
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save segment' })) })
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('List unavailable.')
        fireEvent.click(screen.getByRole('tab', { name: 'Campaigns' }))
        fireEvent.click(screen.getByRole('tab', { name: 'Segments' }))
        expect(screen.getByRole('rowheader', { name: created.name }))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: `Delete segment ${created.name}` }))
        await act(async () => {
            fireEvent.click(within(screen.getByRole('dialog'))
                .getByRole('button', { name: 'Delete segment' }))
        })
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('List unavailable.')
        fireEvent.click(screen.getByRole('tab', { name: 'Campaigns' }))
        fireEvent.click(screen.getByRole('tab', { name: 'Segments' }))
        expect(screen.queryByRole('rowheader', { name: created.name })).not.toBeInTheDocument()
        expect(screen.getByRole('rowheader', { name: segment.name }))
            .toBeInTheDocument()
        expect(contactPost)
            .toHaveBeenCalledTimes(1)
        expect(contactDelete)
            .toHaveBeenCalledWith('segments/segment-created')
    })

    it('locks stale actions through slow/failed refresh and unlocks after retry without another write', async () => {
        let rejectRefresh: (error: Error) => void = () => undefined
        const firstRefresh = new Promise<void>((_, reject) => { rejectRefresh = reject })
        let resolveRetry: () => void = () => undefined
        const retryRefresh = new Promise<void>(resolve => { resolveRetry = resolve })
        const refresh = jest.fn()
            .mockReturnValueOnce(firstRefresh)
            .mockReturnValueOnce(retryRefresh)
        const view = render(<SegmentManager
            onSaved={saved}
            onDeleted={deleted}
            segments={[segment]}
            onRefresh={refresh}
        />)
        fireEvent.click(screen.getByRole('button', { name: 'Add segment' }))
        fireEvent.change(screen.getByLabelText('Segment name'), { target: { value: 'Saved once' } })
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save segment' })) })
        const mutationNames = ['Add segment', 'Edit segment New members', 'Delete segment New members']
        for (const name of mutationNames) {
            expect(screen.getByRole('button', { name }))
                .toBeDisabled()
        }

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        await act(async () => { rejectRefresh(new Error('List unavailable.')) })
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('The segment list could not be refreshed.')
        for (const name of mutationNames) {
            expect(screen.getByRole('button', { name }))
                .toBeDisabled()
        }

        expect(screen.getByRole('status'))
            .toHaveTextContent('Segment created.')
        expect(screen.getByRole('button', { name: 'Retry loading segments' }))
            .toBeEnabled()
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retry loading segments' })) })
        for (const name of mutationNames) {
            expect(screen.getByRole('button', { name }))
                .toBeDisabled()
        }

        await act(async () => {
            view.rerender(<SegmentManager
                onSaved={saved}
                onDeleted={deleted}
                segments={[{ ...segment, filter: { countries: ['CA'] } }]}
                onRefresh={refresh}
            />)
            resolveRetry()
        })
        for (const name of mutationNames) {
            expect(screen.getByRole('button', { name }))
                .toBeEnabled()
        }

        fireEvent.click(screen.getByRole('button', { name: 'Edit segment New members' }))
        expect(screen.getByLabelText('Countries (ISO codes)'))
            .toHaveValue('CA')
        expect(refresh)
            .toHaveBeenCalledTimes(2)
        expect(contactPost)
            .toHaveBeenCalledTimes(1)
    })
})
