/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import { readFileSync } from 'fs'
import React from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    getFlexiMemberDetail,
    getFlexiMemberList,
    getFlexiMemberSummary,
} from '../../../../lib'

import { MembersView } from './MembersView'

const mockGetFlexiMemberSummary = getFlexiMemberSummary as jest.Mock
const mockGetFlexiMemberList = getFlexiMemberList as jest.Mock
const mockGetFlexiMemberDetail = getFlexiMemberDetail as jest.Mock
const flexiTalentPageStyles = readFileSync(
    `${__dirname}/../../FlexiTalentPage/FlexiTalentPage.module.scss`,
    'utf8',
)
const detailCapacityWrappingPattern = [
    '[.]detailCapacity \\{',
    '[^}]*box-sizing: border-box;',
    '[^}]*max-width: 100%;',
    '[^}]*overflow-wrap: anywhere;',
    '[^}]*white-space: normal;',
    '[^}]*\\}',
].join('')

jest.mock('~/apps/admin/src/lib/components/common/Pagination', () => ({
    Pagination: () => <div>pagination</div>,
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        USER_PROFILE_URL: 'https://profiles.topcoder-dev.com',
    },
}), { virtual: true })

jest.mock('~/libs/shared/lib/utils/rich-text', () => ({
    renderRichTextToHtml: jest.fn(() => ''),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ArrowDownIcon: () => <span>arrow-down-icon</span>,
        ArrowUpIcon: () => <span>arrow-up-icon</span>,
        ClockIcon: () => <span>clock-icon</span>,
        DocumentSearchIcon: () => <span>document-search-icon</span>,
        ExclamationCircleIcon: () => <span>error-icon</span>,
        ExternalLinkIcon: () => <span>external-link-icon</span>,
        InboxIcon: () => <span>inbox-icon</span>,
        SearchIcon: () => <span>search-icon</span>,
        XIcon: () => <span>x-icon</span>,
    },
}), { virtual: true })

jest.mock('../../../../lib', () => ({
    getFlexiMemberDetail: jest.fn(),
    getFlexiMemberList: jest.fn(),
    getFlexiMemberSummary: jest.fn(),
}))

jest.mock('../MemberHistoryModal', () => ({
    MemberHistoryModal: () => undefined,
}))

describe('MembersView styles', () => {
    it('allows long assignment labels to wrap within the member detail card', () => {
        expect(flexiTalentPageStyles)
            .toMatch(new RegExp(detailCapacityWrappingPattern))
    })
})

describe('MembersView', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockGetFlexiMemberSummary.mockResolvedValue({
            assignedMembers: 1,
            completedMembers: 0,
            totalUniqueMembers: 1,
        })
        mockGetFlexiMemberList.mockResolvedValue({
            data: [],
            page: 1,
            perPage: 10,
            total: 1,
            totalPages: 1,
        })
        mockGetFlexiMemberDetail.mockResolvedValue({})
    })

    it.each([
        {
            projectUrl: 'https://work.topcoder-dev.com/projects/1',
            engagementUrl: 'https://work.topcoder-dev.com/engagements/2',
            assigneeDetailsUrl: 'https://work.topcoder-dev.com/engagements/2/assignments/3',
        },
        {},
    ])('links to the completed member profile with work links %j', async workLinks => {
        const member = {
            memberId: '123',
            handle: 'member+name',
            isCurrentlyAssigned: false,
            displayStatusLabel: 'Completed',
            workLinks,
        }
        mockGetFlexiMemberSummary.mockResolvedValue({
            assignedMembers: 0,
            completedMembers: 1,
            totalUniqueMembers: 1,
        })
        mockGetFlexiMemberList.mockResolvedValue({
            data: [member],
            page: 1,
            perPage: 10,
            total: 1,
            totalPages: 1,
        })
        mockGetFlexiMemberDetail.mockResolvedValue(member)

        render(<MembersView isActive />)

        fireEvent.click(await screen.findByRole('button', { name: 'Completed 1' }))

        const profileLink = await screen.findByRole('link', { name: /View Profile/ })
        expect(profileLink)
            .toHaveAttribute('href', 'https://profiles.topcoder-dev.com/member%2Bname')
        expect(profileLink)
            .toHaveAttribute('target', '_blank')
        expect(profileLink)
            .toHaveAttribute('rel', 'noopener noreferrer')
        Object.values(workLinks)
            .forEach(url => {
                expect(screen.getAllByRole('link')
                    .some(link => link.getAttribute('href') === url))
                    .toBe(true)
            })
    })

    it('refreshes member bucket counts whenever the list refreshes', async () => {
        mockGetFlexiMemberSummary
            .mockResolvedValueOnce({
                assignedMembers: 1,
                completedMembers: 0,
                totalUniqueMembers: 1,
            })
            .mockResolvedValueOnce({
                assignedMembers: 2,
                completedMembers: 0,
                totalUniqueMembers: 2,
            })
        mockGetFlexiMemberList
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

        render(<MembersView isActive />)

        expect(await screen.findByRole('button', { name: 'Total Unique Members 1' }))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /Handle/ }))

        await waitFor(() => {
            expect(mockGetFlexiMemberSummary)
                .toHaveBeenCalledTimes(2)
        })
        expect(await screen.findByRole('button', { name: 'Total Unique Members 2' }))
            .toBeInTheDocument()
        expect(screen.getByText('2 members'))
            .toBeInTheDocument()
    })
})
