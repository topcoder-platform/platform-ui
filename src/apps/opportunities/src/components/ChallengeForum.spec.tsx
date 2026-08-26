/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import { act } from 'react'
import {
    fireEvent,
    render,
    RenderResult,
    screen,
    waitFor,
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
    forumRatingClass,
    formatForumDate,
    plainForumExcerpt,
    wrapMarkdownSelection,
} from './ChallengeForum'

const mockCreateForumPost = jest.fn()
const mockCreateForumTopic = jest.fn()
const mockDeleteForumPost = jest.fn()
const mockDeleteForumTopic = jest.fn()
const mockMarkForumTopicRead = jest.fn()
const mockSetForumTopicWatching = jest.fn()
const mockUseSWR = jest.fn()
const mockUpdateForumPost = jest.fn()
const mockUpdateForumTopic = jest.fn()
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
    createForumPost: (...args: unknown[]) => mockCreateForumPost(...args),
    createForumTopic: (...args: unknown[]) => mockCreateForumTopic(...args),
    deleteForumPost: (...args: unknown[]) => mockDeleteForumPost(...args),
    deleteForumTopic: (...args: unknown[]) => mockDeleteForumTopic(...args),
    getChallengeForumTopics: jest.fn(),
    getForumTopicDetail: jest.fn(),
    getMemberProfilesByUserIds: jest.fn(),
    markForumTopicRead: (...args: unknown[]) => mockMarkForumTopicRead(...args),
    setForumTopicWatching: (...args: unknown[]) => mockSetForumTopicWatching(...args),
    updateForumPost: (...args: unknown[]) => mockUpdateForumPost(...args),
    updateForumTopic: (...args: unknown[]) => mockUpdateForumTopic(...args),
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
    participants: [
        { handle: 'DaraK', memberId: '1' },
        { handle: 'Yoki', memberId: '2' },
    ],
    participantsCount: 2,
    postsCount: 2,
    roleName: null,
    starterPostExcerpt: 'Welcome to the challenge.',
    title: 'Welcome to React Component Library Development Challenge',
    unread: true,
    updatedAt: '2026-06-07T10:15:00.000Z',
    viewsCount: 48,
    watching: true,
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
    authorPostsCount: 123,
    content: 'Welcome **competitors**.',
    createdAt: '2026-06-06T00:05:00.000Z',
    deleted: false,
    id: 'post-1',
    parentId: 'topic-1',
    parentType: 'TOPIC',
    replies: [{
        authorHandle: 'Yoki',
        authorMemberId: '2',
        authorPostsCount: 12,
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
        mockCreateForumPost.mockResolvedValue({ id: 'post-3' })
        mockCreateForumTopic.mockResolvedValue({
            starterPost: { id: 'post-3' },
            topic: { id: 'topic-3' },
        })
        mockMarkForumTopicRead.mockResolvedValue(undefined)
        mockSetForumTopicWatching.mockResolvedValue({ watching: false })
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
        expect(screen.getByRole('button', { name: /Create new topic/ }))
            .toBeInTheDocument()
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

    it('opens an embedded post tree and keeps replies and comments in-page', async () => {
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />)
        await act(async () => fireEvent.click(screen.getByRole('button', { name: announcement.title })))

        expect(screen.getByRole('button', { name: announcement.title }))
            .toBeInTheDocument()
        expect(screen.getByText('Welcome **competitors**.'))
            .toBeInTheDocument()
        expect(screen.getByText('Thanks for the clarification.'))
            .toBeInTheDocument()
        expect(screen.getAllByText('Author'))
            .toHaveLength(2)
        expect(screen.getAllByRole('button', { name: 'Reply' }))
            .toHaveLength(2)
        fireEvent.change(screen.getByPlaceholderText('Type here'), {
            target: { value: 'A new in-page comment' },
        })
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Post comment' })))

        await waitFor(() => expect(mockCreateForumPost)
            .toHaveBeenCalledWith('topic-1', { content: 'A new in-page comment' }))
        expect(mockMarkForumTopicRead)
            .toHaveBeenCalledWith('topic-1')
    })

    it('creates a challenge topic without leaving Opportunities', async () => {
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />)
        fireEvent.click(screen.getByRole('button', { name: /Create new topic/ }))
        expect(screen.queryByRole('checkbox', { name: /Post as announcement/ }))
            .not.toBeInTheDocument()
        fireEvent.change(screen.getByPlaceholderText(/clear, descriptive title/), {
            target: { value: 'Clarify the API contract' },
        })
        fireEvent.change(screen.getByPlaceholderText(/Describe your question/), {
            target: { value: 'Can the maintainers clarify the response type?' },
        })
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Create topic' })))

        await waitFor(() => expect(mockCreateForumTopic)
            .toHaveBeenCalledWith({
                challengeId: 'challenge-id',
                content: 'Can the maintainers clarify the response type?',
                title: 'Clarify the API contract',
            }))
    })

    it('lets an administrator create a challenge announcement', async () => {
        render(
            <ChallengeForum
                canCreateAnnouncements
                challenge={{ id: 'challenge-id', name: 'Challenge' }}
                memberId='10'
            />,
        )
        fireEvent.click(screen.getByRole('button', { name: /Create new topic/ }))
        fireEvent.change(screen.getByPlaceholderText(/clear, descriptive title/), {
            target: { value: 'Submission deadline extended' },
        })
        fireEvent.change(screen.getByPlaceholderText(/Describe your question/), {
            target: { value: 'The submission deadline is now Friday at 18:00 UTC.' },
        })
        fireEvent.click(screen.getByRole('checkbox', { name: /Post as announcement/ }))
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Create topic' })))

        await waitFor(() => expect(mockCreateForumTopic)
            .toHaveBeenCalledWith({
                challengeId: 'challenge-id',
                content: 'The submission deadline is now Friday at 18:00 UTC.',
                isAnnouncement: true,
                title: 'Submission deadline extended',
            }))
    })

    it('toggles topic watches through forums-api-v6', async () => {
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />)
        await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Watched' })[0]))

        await waitFor(() => expect(mockSetForumTopicWatching)
            .toHaveBeenCalledWith('topic-1', false))
    })

    it('keeps legacy topic summaries usable while the enriched API rolls out', () => {
        topicCollection = {
            data: [{
                ...announcement,
                participants: undefined,
                participantsCount: undefined,
                viewsCount: undefined,
                watching: undefined,
            } as unknown as ForumTopicSummary],
            sourceTotalCount: 1,
            truncated: false,
        }

        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} memberId='10' />)

        expect(screen.getByRole('button', { name: announcement.title }))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Participants: DaraK, Yoki'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Watch' }))
            .toBeInTheDocument()
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
        expect(screen.getByRole('link', { name: /Open legacy forum/ }))
            .toHaveAttribute('href', 'https://forum.example/challenge')
    })

    it('does not attempt an authenticated embed for signed-out members', () => {
        render(<ChallengeForum challenge={{ id: 'challenge-id', name: 'Challenge' }} />)

        expect(screen.getByText(/Sign in to read and join this challenge discussion/))
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
        expect(forumStyles)
            .toContain('color: #f2c900;')
        expect(forumStyles)
            .not.toContain('#8d8d8d')
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

    it('normalizes list excerpts and wraps editor selections', () => {
        expect(plainForumExcerpt('Use **strong** [guidance](https://example.com).'))
            .toBe('Use strong guidance.')
        expect(wrapMarkdownSelection('hello world', 6, 11, '**', '**'))
            .toEqual({
                selectionEnd: 13,
                selectionStart: 8,
                value: 'hello **world**',
            })
    })

    it('maps public ratings to the August 2026 handle palette', () => {
        expect(forumRatingClass())
            .toBe('ratingGray')
        expect(forumRatingClass(1000))
            .toBe('ratingGreen')
        expect(forumRatingClass(1300))
            .toBe('ratingBlue')
        expect(forumRatingClass(1800))
            .toBe('ratingYellow')
        expect(forumRatingClass(2400))
            .toBe('ratingRed')
    })
})
