/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    getFlexiEngagementDetail,
    getFlexiEngagementList,
    getFlexiEngagementSummary,
} from '../../../../lib'

import { EngagementsView } from './EngagementsView'

const mockGetFlexiEngagementSummary = getFlexiEngagementSummary as jest.Mock
const mockGetFlexiEngagementList = getFlexiEngagementList as jest.Mock
const mockGetFlexiEngagementDetail = getFlexiEngagementDetail as jest.Mock

jest.mock('~/apps/admin/src/lib/components/common/Pagination', () => ({
    Pagination: () => <div>pagination</div>,
}), { virtual: true })

jest.mock('~/libs/shared/lib/utils/rich-text', () => ({
    renderRichTextToHtml: jest.fn(() => ''),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ArrowDownIcon: () => <span>arrow-down-icon</span>,
        ArrowUpIcon: () => <span>arrow-up-icon</span>,
        DocumentSearchIcon: () => <span>document-search-icon</span>,
        ExclamationCircleIcon: () => <span>error-icon</span>,
        ExternalLinkIcon: () => <span>external-link-icon</span>,
        InboxIcon: () => <span>inbox-icon</span>,
        SearchIcon: () => <span>search-icon</span>,
        XIcon: () => <span>x-icon</span>,
    },
}), { virtual: true })

jest.mock('../../../../lib', () => ({
    getFlexiEngagementDetail: jest.fn(),
    getFlexiEngagementList: jest.fn(),
    getFlexiEngagementSummary: jest.fn(),
}))

const inactiveAssignments = [
    {
        assignmentId: 'assignment-completed',
        displayStatusLabel: 'Completed',
        durationLabel: '1 month',
        engagementId: 'engagement-1',
        isOverdue: true,
        memberHandle: 'completed_member',
        memberId: 'member-completed',
        projectId: 'project-1',
        resolvedEndDate: '2026-04-24T00:00:00.000Z',
        startDate: '2026-05-02T00:00:00.000Z',
        status: 'completed',
        timeLeftDays: -76,
    },
    {
        assignmentId: 'assignment-offer-rejected',
        displayStatusLabel: 'Offer Rejected',
        durationLabel: '1 month',
        engagementId: 'engagement-1',
        isOverdue: true,
        memberHandle: 'offer_rejected_member',
        memberId: 'member-offer-rejected',
        projectId: 'project-1',
        resolvedEndDate: '2026-05-25T00:00:00.000Z',
        startDate: '2026-04-25T00:00:00.000Z',
        status: 'offer_rejected',
        timeLeftDays: -45,
    },
    {
        assignmentId: 'assignment-terminated',
        displayStatusLabel: 'Terminated',
        durationLabel: '1 month',
        engagementId: 'engagement-1',
        isOverdue: true,
        memberHandle: 'terminated_member',
        memberId: 'member-terminated',
        projectId: 'project-1',
        resolvedEndDate: '2026-06-01T00:00:00.000Z',
        startDate: '2026-05-01T00:00:00.000Z',
        status: 'terminated',
        timeLeftDays: -38,
    },
]

describe('EngagementsView', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockGetFlexiEngagementSummary.mockResolvedValue({
            active: 1,
            closed: 0,
            total: 1,
        })
        mockGetFlexiEngagementList.mockResolvedValue({
            data: [{
                assignedMemberCount: 0,
                engagementId: 'engagement-1',
                engagementTitle: 'Flexi Talent Engagement',
                projectId: 'project-1',
                projectName: 'Flexi Project',
                requiredMemberCount: 3,
                status: 'active',
            }],
            page: 1,
            perPage: 10,
            total: 1,
            totalPages: 1,
        })
        mockGetFlexiEngagementDetail.mockResolvedValue({
            assignedMemberCount: 0,
            assignments: inactiveAssignments,
            description: '',
            engagementId: 'engagement-1',
            engagementTitle: 'Flexi Talent Engagement',
            projectId: 'project-1',
            projectName: 'Flexi Project',
            requiredMemberCount: 3,
            skills: [],
            status: 'active',
            workLinks: {},
        })
    })

    it('hides time-left metadata for inactive assignment statuses', async () => {
        render(<EngagementsView />)

        expect(await screen.findByText('completed_member'))
            .toBeInTheDocument()
        expect(screen.getByText('Offer Rejected'))
            .toBeInTheDocument()
        expect(screen.getByText('terminated_member'))
            .toBeInTheDocument()
        expect(screen.queryByText('Time Left'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('76 days overdue'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('45 days overdue'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('38 days overdue'))
            .not.toBeInTheDocument()
    })

    it('refreshes engagement bucket counts whenever the list refreshes', async () => {
        mockGetFlexiEngagementSummary
            .mockResolvedValueOnce({
                active: 1,
                closed: 0,
                total: 1,
            })
            .mockResolvedValueOnce({
                active: 2,
                closed: 0,
                total: 2,
            })
        mockGetFlexiEngagementList
            .mockResolvedValueOnce({
                data: [],
                page: 1,
                perPage: 10,
                total: 1,
                totalPages: 1,
            })
            .mockResolvedValueOnce({
                data: [],
                page: 1,
                perPage: 10,
                total: 2,
                totalPages: 1,
            })

        render(<EngagementsView />)

        expect(await screen.findByRole('button', { name: 'Active 1' }))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /Name/ }))

        await waitFor(() => {
            expect(mockGetFlexiEngagementSummary)
                .toHaveBeenCalledTimes(2)
        })
        expect(await screen.findByRole('button', { name: 'Active 2' }))
            .toBeInTheDocument()
        expect(screen.getByText('2 engagements'))
            .toBeInTheDocument()
    })
})
