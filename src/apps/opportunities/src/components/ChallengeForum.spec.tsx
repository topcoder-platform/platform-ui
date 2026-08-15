/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import {
    fireEvent,
    render,
    RenderResult,
    screen,
} from '@testing-library/react'

import {
    ForumPost,
    ForumTopicCollection,
    ForumTopicDetail,
    ForumTopicSummary,
    MemberProfileSummary,
} from '../models'
import {
    ChallengeForum,
    flattenForumPosts,
    formatForumDate,
} from './ChallengeForum'

const mockUseSWR = jest.fn()
let listError: Error | undefined
let memberProfiles: MemberProfileSummary[] | undefined
let topicCollection: ForumTopicCollection | undefined
let topicDetail: ForumTopicDetail | undefined

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading forum</span>,
    }
}, { virtual: true })

jest.mock('../services', () => ({
    getChallengeForumTopics: jest.fn(),
    getForumTopicDetail: jest.fn(),
    getMemberProfilesByUserIds: jest.fn(),
}))

jest.mock('../utils', () => ({
    challengeForumUrl: (): string => 'https://forum.example/challenge',
    memberProfileUrl: (handle: string): string => `https://profiles.example/${handle}`,
}))

jest.mock('./ChallengeMarkdown', () => ({
    ChallengeMarkdown: (props: { markdown: string }): JSX.Element => <div>{props.markdown}</div>,
}))

const announcement: ForumTopicSummary = {
    authorHandle: 'DaraK',
    authorMemberId: '1',
    challengeId: 'challenge-id',
    createdAt: '2026-06-06T00:05:00.000Z',
    id: 'topic-1',
    isAnnouncement: true,
    latestActivity: {
        authorHandle: 'Yoki',
        authorMemberId: '2',
        createdAt: '2026-06-07T10:15:00.000Z',
        postId: 'post-2',
    },
    locked: false,
    lockedAt: null,
    lockedBy: null,
    parentTopicId: null,
    postsCount: 2,
    roleName: null,
    title: 'Welcome to React Component Library Development Challenge',
    unread: true,
    updatedAt: '2026-06-07T10:15:00.000Z',
}

const discussion: ForumTopicSummary = {
    ...announcement,
    authorHandle: 'PereViki',
    authorMemberId: '3',
    id: 'topic-2',
    isAnnouncement: false,
    latestActivity: null,
    postsCount: 1,
    title: 'TypeScript Interface Definitions - Need Clarification',
    unread: false,
}

const starterPost: ForumPost = {
    authorHandle: 'DaraK',
    authorMemberId: '1',
    content: 'Welcome **competitors**.',
    createdAt: '2026-06-06T00:05:00.000Z',
    deleted: false,
    id: 'post-1',
    parentId: 'topic-1',
    parentType: 'TOPIC',
    replies: [{
        authorHandle: 'Yoki',
        authorMemberId: '2',
        content: 'Thanks for the clarification.',
        createdAt: '2026-06-07T10:15:00.000Z',
        deleted: false,
        id: 'post-2',
        parentId: 'post-1',
        parentType: 'POST',
        replies: [],
        topicId: 'topic-1',
        updatedAt: '2026-06-07T10:15:00.000Z',
    }],
    topicId: 'topic-1',
    updatedAt: '2026-06-06T00:05:00.000Z',
}

const forumStyles = readFileSync(`${__dirname}/ChallengeForum.module.scss`, 'utf8')

describe('ChallengeForum', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        listError = undefined
        memberProfiles = [{
            handle: 'DaraK',
            photoURL: 'https://cdn.example/darak.png',
            userId: '1',
        }]
        topicCollection = {
            data: [announcement, discussion],
            sourceTotalCount: 2,
            truncated: false,
        }
        topicDetail = { posts: [starterPost], topic: announcement }
        mockUseSWR.mockImplementation((key: unknown) => {
            if (Array.isArray(key) && key[0] === 'opportunities:forum-topics') {
                return {
                    data: topicCollection,
                    error: listError,
                    isValidating: false,
                    mutate: jest.fn(),
                }
            }

            if (Array.isArray(key) && key[0] === 'opportunities:forum-topic') {
                return {
                    data: topicDetail,
                    error: undefined,
                    isValidating: false,
                    mutate: jest.fn(),
                }
            }

            if (Array.isArray(key) && key[0] === 'opportunities:forum-members') {
                return {
                    data: memberProfiles,
                    error: undefined,
                    isValidating: false,
                    mutate: jest.fn(),
                }
            }

            return {
                data: undefined,
                error: undefined,
                isValidating: false,
                mutate: jest.fn(),
            }
        })
    })

    it('renders Figma topic controls, truthful metrics, local search, and filters', () => {
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />)

        expect(screen.getByRole('heading', { name: 'Challenge Forum' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Create new topic/ }))
            .toHaveAttribute('href', 'https://forum.example/challenge')
        expect(screen.getByRole('button', { name: announcement.title }))
            .toBeInTheDocument()
        expect(screen.getByText('1 new topic'))
            .toBeInTheDocument()

        fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'typescript' } })
        expect(screen.queryByRole('button', { name: announcement.title }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: discussion.title }))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Reset all' }))
        fireEvent.click(screen.getByRole('radio', { name: 'Announcements' }))
        expect(screen.getByRole('button', { name: announcement.title }))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: discussion.title }))
            .not.toBeInTheDocument()
    })

    it('opens a read-only embedded post tree and keeps replies external', () => {
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />)
        fireEvent.click(screen.getByRole('button', { name: announcement.title }))

        expect(screen.getByRole('button', { name: announcement.title }))
            .toBeInTheDocument()
        expect(screen.getByText('Welcome **competitors**.'))
            .toBeInTheDocument()
        expect(screen.getByText('Thanks for the clarification.'))
            .toBeInTheDocument()
        expect(screen.getAllByRole('link', { name: /Reply in forum/ }))
            .toHaveLength(2)
    })

    it('uses public member photos with an initials fallback when an image fails', () => {
        const { container }: RenderResult = render(
            <ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />,
        )
        const profileImage = container.querySelector<HTMLImageElement>(
            'img[src="https://cdn.example/darak.png"]',
        )

        expect(profileImage)
            .toBeInTheDocument()
        const avatar = profileImage?.parentElement
        fireEvent.error(profileImage as HTMLImageElement)
        expect(avatar)
            .toHaveTextContent('D')
        expect(mockUseSWR.mock.calls.some(call => (
            Array.isArray(call[0]) && call[0][0] === 'opportunities:forum-members'
        )))
            .toBe(true)
    })

    it('preserves the external forum when authenticated reads fail or are unavailable', () => {
        listError = new Error('unavailable')
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />)

        expect(screen.getByRole('heading', { name: 'Forum temporarily unavailable' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Open forum/ }))
            .toHaveAttribute('href', 'https://forum.example/challenge')
    })

    it('does not attempt an authenticated embed for signed-out members', () => {
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} />)

        expect(screen.getByText(/Sign in to read challenge discussions here/))
            .toBeInTheDocument()
        expect(mockUseSWR.mock.calls[0][0])
            .toBeUndefined()
    })

    it('matches the Figma desktop forum geometry and core tokens', () => {
        expect(forumStyles)
            .toContain('grid-template-columns: 281px minmax(0, 895px);')
        expect(forumStyles)
            .toContain('gap: 24px;')
        expect(forumStyles)
            .toContain('color: #161616;')
        expect(forumStyles)
            .toContain('background: #007d79;')
    })
})

describe('forum presentation helpers', () => {
    it('flattens nested replies without losing their depth', () => {
        expect(flattenForumPosts([starterPost])
            .map(item => [item.post.id, item.depth]))
            .toEqual([['post-1', 0], ['post-2', 1]])
    })

    it('handles absent and invalid forum dates safely', () => {
        expect(formatForumDate())
            .toBe('—')
        expect(formatForumDate('not-a-date'))
            .toBe('—')
    })
})
