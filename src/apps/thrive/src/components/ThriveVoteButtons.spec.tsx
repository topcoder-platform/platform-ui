/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable unicorn/no-null -- the website API reports "no vote" as JSON null. */
import type { Context } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { castThriveVote, getThriveVote } from '../services/thrive-votes.service'

import { ThriveVoteButtons } from './ThriveVoteButtons'

const mockProfileContext = { initialized: true, profile: { handle: 'ada', userId: 7 } as unknown }

jest.mock('~/libs/core', () => {
    const react = jest.requireActual('react')
    return {
        authUrlLogin: (returnUrl: string) => `https://accounts.example/?retUrl=${encodeURIComponent(returnUrl)}`,
        profileContext: react.createContext(undefined),
    }
}, { virtual: true })
jest.mock('../services/thrive-votes.service', () => ({
    castThriveVote: jest.fn(),
    getThriveVote: jest.fn(),
}))
jest.mock('../Thrive.module.scss', () => ({}))

/** Renders the buttons inside the mocked profile context. */
function renderButtons(): void {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { profileContext }: { profileContext: Context<unknown> } = require('~/libs/core')

    render(
        <profileContext.Provider value={mockProfileContext}>
            <ThriveVoteButtons articleId='article-1' downvotes={1} upvotes={5} />
        </profileContext.Provider>,
    )
}

describe('ThriveVoteButtons', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockProfileContext.profile = { handle: 'ada', userId: 7 }
    })

    it('loads the member vote and toggles it through the website API', async () => {
        (getThriveVote as jest.Mock).mockResolvedValue({ downvotes: 1, upvotes: 6, vote: 'up' });
        (castThriveVote as jest.Mock).mockResolvedValue({ downvotes: 1, upvotes: 5, vote: null })
        renderButtons()

        const like = await screen.findByRole('button', { name: 'Like this article (6 likes)' })
        expect(like.getAttribute('aria-pressed'))
            .toBe('true')
        await act(async () => {
            fireEvent.click(like)
        })
        expect(castThriveVote)
            .toHaveBeenCalledWith('article-1', 'none')
        expect(await screen.findByRole('button', { name: 'Like this article (5 likes)' }))
            .toBeTruthy()

        const castMock = castThriveVote as jest.Mock
        castMock.mockResolvedValue({ downvotes: 2, upvotes: 5, vote: 'down' })
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Dislike this article (1 dislikes)' }))
        })
        expect(castThriveVote)
            .toHaveBeenLastCalledWith('article-1', 'down')
    })

    it('shows a retryable message when a vote cannot be saved', async () => {
        (getThriveVote as jest.Mock).mockResolvedValue({ downvotes: 1, upvotes: 5, vote: null });
        (castThriveVote as jest.Mock).mockRejectedValue(new Error('We could not save your vote. Please try again.'))
        renderButtons()

        await waitFor(() => expect(getThriveVote)
            .toHaveBeenCalledWith('article-1'))
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Like this article (5 likes)' }))
        })
        expect((await screen.findByRole('alert')).textContent)
            .toBe('We could not save your vote. Please try again.')
    })

    it('sends visitors to login instead of voting', async () => {
        mockProfileContext.profile = undefined
        const assign = jest.fn()
        const location = window.location
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...location, assign, href: 'https://www.topcoder-dev.com/thrive/articles/a' },
        })
        renderButtons()

        fireEvent.click(screen.getByRole('button', { name: 'Like this article (5 likes)' }))
        const returnUrl = encodeURIComponent('https://www.topcoder-dev.com/thrive/articles/a')
        expect(assign)
            .toHaveBeenCalledWith(`https://accounts.example/?retUrl=${returnUrl}`)
        expect(getThriveVote).not.toHaveBeenCalled()
        expect(castThriveVote).not.toHaveBeenCalled()
        Object.defineProperty(window, 'location', { configurable: true, value: location })
    })
})
