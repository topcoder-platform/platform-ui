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
    getFlexiMemberDetail,
    getFlexiMemberList,
    getFlexiMemberSummary,
} from '../../../../lib'

import { MembersView } from './MembersView'

const mockGetFlexiMemberSummary = getFlexiMemberSummary as jest.Mock
const mockGetFlexiMemberList = getFlexiMemberList as jest.Mock
const mockGetFlexiMemberDetail = getFlexiMemberDetail as jest.Mock

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
