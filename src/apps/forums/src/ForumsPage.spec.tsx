/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'

import type { PublicForumCategory } from './forums.service'

const mockGetPublicForumCategories = jest.fn()
const mockGetPublicForumTopics = jest.fn()
const mockForumTopicCard = jest.fn()
let mockProfile: { roles: string[]; userId: number } | undefined

jest.mock('~/config', () => ({
    AppSubdomain: { forums: 'forums' },
    EnvironmentConfig: { API: { V6: '' }, SUBDOMAIN: 'forums' },
    ToolTitle: { forums: 'Forums' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    authUrlLogin: () => '/login',
    lazyLoad: () => () => <div />,
    useProfileContext: () => ({ initialized: true, profile: mockProfile }),
}), { virtual: true })
jest.mock('~/libs/ui', () => ({ ConfirmModal: () => <div /> }), { virtual: true })
jest.mock('~/apps/opportunities/src/components/ChallengeForum', () => ({
    flattenForumPosts: () => [],
    formatForumDate: () => 'date',
    forumErrorMessage: () => 'error',
    ForumMember: (props: { handle: string }) => <span>{props.handle}</span>,
    ForumTopicCard: (props: { topic: { id: string } }) => {
        mockForumTopicCard(props.topic.id)
        return <div>{`topic card ${props.topic.id}`}</div>
    },
    ForumTopicEditModal: () => <div />,
    ForumTopicView: () => <div />,
    MarkdownEditor: () => <div />,
    ParticipantGroup: () => <div />,
}), { virtual: true })
jest.mock('~/apps/opportunities/src/components/OpportunityPagination', () => ({
    OpportunityPagination: () => <div />,
}), { virtual: true })
jest.mock('~/apps/opportunities/src/models', () => ({}), { virtual: true })
jest.mock('~/apps/opportunities/src/services', () => ({
    createForumTopic: jest.fn(),
    deleteForumTopic: jest.fn(),
    getForumTopicDetail: jest.fn(),
    getMemberProfilesByUserIds: jest.fn(() => Promise.resolve([])),
    markForumTopicRead: jest.fn(),
    setForumTopicWatching: jest.fn(),
    updateForumPost: jest.fn(),
    updateForumTopic: jest.fn(),
}), { virtual: true })
jest.mock('./forums.service', () => ({
    getPublicForumCategories: () => mockGetPublicForumCategories(),
    getPublicForumTopics: (query: string) => mockGetPublicForumTopics(query),
}))
const icons = [
    '0a628', '171f8', '1bd8b', '36954', '3faa9', '6292b', '74494', '78d47', 'a02e3', 'bfe3c', 'ce6d4', 'f8147',
    'watched',
]
for (const icon of icons) {
    jest.mock(`~/apps/opportunities/src/assets/forums/${icon}.svg`, () => 'icon.svg', { virtual: true })
}

const ForumsPage = require('./ForumsPage').default as typeof import('./ForumsPage').default

/** Builds a category card fixture.
 * @param id Category ID. @param title Display title. @param parentTopicId Parent, if nested.
 * @param legacy Whether the migration authored it. @returns Minimal public category. @throws Never.
 */
function category(id: string, title: string, parentTopicId?: string, legacy: boolean = false): PublicForumCategory {
    return {
        authorHandle: legacy ? 'Legacy forums' : 'member',
        authorMemberId: legacy ? 'legacy-jive:migration' : '12345',
        canCreate: !legacy,
        createdAt: '2024-01-01T00:00:00.000Z',
        description: '',
        displayAs: 'Categories',
        id,
        parentTopicId,
        participants: [],
        participantsCount: 0,
        postsCount: 0,
        sortOrder: 0,
        title,
        topicsCount: 0,
    } as unknown as PublicForumCategory
}

const currentForums = [category('general', 'General'), category('general-discussion', 'General Discussion', 'general')]
const legacyForums = [
    category('legacy', 'Legacy forums', undefined, true),
    category('jive', 'Jive / Jive2', 'legacy', true),
    category('algorithm', 'Algorithm Discussions', 'jive', true),
    category('arena', 'Topcoder Arena Discussion', 'algorithm', true),
    category('studio', 'Studio', 'legacy', true),
    category('studio-round-tables', 'Round Tables', 'studio', true),
]

/** Renders the page at a route with a fresh SWR cache and the real public route parameters.
 * @param path Memory router entry. @returns Nothing. @throws Never.
 */
function renderPage(path: string): void {
    render(
        <MemoryRouter initialEntries={[path]}>
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <Routes>
                    <Route element={<ForumsPage />} path='/' />
                    <Route element={<ForumsPage legacy />} path='/legacy' />
                    <Route element={<ForumsPage />} path='/category/:categoryId' />
                </Routes>
            </SWRConfig>
        </MemoryRouter>,
    )
}

/** Builds a minimal topic summary as the topics endpoint returns it for a watched category.
 * @param id Topic or category ID. @param title Display title. @returns Bare summary. @throws Never.
 */
function topicSummary(id: string, title: string): Record<string, unknown> {
    return {
        authorHandle: 'member',
        authorMemberId: '12345',
        createdAt: '2024-01-01T00:00:00.000Z',
        id,
        latestActivity: undefined,
        participants: [],
        participantsCount: 0,
        postsCount: 0,
        title,
        unread: false,
        viewsCount: 0,
        watching: true,
    }
}

describe('ForumsPage legacy archive', () => {
    beforeEach(() => {
        window.scrollTo = jest.fn()
        window.localStorage.clear()
        mockProfile = undefined
        mockForumTopicCard.mockClear()
        mockGetPublicForumCategories.mockResolvedValue([...currentForums, ...legacyForums])
        mockGetPublicForumTopics.mockResolvedValue({ data: [], meta: { totalCount: 0, totalPages: 0 } })
    })

    it('hides the legacy root from the index and links to the archive', async () => {
        renderPage('/')
        expect(await screen.findByRole('button', { name: 'General' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Legacy forums' }))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Jive / Jive2'))
            .not.toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 1, name: 'Public Forums' }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: 'Legacy forums' }))
            .toBeInTheDocument()
        expect(screen.getByText(/Our forums history goes back over 20 years/))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'here' }))
            .toHaveAttribute('href', '/legacy')
        expect(screen.queryByRole('heading', { level: 2, name: 'Public forums' }))
            .not.toBeInTheDocument()
    })

    it('omits the archive card when no legacy root exists', async () => {
        mockGetPublicForumCategories.mockResolvedValue(currentForums)
        renderPage('/')
        expect(await screen.findByRole('button', { name: 'General' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('heading', { level: 2, name: 'Legacy forums' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'here' }))
            .not.toBeInTheDocument()
    })

    it('lists the archive without its header or the Jive wrapper and links back to the forums', async () => {
        renderPage('/legacy')
        expect(await screen.findByRole('button', { name: 'Algorithm Discussions' }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Studio' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Topcoder Arena Discussion' }))
            .toHaveAttribute('href', '/category/arena')
        expect(screen.queryByText('Jive / Jive2'))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Legacy forums' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'General' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 1, name: 'Legacy forums' }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: 'Public forums' }))
            .toBeInTheDocument()
        expect(screen.getByText(/Our current forums and discussions can be found/))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'here' }))
            .toHaveAttribute('href', '/')
        expect(screen.queryByRole('heading', { level: 2, name: 'Legacy forums' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Public Forums' }))
            .not.toHaveAttribute('aria-current')
    })

    it('submits and clears the search from the search box', async () => {
        renderPage('/?search=AI')
        expect(await screen.findByRole('heading', { level: 1, name: 'Search results' }))
            .toBeInTheDocument()
        expect(screen.getByText('Showing results for “AI”.'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Search' }))
            .toHaveAttribute('type', 'submit')
        expect(screen.getByRole('textbox', { name: 'Search forums' }))
            .toHaveValue('AI')
        fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
        expect(await screen.findByRole('heading', { level: 1, name: 'Public Forums' }))
            .toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Search forums' }))
            .toHaveValue('')
        expect(screen.queryByRole('button', { name: 'Clear search' }))
            .not.toBeInTheDocument()
    })

    it('shows watched categories with their aggregated category card', async () => {
        mockProfile = { roles: [], userId: 12345 }
        mockGetPublicForumTopics.mockImplementation((query: string) => Promise.resolve(
            query.includes('perPage=1')
                ? { data: [], meta: { totalCount: 1, totalPages: 1 } }
                : {
                    data: [topicSummary('general-discussion', 'General Discussion'), topicSummary('t1', 'Thread')],
                    meta: { totalCount: 2, totalPages: 1 },
                },
        ))
        renderPage('/?watching=true')
        expect(await screen.findByRole('link', { name: 'General Discussion' }))
            .toHaveAttribute('href', '/category/general-discussion')
        expect(screen.getByText('Topics:'))
            .toBeInTheDocument()
        expect(screen.getByText('topic card t1'))
            .toBeInTheDocument()
        expect(mockForumTopicCard)
            .not.toHaveBeenCalledWith('general-discussion')
    })

    it('autosaves, restores and discards a local topic draft', async () => {
        mockProfile = { roles: [], userId: 12345 }
        const key = 'public-forums:draft:12345:general-discussion'
        window.localStorage.setItem(key, JSON.stringify({
            content: 'Saved body',
            savedAt: '2024-01-01T00:00:00.000Z',
            title: 'Saved title',
        }))
        renderPage('/category/general-discussion')
        fireEvent.click(await screen.findByRole('button', { name: 'Continue draft' }))
        expect(screen.getByRole('textbox', { name: 'Topic Title' }))
            .toHaveValue('Saved title')
        fireEvent.change(screen.getByRole('textbox', { name: 'Topic Title' }), { target: { value: 'New title' } })
        await waitFor(() => expect(JSON.parse(window.localStorage.getItem(key) ?? '{}').title)
            .toBe('New title'))
        expect(screen.getByRole('status'))
            .toHaveTextContent('Draft saved in this browser')
        fireEvent.click(screen.getByRole('button', { name: 'Discard draft' }))
        expect(window.localStorage.getItem(key))
            .toBeNull()
        expect(screen.getByRole('textbox', { name: 'Topic Title' }))
            .toHaveValue('')
    })
})
