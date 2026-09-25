/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import useSWR from 'swr'

import { ForumMention } from './ForumMarkdown'

jest.mock('swr', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('~/libs/core', () => ({
    getRatingColor: jest.requireActual('../../../../libs/core/lib/profile/profile-functions/rating.functions')
        .getRatingColor,
}), { virtual: true })
jest.mock('../services', () => ({ getMemberProfileByHandle: jest.fn() }))
jest.mock('../utils', () => ({
    memberProfileUrl: (handle: string): string => `https://profiles.topcoder.com/${encodeURIComponent(handle)}`,
}))
jest.mock('./ChallengeMarkdown', () => ({ ChallengeMarkdown: () => <div /> }))

describe('forum mention profile links', () => {
    it('uses the resolved handle and rating color', () => {
        (useSWR as jest.Mock).mockReturnValue({ data: { handle: 'Member.Name', maxRating: 2300, userId: '42' } })
        render(<ForumMention handle='member.name' />)
        const link = screen.getByRole('link', { name: '@Member.Name' })
        expect(link)
            .toHaveAttribute('href', 'https://profiles.topcoder.com/Member.Name')
        expect(link)
            .toHaveStyle({ color: '#EF3A3A' })
    })

    it('retains a safe profile link when profile enrichment is unavailable', () => {
        (useSWR as jest.Mock).mockReturnValue({ data: undefined })
        render(<ForumMention handle='member+one' />)
        expect(screen.getByRole('link', { name: '@member+one' }))
            .toHaveAttribute('href', 'https://profiles.topcoder.com/member%2Bone')
    })
})
