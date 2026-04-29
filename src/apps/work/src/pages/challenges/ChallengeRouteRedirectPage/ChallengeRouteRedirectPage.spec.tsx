/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import {
    useFetchChallenge,
} from '../../../lib/hooks'

import { ChallengeRouteRedirectPage } from './ChallengeRouteRedirectPage'

jest.mock('../../../lib/components', () => ({
    ErrorMessage: (props: { message: string; onRetry?: () => void }) => (
        <div>
            <span>{props.message}</span>
            {props.onRetry
                ? (
                    <button onClick={props.onRetry} type='button'>
                        Retry
                    </button>
                )
                : undefined}
        </div>
    ),
    LoadingSpinner: () => <div>Loading</div>,
}))

jest.mock('../../../lib/hooks', () => ({
    useFetchChallenge: jest.fn(),
}))

const mockedUseFetchChallenge = useFetchChallenge as jest.Mock

describe('ChallengeRouteRedirectPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('shows the existing generic error panel instead of redirecting after a challenge fetch error', () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: undefined,
            error: new Error('Forbidden'),
            isError: true,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <MemoryRouter initialEntries={['/challenges/challenge-1']}>
                <Routes>
                    <Route path='/challenges/:challengeId' element={<ChallengeRouteRedirectPage />} />
                    <Route path='/challenges/:challengeId/view' element={<div>Redirected</div>} />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.getByText('Forbidden'))
            .toBeTruthy()
        expect(screen.queryByText('Redirected'))
            .toBeNull()
    })
})
